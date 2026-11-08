import "server-only";
import { prisma } from "./db";
import { HttpError, ValidationError } from "./http";
import { normaliseProductRows, slugify, uniqueSlug } from "./products";
import { plain } from "./serialize";
import { getResource, RELATIONS, UNIQUE_FIELDS } from "@/lib/admin/resources";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const blank = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export function resourceOrFail(key) {
    const resource = getResource(key);
    if (!resource) throw new HttpError(404, "Unknown admin section.");
    return resource;
}

const delegate = (resource) => prisma[resource.model];

/** Turn the JSON sent by the admin form into column values, collecting Laravel-style errors. */
function readFields(resource, body) {
    const data = {};
    const errors = {};
    const fail = (name, msg) => {
        if (!errors[name]) errors[name] = msg;
    };

    for (const field of resource.fields) {
        if (field.readOnly) continue;
        const { name, label } = field;
        let value = body[name];
        if (typeof value === "string") value = value.trim();

        switch (field.type) {
            case "switch":
                data[name] = value === true || value === "true" || value === "1" || value === 1 || value === "on";
                continue;
            case "rows":
                data[name] = Array.isArray(value) ? value : [];
                continue;
            case "images":
                data[name] = Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim() !== "") : [];
                continue;
            default:
                break;
        }

        if (blank(value)) {
            if (field.required) fail(name, `The ${label.toLowerCase()} field is required.`);
            // Empty numbers fall back to their default (e.g. stock 0); otherwise empty means "none".
            data[name] = (field.type === "number" || field.type === "money") && field.default !== undefined ? Number(field.default) : null;
            continue;
        }

        switch (field.type) {
            case "number":
            case "money": {
                const n = Number(value);
                if (!Number.isFinite(n)) { fail(name, `The ${label.toLowerCase()} must be a number.`); break; }
                if (field.min !== undefined && n < field.min) { fail(name, `The ${label.toLowerCase()} must be at least ${field.min}.`); break; }
                const integer = field.type === "number" && !field.step;
                if (integer && !Number.isInteger(n)) { fail(name, `The ${label.toLowerCase()} must be a whole number.`); break; }
                data[name] = n;
                break;
            }
            case "relation": {
                const id = Number(value);
                if (!Number.isInteger(id)) { fail(name, `Please choose a ${label.toLowerCase()}.`); break; }
                data[name] = id;
                break;
            }
            case "select": {
                if (!Object.hasOwn(field.options, String(value))) { fail(name, `The selected ${label.toLowerCase()} is invalid.`); break; }
                data[name] = field.integer ? Number(value) : String(value);
                break;
            }
            case "datetime": {
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) { fail(name, `The ${label.toLowerCase()} is not a valid date.`); break; }
                data[name] = d;
                break;
            }
            case "email":
                if (!EMAIL.test(value)) { fail(name, `The ${label.toLowerCase()} must be a valid email address.`); break; }
                data[name] = value.toLowerCase();
                break;
            case "url":
                if (!/^https?:\/\/\S+$/i.test(value)) { fail(name, `The ${label.toLowerCase()} must be a valid URL (starting with https://).`); break; }
                data[name] = value;
                break;
            default: {
                const text = String(value);
                if (field.max && text.length > field.max) { fail(name, `The ${label.toLowerCase()} may not be longer than ${field.max} characters.`); break; }
                if (field.pattern && !new RegExp(field.pattern).test(text)) { fail(name, `The ${label.toLowerCase()} format is invalid.`); break; }
                data[name] = text;
            }
        }
    }
    return { data, errors };
}

/** Section-specific rules (the old Laravel model hooks and CRUD validation). */
async function prepare(key, resource, data, errors, id) {
    if (resource.slugFrom && "slug" in data) {
        data.slug = data.slug ? slugify(data.slug) : null;
        if (!data.slug && data[resource.slugFrom] && !errors[resource.slugFrom]) {
            data.slug = await uniqueSlug(delegate(resource), data[resource.slugFrom], id);
        }
    }

    if (key === "products") {
        Object.assign(data, normaliseProductRows(data));
        if (data.sale_price !== null && data.price !== null && !errors.price && !errors.sale_price && data.sale_price >= data.price) {
            errors.sale_price ??= "Sale price must be lower than the regular price.";
        }
        for (const [i, row] of (data.variants || []).entries()) {
            if (row.size.length > 50) errors[`variants.${i}.size`] ??= "Sizes may be at most 50 characters.";
        }
        if (data.category_id && !errors.category_id && !(await prisma.category.findUnique({ where: { id: data.category_id }, select: { id: true } }))) {
            errors.category_id = "Please choose a category.";
        }
    }

    if (key === "lookbook" && data.product_id && !(await prisma.product.findUnique({ where: { id: data.product_id }, select: { id: true } }))) {
        errors.product_id = "That product no longer exists.";
    }

    if (key === "coupons") {
        if (data.code) data.code = data.code.toUpperCase();
        if (data.type === "percent" && data.value > 100) errors.value ??= "A percentage discount can be at most 100.";
        if (data.starts_at && data.expires_at && data.expires_at < data.starts_at) {
            errors.expires_at ??= "The expiry must be after the start date.";
        }
    }

    for (const field of UNIQUE_FIELDS[key] || []) {
        if (!data[field] || errors[field]) continue;
        const clash = await delegate(resource).findFirst({
            where: { [field]: data[field], ...(id ? { NOT: { id } } : {}) },
            select: { id: true },
        });
        if (clash) errors[field] = `This ${field.replace(/_/g, " ")} is already in use.`;
    }
}

export async function saveResource(key, body, id = null) {
    const resource = resourceOrFail(key);
    if (id !== null && !(await delegate(resource).findUnique({ where: { id }, select: { id: true } }))) {
        throw new HttpError(404, `That ${resource.singular} no longer exists.`);
    }
    const { data, errors } = readFields(resource, body || {});
    await prepare(key, resource, data, errors, id);
    if (Object.keys(errors).length) throw new ValidationError(errors);

    const row = id === null
        ? await delegate(resource).create({ data })
        : await delegate(resource).update({ where: { id }, data });
    return plain(row);
}

export async function deleteResource(key, id) {
    const resource = resourceOrFail(key);
    try {
        await delegate(resource).delete({ where: { id } });
    } catch (error) {
        if (error?.code === "P2025") throw new HttpError(404, `That ${resource.singular} no longer exists.`);
        throw error;
    }
}

/** One page of rows for the list screen, with simple text search. */
export async function listResource(key, { q = "", page = 1 } = {}) {
    const resource = resourceOrFail(key);
    const perPage = resource.perPage ?? 25;
    const term = String(q || "").trim();
    const where = term
        ? { OR: resource.search.map((f) => ({ [f]: { contains: term, mode: "insensitive" } })) }
        : {};
    const include = {
        ...(resource.include || {}),
        ...(resource.countRelation ? { _count: { select: { [resource.countRelation]: true } } } : {}),
    };
    const [total, rows] = await Promise.all([
        delegate(resource).count({ where }),
        delegate(resource).findMany({
            where,
            orderBy: resource.orderBy,
            ...(Object.keys(include).length ? { include } : {}),
            skip: (Math.max(1, page) - 1) * perPage,
            take: perPage,
        }),
    ]);
    return { rows: plain(rows), total, page: Math.max(1, page), lastPage: Math.max(1, Math.ceil(total / perPage)) };
}

export async function findResource(key, id) {
    const resource = resourceOrFail(key);
    const row = await delegate(resource).findUnique({ where: { id } });
    return row ? plain(row) : null;
}

/** Options for every relation field used by this section's form. */
export async function relationOptions(resource) {
    const out = {};
    for (const field of resource.fields.filter((f) => f.type === "relation")) {
        const rel = RELATIONS[field.relation];
        const rows = await prisma[rel.model].findMany({ orderBy: rel.orderBy, select: { id: true, [rel.label]: true } });
        out[field.name] = rows.map((r) => ({ value: r.id, label: r[rel.label] }));
    }
    return out;
}
