import "server-only";
import { prisma } from "./db";
import { plain } from "./serialize";
import { totalStock } from "./products";
import { RESTOCKED_STATUSES } from "@/lib/orderStatus";
import { TIME_ZONE } from "@/lib/admin/format";

const LIVE = { status: { notIn: RESTOCKED_STATUSES } }; // orders that still count as sales

/** Start of today / this month / 13 days ago, in shop time (Dhaka). */
async function boundaries() {
    const [row] = await prisma.$queryRaw`
        SELECT
            date_trunc('day', now() AT TIME ZONE ${TIME_ZONE}) AT TIME ZONE ${TIME_ZONE} AS today,
            date_trunc('month', now() AT TIME ZONE ${TIME_ZONE}) AT TIME ZONE ${TIME_ZONE} AS month,
            (date_trunc('day', now() AT TIME ZONE ${TIME_ZONE}) - interval '13 days') AT TIME ZONE ${TIME_ZONE} AS from_day`;
    return row;
}

const sumCount = async (where) => {
    const r = await prisma.order.aggregate({ where, _sum: { total: true }, _count: true });
    return { total: Number(r._sum.total ?? 0), count: r._count };
};

export async function dashboardData() {
    const { today, month, from_day } = await boundaries();
    const monthAgo = new Date(Date.now() - 30 * 86400_000);

    const [todaySales, monthSales, pending, customers, newCustomers, perDayRows, statusRows, topRows, products, recent] = await Promise.all([
        sumCount({ ...LIVE, created_at: { gte: today } }),
        sumCount({ ...LIVE, created_at: { gte: month } }),
        prisma.order.count({ where: { status: "pending" } }),
        prisma.user.count({ where: { is_admin: false } }),
        prisma.user.count({ where: { is_admin: false, created_at: { gte: monthAgo } } }),
        prisma.$queryRaw`
            SELECT to_char(created_at AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day, SUM(total)::float AS total, COUNT(*)::int AS orders
            FROM orders
            WHERE created_at >= ${from_day} AND status NOT IN ('cancelled', 'returned')
            GROUP BY 1`,
        prisma.order.groupBy({ by: ["status"], _count: true }),
        prisma.$queryRaw`
            SELECT oi.product_id, oi.product_name, oi.product_image,
                   SUM(oi.quantity)::int AS qty, SUM(oi.line_total)::float AS revenue
            FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE o.status NOT IN ('cancelled', 'returned')
            GROUP BY oi.product_id, oi.product_name, oi.product_image
            ORDER BY qty DESC, revenue DESC
            LIMIT 5`,
        prisma.product.findMany({ where: { is_active: true }, select: { id: true, name: true, image: true, stock: true, variants: true } }),
        prisma.order.findMany({ orderBy: { id: "desc" }, take: 7, include: { _count: { select: { order_items: true } } } }),
    ]);

    // 14 consecutive days, including days with no sales.
    const byDay = new Map(perDayRows.map((r) => [r.day, r]));
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(from_day.getTime() + i * 86400_000 + 12 * 3600_000); // midday avoids DST edges
        const key = d.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
        const row = byDay.get(key);
        return { date: key, total: row?.total ?? 0, orders: row?.orders ?? 0 };
    });

    const lowStock = products
        .map((p) => ({ ...p, total_stock: totalStock(p) }))
        .filter((p) => p.total_stock <= 5 || (p.variants || []).some((v) => Number(v.stock) <= 2))
        .sort((a, b) => a.total_stock - b.total_stock)
        .slice(0, 6);

    return {
        stats: { todaySales, monthSales, pending, customers, newCustomers },
        days,
        statusCounts: Object.fromEntries(statusRows.map((r) => [r.status, r._count])),
        topProducts: topRows,
        lowStock,
        recent: plain(recent),
    };
}
