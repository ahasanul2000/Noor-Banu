/**
 * Turn Prisma results into plain JSON the storefront expects:
 * Decimal -> number, Date -> ISO string, recursively.
 */
export function plain(value) {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "bigint") return Number(value);
    if (typeof value === "object") {
        if (typeof value.toNumber === "function" && typeof value.toFixed === "function") return value.toNumber();
        if (Array.isArray(value)) return value.map(plain);
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = plain(v);
        return out;
    }
    return value;
}

export const toNumber = (v) => (v === null || v === undefined ? null : Number(v));

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
