import { handle, json, readJson } from "@/lib/server/http";
import { lineForJson, quote, SHIPPING_AREAS } from "@/lib/server/checkout";
import { throttle } from "@/lib/server/rateLimit";
import { validate, validateItems } from "@/lib/server/validate";

/** Server-side price check for the checkout page (subtotal, coupon, shipping, total). */
export const POST = handle(async (request) => {
    await throttle(request, "quote", 60);
    const body = await readJson(request);
    const items = validateItems(body.items);
    const data = validate(body, {
        coupon_code: { string: true, max: 50 },
        shipping_area: { in: Object.keys(SHIPPING_AREAS) },
    });
    const q = await quote(items, data.coupon_code, data.shipping_area);
    return json({
        data: {
            items: q.lines.map(lineForJson),
            errors: q.errors,
            coupon_code: q.coupon?.code ?? null,
            coupon_error: q.coupon_error,
            subtotal: q.subtotal,
            discount: q.discount,
            shipping_cost: q.shipping_cost,
            total: q.total,
        },
    });
});
