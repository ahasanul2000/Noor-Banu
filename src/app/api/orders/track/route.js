import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { toCustomerArray } from "@/lib/server/orders";
import { throttle } from "@/lib/server/rateLimit";
import { validate } from "@/lib/server/validate";

const last11 = (p) => String(p ?? "").replace(/\D/g, "").slice(-11);

/** Customers track an order with its number plus the phone number used to place it. */
export const GET = handle(async (request) => {
    await throttle(request, "track", 20);
    const data = validate(Object.fromEntries(request.nextUrl.searchParams), {
        order_number: { required: true, string: true, max: 30 },
        phone: { required: true, string: true, max: 20 },
    });
    const order = await prisma.order.findUnique({
        where: { order_number: data.order_number.toUpperCase() },
        include: { order_items: true },
    });
    // Compare on the last 11 digits so "+8801..." and "01..." both match.
    if (!order || last11(order.customer_phone) !== last11(data.phone)) {
        return json({ message: "No order found with that number and phone." }, 404);
    }
    return json({ data: toCustomerArray(order) });
});
