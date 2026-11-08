import { prisma } from "./db";
import { ValidationError } from "./http";
import { BD_PHONE } from "./validate";

export const PHONE_RULE = { required: true, string: true, regex: BD_PHONE };

export const ACCOUNT_MESSAGES = {
    "phone.regex": "Please enter a valid Bangladeshi mobile number (e.g. 01712345678).",
    "phone.unique": "An account with this mobile number already exists. Please log in.",
    "email.unique": "An account with this email already exists. Please log in.",
};

/** Laravel-style unique checks for phone/email, ignoring the user being edited. */
export async function assertUnique({ phone, email }, ignoreId) {
    const errors = {};
    const not = ignoreId ? { NOT: { id: ignoreId } } : {};
    if (phone && (await prisma.user.findFirst({ where: { phone, ...not }, select: { id: true } }))) {
        errors.phone = ACCOUNT_MESSAGES["phone.unique"];
    }
    if (email && (await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" }, ...not }, select: { id: true } }))) {
        errors.email = ACCOUNT_MESSAGES["email.unique"];
    }
    if (Object.keys(errors).length) throw new ValidationError(errors);
}
