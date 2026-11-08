import { plain } from "./serialize";

const rows = (value) => {
    if (typeof value === "string") {
        try { value = JSON.parse(value); } catch { value = []; }
    }
    return Array.isArray(value) ? value : [];
};

export const hasVariants = (p) => rows(p.variants).length > 0;

export function finalPrice(p) {
    const price = Number(p.price);
    const sale = p.sale_price === null || p.sale_price === undefined ? null : Number(p.sale_price);
    return sale !== null && sale > 0 && sale < price ? sale : price;
}

export function totalStock(p) {
    return hasVariants(p)
        ? rows(p.variants).reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : Number(p.stock) || 0;
}

export function stockFor(p, size) {
    if (!hasVariants(p)) return Number(p.stock) || 0;
    const v = rows(p.variants).find((v) => v.size === size);
    return v ? Number(v.stock) || 0 : 0;
}

/** New stock fields after adding `delta` (negative to take) for one size, never below zero. */
export function stockChange(p, size, delta) {
    if (hasVariants(p)) {
        return {
            variants: rows(p.variants).map((v) =>
                v.size === size ? { ...v, stock: Math.max(0, (Number(v.stock) || 0) + delta) } : v
            ),
        };
    }
    return { stock: Math.max(0, (Number(p.stock) || 0) + delta) };
}

/** Product as the storefront sees it: the columns plus final_price / total_stock / in_stock. */
export function presentProduct(p) {
    if (!p) return p;
    const out = plain(p);
    out.gallery = rows(out.gallery);
    out.details = rows(out.details);
    out.variants = rows(out.variants);
    out.colors = rows(out.colors);
    out.final_price = finalPrice(p);
    out.total_stock = totalStock(p);
    out.in_stock = out.total_stock > 0;
    return out;
}

/** Clean the row-style inputs coming from the admin form (empty rows, numbers as text, duplicates). */
export function normaliseProductRows({ variants, colors, details }) {
    const seen = new Set();
    return {
        variants: rows(variants)
            .map((v) => (v && typeof v === "object" ? v : null))
            .filter((v) => v && String(v.size ?? "").trim() !== "")
            .map((v) => ({ size: String(v.size).trim(), stock: Math.max(0, parseInt(v.stock, 10) || 0) }))
            .filter((v) => (seen.has(v.size) ? false : seen.add(v.size))),
        colors: rows(colors)
            .map((c) => (typeof c === "string" ? { name: c } : c))
            .filter((c) => c && String(c.name ?? "").trim() !== "")
            .map((c) => ({ name: String(c.name).trim() })),
        details: rows(details)
            .map((d) => (typeof d === "string" ? { info: d } : d))
            .filter((d) => d && String(d.info ?? "").trim() !== "")
            .map((d) => ({ info: String(d.info).trim() })),
    };
}

export function slugify(text) {
    return String(text || "")
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** A slug unique within `model`, adding -2, -3… when taken (ignoring the row being edited). */
export async function uniqueSlug(model, source, ignoreId) {
    const base = slugify(source) || "item";
    let slug = base;
    for (let i = 2; ; i++) {
        const clash = await model.findFirst({ where: { slug, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) }, select: { id: true } });
        if (!clash) return slug;
        slug = `${base}-${i}`;
    }
}
