import { handle, json, readJson } from "@/lib/server/http";
import { placeOrder, SHIPPING_AREAS } from "@/lib/server/checkout";
import { customerFromRequest } from "@/lib/server/auth";
import { toCustomerArray } from "@/lib/server/orders";
import { throttle } from "@/lib/server/rateLimit";
import { BD_PHONE, validate, validateItems } from "@/lib/server/validate";

export const POST = handle(async (request) => {
    await throttle(request, "orders", 10);
    const body = await readJson(request);
    const data = validate(
        body,
        {
            customer_name: { required: true, string: true, max: 120 },
            customer_phone: { required: true, string: true, regex: BD_PHONE },
            customer_email: { email: true, max: 150 },
            shipping_address: { required: true, string: true, max: 500 },
            city: { required: true, string: true, max: 100 },
            shipping_area: { required: true, in: Object.keys(SHIPPING_AREAS) },
            note: { string: true, max: 1000 },
            coupon_code: { string: true, max: 50 },
        },
        { "customer_phone.regex": "Please enter a valid Bangladeshi mobile number (e.g. 01712345678)." }
    );
    const items = validateItems(body.items);

    // Guests can order too; a valid customer token links the order to their account.
    const customer = await customerFromRequest(request);
    const { coupon_code, ...fields } = data;
    const order = await placeOrder({ ...fields, user_id: customer?.user.id ?? null }, items, coupon_code);

    return json({ message: "Order placed successfully", data: toCustomerArray(order) }, 201);
});
