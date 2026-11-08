import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { ValidationError } from "./http";
import { round2 } from "./serialize";
import { getSetting } from "./settings";
import { couponDiscount, couponError, normaliseCode } from "./coupons";
import { finalPrice, hasVariants, stockChange, stockFor } from "./products";

export { SHIPPING_AREAS } from "@/lib/orderStatus";

export async function shippingCost(area, amount, client = prisma) {
    const threshold = Number(await getSetting("free_shipping_threshold", 0, client)) || 0;
    if (threshold > 0 && amount >= threshold) return 0;
    return area === "outside_dhaka"
        ? Number(await getSetting("shipping_outside_dhaka", 130, client))
        : Number(await getSetting("shipping_inside_dhaka", 70, client));
}

/**
 * Price a cart entirely from the database so the client can never set its own prices.
 * With `tx` + lock, product rows are locked (SELECT … FOR UPDATE) until the transaction ends.
 */
export async function quote(items, couponCode, area, { tx = prisma, lock = false } = {}) {
    const ids = [...new Set(items.map((i) => i.product_id))];
    if (lock && ids.length) {
        await tx.$queryRaw`SELECT id FROM products WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
    }
    const products = new Map(
        (await tx.product.findMany({ where: { id: { in: ids } } })).map((p) => [p.id, p])
    );

    const lines = [];
    const errors = {};
    const requested = {};

    items.forEach((item, index) => {
        const product = products.get(item.product_id);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        let size = item.size || null;
        const color = item.color || null;

        if (!product || !product.is_active) {
            errors[`items.${index}`] = "A product in your bag is no longer available.";
            return;
        }
        if (hasVariants(product)) {
            if (!size || !product.variants.some((v) => v.size === size)) {
                errors[`items.${index}`] = `Please choose a size for ${product.name}.`;
                return;
            }
        } else {
            size = null;
        }
        const colorNames = (product.colors || []).map((c) => c.name);
        if (colorNames.length && color && !colorNames.includes(color)) {
            errors[`items.${index}`] = `Selected colour is not available for ${product.name}.`;
            return;
        }

        // Total requested per product+size, so two cart lines can't jointly oversell.
        const key = `${product.id}|${size}`;
        requested[key] = (requested[key] || 0) + qty;
        const available = stockFor(product, size);
        if (requested[key] > available) {
            const label = product.name + (size ? ` (${size})` : "");
            errors[`items.${index}`] = available > 0 ? `Only ${available} left of ${label}.` : `${label} is out of stock.`;
            return;
        }

        const unit = finalPrice(product);
        lines.push({
            product,
            product_id: product.id,
            product_name: product.name,
            product_image: product.image,
            size,
            color,
            unit_price: unit,
            quantity: qty,
            line_total: round2(unit * qty),
        });
    });

    const subtotal = round2(lines.reduce((s, l) => s + l.line_total, 0));
    let discount = 0;
    let coupon = null;
    let coupon_error = null;

    if (couponCode && String(couponCode).trim() !== "") {
        coupon = await tx.coupon.findUnique({ where: { code: normaliseCode(couponCode) } });
        if (!coupon) {
            coupon_error = "Invalid coupon code.";
        } else {
            const err = couponError(coupon, subtotal);
            if (err) {
                coupon_error = err;
                coupon = null;
            } else {
                discount = couponDiscount(coupon, subtotal);
            }
        }
    }

    const shipping_cost = await shippingCost(area, subtotal - discount, tx);
    return {
        lines,
        errors,
        coupon,
        coupon_error,
        subtotal,
        discount,
        shipping_cost,
        total: round2(Math.max(0, subtotal - discount) + shipping_cost),
    };
}

export const lineForJson = ({ product, ...line }) => line;

/** Create the order, take stock and claim the coupon in one transaction. */
export async function placeOrder(customer, items, couponCode) {
    return prisma.$transaction(async (tx) => {
        const q = await quote(items, couponCode, customer.shipping_area, { tx, lock: true });
        if (Object.keys(q.errors).length) throw new ValidationError(q.errors);
        if (q.coupon_error) throw new ValidationError({ coupon_code: q.coupon_error });
        if (!q.lines.length) throw new ValidationError({ items: "Your bag is empty." });

        const order = await tx.order.create({
            data: {
                ...customer,
                subtotal: q.subtotal,
                discount: q.discount,
                shipping_cost: q.shipping_cost,
                total: q.total,
                coupon_code: q.coupon?.code ?? null,
                payment_method: "cod",
                payment_status: "unpaid",
                status: "pending",
                order_items: { create: q.lines.map(lineForJson) },
            },
        });

        for (const line of q.lines) {
            // Re-read so two lines of the same product (different sizes) both apply.
            const fresh = await tx.product.findUnique({ where: { id: line.product_id } });
            await tx.product.update({ where: { id: fresh.id }, data: stockChange(fresh, line.size, -line.quantity) });
        }

        if (q.coupon) {
            // Re-check the limit atomically so concurrent orders can't exceed it.
            const claimed = await tx.$executeRaw`
                UPDATE coupons SET used_count = used_count + 1, updated_at = now()
                WHERE id = ${q.coupon.id} AND (usage_limit IS NULL OR used_count < usage_limit)`;
            if (!claimed) throw new ValidationError({ coupon_code: "This coupon has reached its usage limit." });
        }

        return tx.order.update({
            where: { id: order.id },
            data: { order_number: orderNumber(order.id) },
            include: { order_items: true },
        });
    });
}

export const orderNumber = (id) => `NB${String(id).padStart(6, "0")}`;
