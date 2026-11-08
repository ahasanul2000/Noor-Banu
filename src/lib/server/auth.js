import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { HttpError } from "./http";

export const ADMIN_COOKIE = "nb_admin";
const ADMIN_SESSION_DAYS = 7;

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

/** Also accepts Laravel's $2y$ bcrypt hashes, so imported accounts keep their passwords. */
export async function checkPassword(password, hash) {
    if (!hash) return false;
    return bcrypt.compare(String(password), hash.replace(/^\$2y\$/, "$2b$"));
}

/** Create a token; only its hash is stored. Returns the plain token for the client. */
export async function issueToken(userId, name, { days } = {}) {
    const plainToken = randomBytes(32).toString("hex");
    const row = await prisma.apiToken.create({
        data: {
            user_id: userId,
            name,
            token: sha256(plainToken),
            expires_at: days ? new Date(Date.now() + days * 86400_000) : null,
        },
    });
    return { id: row.id, token: `${row.id}|${plainToken}` };
}

async function findToken(raw, name) {
    if (!raw || typeof raw !== "string") return null;
    const plainToken = raw.includes("|") ? raw.slice(raw.indexOf("|") + 1) : raw;
    const row = await prisma.apiToken.findUnique({ where: { token: sha256(plainToken) }, include: { user: true } });
    if (!row || row.name !== name) return null;
    if (row.expires_at && row.expires_at < new Date()) return null;
    // Don't write on every request — once a minute is enough for "last used".
    if (!row.last_used_at || Date.now() - row.last_used_at.getTime() > 60_000) {
        await prisma.apiToken.update({ where: { id: row.id }, data: { last_used_at: new Date() } }).catch(() => {});
    }
    return row;
}

const bearer = (request) => {
    const header = request.headers.get("authorization") || "";
    return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
};

/** The storefront customer for this request, or null (guests are allowed in many places). */
export async function customerFromRequest(request) {
    const row = await findToken(bearer(request), "storefront");
    if (!row || row.user.is_admin) return null;
    return { user: row.user, tokenId: row.id };
}

export async function requireCustomer(request) {
    const found = await customerFromRequest(request);
    if (!found) throw new HttpError(401, "Unauthenticated.");
    return found;
}

export async function revokeToken(id) {
    await prisma.apiToken.delete({ where: { id } }).catch(() => {});
}

// ---------- Admin panel (cookie session) ----------

export async function startAdminSession(userId) {
    const { token } = await issueToken(userId, "admin", { days: ADMIN_SESSION_DAYS });
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: ADMIN_SESSION_DAYS * 86400,
    });
}

export async function endAdminSession() {
    const jar = await cookies();
    const raw = jar.get(ADMIN_COOKIE)?.value;
    const row = await findToken(raw, "admin");
    if (row) await revokeToken(row.id);
    jar.delete(ADMIN_COOKIE);
}

/** The signed-in admin, or null. */
export async function currentAdmin() {
    const jar = await cookies();
    const row = await findToken(jar.get(ADMIN_COOKIE)?.value, "admin");
    return row && row.user.is_admin ? row.user : null;
}

/** For admin pages: send guests to the login screen. */
export async function requireAdminPage() {
    const admin = await currentAdmin();
    if (!admin) redirect("/admin/login");
    return admin;
}

/**
 * For admin API routes. Pass the request on writes: besides the SameSite cookie, a request whose
 * Origin is another site is refused (CSRF).
 */
export async function requireAdmin(request) {
    if (request && request.method !== "GET") {
        const origin = request.headers.get("origin");
        if (origin && new URL(origin).host !== request.headers.get("host")) {
            throw new HttpError(403, "Cross-site request refused.");
        }
    }
    const admin = await currentAdmin();
    if (!admin) throw new HttpError(401, "Please sign in to the admin panel.");
    return admin;
}

/** The public fields of a customer account. */
export async function presentCustomer(user) {
    const orders_count = await prisma.order.count({ where: { user_id: user.id } });
    const { id, name, phone, email, address, city, shipping_area } = user;
    return { id, name, phone, email, address, city, shipping_area, orders_count };
}
