import { prisma } from "./db";
import { plain } from "./serialize";
import { stockChange } from "./products";
import { ORDER_STATUSES, RESTOCKED_STATUSES } from "@/lib/orderStatus";

/** What a customer may see about their order (no admin notes). */
export function toCustomerArray(order) {
    const o = plain(order);
    return {
        order_number: o.order_number,
        status: o.status,
        status_label: ORDER_STATUSES[o.status] ?? (o.status ? o.status[0].toUpperCase() + o.status.slice(1) : ""),
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        shipping_address: o.shipping_address,
        city: o.city,
        shipping_area: o.shipping_area,
        subtotal: o.subtotal,
        discount: o.discount,
        shipping_cost: o.shipping_cost,
        total: o.total,
        coupon_code: o.coupon_code,
        created_at: o.created_at,
        items: (o.order_items || []).map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            product_image: i.product_image,
            size: i.size,
            color: i.color,
            unit_price: i.unit_price,
            quantity: i.quantity,
            line_total: i.line_total,
        })),
    };
}

/**
 * Update an order from the admin panel. Moving into Cancelled/Returned puts the items back
 * in stock; moving out of those statuses takes the stock again.
 */
export async function updateOrder(id, data) {
    return prisma.$transaction(async (tx) => {
        const before = await tx.order.findUnique({ where: { id }, include: { order_items: true } });
        if (!before) return null;
        const order = await tx.order.update({ where: { id }, data });

        if (data.status && data.status !== before.status) {
            const was = RESTOCKED_STATUSES.includes(before.status);
            const now = RESTOCKED_STATUSES.includes(order.status);
            if (was !== now) {
                const direction = now ? 1 : -1;
                for (const item of before.order_items) {
                    if (!item.product_id) continue;
                    const product = await tx.product.findUnique({ where: { id: item.product_id } });
                    if (!product) continue;
                    await tx.product.update({
                        where: { id: product.id },
                        data: stockChange(product, item.size, direction * item.quantity),
                    });
                }
            }
        }
        return order;
    });
}
