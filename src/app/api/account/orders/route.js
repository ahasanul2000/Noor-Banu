import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { requireCustomer } from "@/lib/server/auth";
import { toCustomerArray } from "@/lib/server/orders";

const PER_PAGE = 10;

export const GET = handle(async (request) => {
    const { user } = await requireCustomer(request);
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
    const where = { user_id: user.id };
    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, include: { order_items: true }, orderBy: { id: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    ]);
    return json({
        data: orders.map(toCustomerArray),
        meta: { current_page: page, last_page: Math.max(1, Math.ceil(total / PER_PAGE)), total },
    });
});
