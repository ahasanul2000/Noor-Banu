import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./db";
import { presentProduct } from "./products";
import { plain } from "./serialize";

const withCategory = { category: true };
const present = (list) => list.map((p) => ({ ...presentProduct(p), category: plain(p.category) }));

const EFFECTIVE_PRICE = Prisma.sql`(CASE WHEN p.sale_price IS NOT NULL AND p.sale_price > 0 AND p.sale_price < p.price THEN p.sale_price ELSE p.price END)`;
const truthy = (v) => ["1", "true", "on", "yes"].includes(String(v ?? "").toLowerCase());

/**
 * Filters: category (slug), search, min_price, max_price, featured, trending, on_sale, sort.
 * Paginates when per_page is given; otherwise returns every matching product.
 */
export async function listProducts(params = {}) {
    const where = [Prisma.sql`p.is_active = true`, Prisma.sql`c.is_active = true`];
    if (params.category) where.push(Prisma.sql`c.slug = ${String(params.category)}`);
    const search = String(params.search ?? "").trim();
    if (search) {
        const like = `%${search}%`;
        where.push(Prisma.sql`(p.name ILIKE ${like} OR p.description ILIKE ${like} OR p.sku ILIKE ${like})`);
    }
    const num = (v) => (v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
    if (num(params.min_price) !== null) where.push(Prisma.sql`${EFFECTIVE_PRICE} >= ${num(params.min_price)}`);
    if (num(params.max_price) !== null) where.push(Prisma.sql`${EFFECTIVE_PRICE} <= ${num(params.max_price)}`);
    if (truthy(params.featured)) where.push(Prisma.sql`p.is_featured = true`);
    if (truthy(params.trending)) where.push(Prisma.sql`p.is_trending = true`);
    if (truthy(params.on_sale)) where.push(Prisma.sql`(p.sale_price IS NOT NULL AND p.sale_price > 0 AND p.sale_price < p.price)`);

    const order = {
        price_asc: Prisma.sql`${EFFECTIVE_PRICE} ASC, p.id DESC`,
        price_desc: Prisma.sql`${EFFECTIVE_PRICE} DESC, p.id DESC`,
        newest: Prisma.sql`p.id DESC`,
        name: Prisma.sql`p.name ASC`,
    }[params.sort] ?? Prisma.sql`p.is_featured DESC, p.sort_order ASC, p.id DESC`;

    const from = Prisma.sql`FROM products p JOIN categories c ON c.id = p.category_id WHERE ${Prisma.join(where, " AND ")}`;
    const paginate = params.per_page !== undefined && params.per_page !== null && params.per_page !== "";

    let ids;
    let meta;
    if (paginate) {
        const perPage = Math.min(60, Math.max(1, parseInt(params.per_page, 10) || 1));
        const [{ total }] = await prisma.$queryRaw`SELECT COUNT(*)::int AS total ${from}`;
        const lastPage = Math.max(1, Math.ceil(total / perPage));
        const page = Math.max(1, parseInt(params.page, 10) || 1);
        ids = (await prisma.$queryRaw`SELECT p.id ${from} ORDER BY ${order} LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`).map((r) => r.id);
        meta = { current_page: page, last_page: lastPage, per_page: perPage, total };
    } else {
        ids = (await prisma.$queryRaw`SELECT p.id ${from} ORDER BY ${order}`).map((r) => r.id);
    }

    const rows = await prisma.product.findMany({ where: { id: { in: ids } }, include: withCategory });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const data = present(ids.map((id) => byId.get(id)).filter(Boolean));
    return meta ? { data, meta } : { data };
}

/** Accepts either a numeric id or a slug. */
export async function findProduct(idOrSlug) {
    const key = String(idOrSlug);
    const where = /^\d+$/.test(key) ? { id: Number(key) } : { slug: key };
    const product = await prisma.product.findFirst({ where: { ...where, is_active: true }, include: withCategory });
    return product ? present([product])[0] : null;
}

const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/** Up to 4 products from the same category, topped up with random others. */
export async function relatedProducts(id) {
    const product = /^\d+$/.test(String(id)) ? await prisma.product.findUnique({ where: { id: Number(id) } }) : null;
    if (!product) return [];
    const same = shuffle(await prisma.product.findMany({
        where: { is_active: true, category_id: product.category_id, NOT: { id: product.id } },
        include: withCategory,
    })).slice(0, 4);
    let related = same;
    if (related.length < 4) {
        const exclude = [product.id, ...related.map((p) => p.id)];
        const more = shuffle(await prisma.product.findMany({ where: { is_active: true, id: { notIn: exclude } }, include: withCategory }));
        related = related.concat(more.slice(0, 4 - related.length));
    }
    return present(related);
}

export async function productsByIds(idsParam) {
    const ids = String(idsParam ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d+$/.test(s))
        .map(Number)
        .slice(0, 100);
    if (!ids.length) return [];
    return present(await prisma.product.findMany({ where: { is_active: true, id: { in: ids } }, include: withCategory }));
}
