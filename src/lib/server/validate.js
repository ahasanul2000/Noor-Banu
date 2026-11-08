import { ValidationError } from "./http";

export const BD_PHONE = /^(\+?88)?01[3-9]\d{8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = (v) => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/**
 * Tiny rule-based validator (enough for this store).
 * rules: { field: { required, string, max, min, email, regex, in, integer, numeric, array, minItems, maxItems, confirmed, nullable } }
 * Returns cleaned values (strings trimmed, empty -> null). Throws ValidationError.
 */
export function validate(input, rules, messages = {}) {
    const errors = {};
    const out = {};
    const label = (f) => f.replace(/_/g, " ");

    for (const [field, rule] of Object.entries(rules)) {
        let value = input?.[field];
        if (typeof value === "string") value = value.trim();
        const fail = (key, msg) => {
            if (!errors[field]) errors[field] = messages[`${field}.${key}`] || msg;
        };

        if (blank(value)) {
            if (rule.required) fail("required", `The ${label(field)} field is required.`);
            out[field] = rule.array ? [] : null;
            continue;
        }

        if (rule.string && typeof value !== "string") value = String(value);
        if (rule.integer) {
            const n = Number(value);
            if (!Number.isInteger(n)) { fail("integer", `The ${label(field)} must be a whole number.`); continue; }
            value = n;
        } else if (rule.numeric) {
            const n = Number(value);
            if (!Number.isFinite(n)) { fail("numeric", `The ${label(field)} must be a number.`); continue; }
            value = n;
        }
        if (rule.array && !Array.isArray(value)) { fail("array", `The ${label(field)} must be a list.`); continue; }
        if (rule.email && !EMAIL.test(value)) fail("email", `The ${label(field)} must be a valid email address.`);
        if (rule.regex && !rule.regex.test(value)) fail("regex", `The ${label(field)} format is invalid.`);
        if (rule.in && !rule.in.includes(value)) fail("in", `The selected ${label(field)} is invalid.`);
        if (rule.max !== undefined) {
            if (typeof value === "string" && value.length > rule.max) fail("max", `The ${label(field)} may not be longer than ${rule.max} characters.`);
            if (typeof value === "number" && value > rule.max) fail("max", `The ${label(field)} may not be greater than ${rule.max}.`);
            if (Array.isArray(value) && value.length > rule.max) fail("max", `The ${label(field)} may not have more than ${rule.max} items.`);
        }
        if (rule.min !== undefined) {
            if (typeof value === "string" && value.length < rule.min) fail("min", `The ${label(field)} must be at least ${rule.min} characters.`);
            if (typeof value === "number" && value < rule.min) fail("min", `The ${label(field)} must be at least ${rule.min}.`);
            if (Array.isArray(value) && value.length < rule.min) fail("min", `The ${label(field)} must have at least ${rule.min} item.`);
        }
        if (rule.confirmed && input?.[`${field}_confirmation`] !== input?.[field]) {
            fail("confirmed", `The ${label(field)} confirmation does not match.`);
        }
        out[field] = value;
    }

    if (Object.keys(errors).length) throw new ValidationError(errors);
    return out;
}

const ITEM_RULES = {
    product_id: { required: true, integer: true },
    size: { string: true, max: 50 },
    color: { string: true, max: 50 },
    quantity: { required: true, integer: true, min: 1, max: 100 },
};

/** Validate the cart lines sent by checkout (items.N.field errors, like Laravel). */
export function validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) throw new ValidationError({ items: "The items field is required." });
    if (items.length > 50) throw new ValidationError({ items: "Too many items in the bag." });
    return items.map((item, i) => {
        try {
            return validate(item || {}, ITEM_RULES);
        } catch (e) {
            if (!(e instanceof ValidationError)) throw e;
            const errors = {};
            for (const [k, v] of Object.entries(e.errors)) errors[`items.${i}.${k}`] = v;
            throw new ValidationError(errors);
        }
    });
}

/** Store numbers as 01XXXXXXXXX so "+880 1712-345678" and "01712345678" are the same. */
export function normalisePhone(phone) {
    if (phone === null || phone === undefined) return phone;
    const digits = String(phone).replace(/\D/g, "");
    return digits.length >= 11 ? digits.slice(-11) : String(phone);
}
