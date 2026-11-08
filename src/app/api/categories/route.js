import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";

export const GET = handle(async () => {
    const categories = await prisma.category.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: { where: { is_active: true } } } } },
    });
    return json({
        data: categories.map(({ _count, ...c }) => ({ ...plain(c), products_count: _count.products })),
    });
});
