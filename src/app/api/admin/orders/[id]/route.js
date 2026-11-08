import { handle, HttpError, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { updateOrder } from "@/lib/server/orders";
import { plain } from "@/lib/server/serialize";
import { validate } from "@/lib/server/validate";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";

/**
 * Update status / payment / delivery details. Only the fields sent are changed, so the
 * quick status buttons can send just { status }.
 * Moving to Cancelled or Returned puts the items back in stock (see updateOrder).
 */
export const PATCH = handle(async (request, { params }) => {
    await requireAdmin(request);
    const { id } = await params;
    if (!/^\d+$/.test(id)) throw new HttpError(404, "Order not found.");

    const body = await readJson(request);
    const rules = {
        status: { required: true, in: Object.keys(ORDER_STATUSES) },
        payment_status: { required: true, in: Object.keys(PAYMENT_STATUSES) },
        customer_name: { required: true, string: true, max: 120 },
        customer_phone: { required: true, string: true, max: 20 },
        shipping_address: { string: true, max: 500 },
        city: { string: true, max: 100 },
        admin_note: { string: true, max: 2000 },
    };
    // Validate only what was sent.
    const sent = Object.fromEntries(Object.entries(rules).filter(([k]) => Object.hasOwn(body, k)));
    const data = validate(body, sent);

    const order = await updateOrder(Number(id), data);
    if (!order) throw new HttpError(404, "Order not found.");
    return json({ message: `Order ${order.order_number} updated.`, data: plain(order) });
});
