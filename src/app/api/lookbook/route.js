import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { presentProduct } from "@/lib/server/products";
import { VISIBLE } from "@/lib/server/content";

export const GET = handle(async (request) => {
    const q = request.nextUrl.searchParams;
    const perPage = Math.min(48, Math.max(1, parseInt(q.get("per_page") ?? "8", 10) || 8));
    const page = Math.max(1, parseInt(q.get("page") ?? "1", 10) || 1);
    const [total, rows] = await Promise.all([
        prisma.lookbook.count({ where: VISIBLE.where }),
        prisma.lookbook.findMany({
            ...VISIBLE,
            include: { product: { include: { category: true } } },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
    ]);
    return json({
        data: rows.map((row) => ({
            ...plain(row),
            product: row.product ? { ...presentProduct(row.product), category: plain(row.product.category) } : null,
        })),
        meta: { current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total },
    });
});
