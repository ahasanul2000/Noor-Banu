import { round2 } from "./serialize";

const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const normaliseCode = (code) => String(code ?? "").trim().toUpperCase();

/** Why this coupon can't be used for `subtotal`, or null when it can. */
export function couponError(coupon, subtotal, now = new Date()) {
    if (!coupon.is_active) return "This coupon is not active.";
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return "This coupon is not active yet.";
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return "This coupon has expired.";
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
        return "This coupon has reached its usage limit.";
    }
    if (subtotal < Number(coupon.min_order_amount)) {
        return `Minimum order amount for this coupon is ৳${fmt(coupon.min_order_amount)}.`;
    }
    return null;
}

export function couponDiscount(coupon, subtotal) {
    let discount = coupon.type === "fixed" ? Number(coupon.value) : (subtotal * Number(coupon.value)) / 100;
    const cap = coupon.max_discount === null || coupon.max_discount === undefined ? null : Number(coupon.max_discount);
    if (cap !== null && cap > 0) discount = Math.min(discount, cap);
    return round2(Math.min(discount, subtotal));
}
