// Shared helpers for the API tests.
//
// The tests talk to a running server over HTTP and reset its database between tests, so they
// must point at a throwaway database — never the real store:
//
//   TEST_DATABASE_URL=postgresql://postgres@localhost:5432/noor_banu_test   (default)
//   TEST_BASE_URL=http://localhost:3002                                     (default)
//
// Start that server with: npm run test:server   (then run: npm test)
import pg from "pg";
import bcrypt from "bcryptjs";

export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3002";
const DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://postgres@localhost:5432/noor_banu_test?schema=public";

if (!/test/i.test(new URL(DATABASE_URL).pathname)) {
    throw new Error(`Refusing to run tests against "${DATABASE_URL}": the database name must contain "test".`);
}

export const db = new pg.Pool({ connectionString: DATABASE_URL, options: "-c TimeZone=UTC" });

const TABLES = [
    "order_items", "orders", "lookbooks", "products", "categories", "coupons", "api_tokens", "users",
    "site_settings", "subscribers", "blogs", "hero_slides", "testimonials", "features", "instagram_posts", "rate_limits",
];

export async function resetDb() {
    await db.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
}

export async function insert(table, row) {
    const cols = Object.keys(row);
    const values = cols.map((c) => (row[c] !== null && typeof row[c] === "object" && !(row[c] instanceof Date) ? JSON.stringify(row[c]) : row[c]));
    const { rows } = await db.query(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
        values
    );
    return rows[0];
}

export async function one(sql, params = []) {
    const { rows } = await db.query(sql, params);
    return rows[0];
}

export async function createAdmin(email = "admin@example.com", password = "secret123") {
    return insert("users", { name: "Admin User", email, password: await bcrypt.hash(password, 4), is_admin: true });
}

/** fetch wrapper: returns { status, body, headers }. */
export async function call(method, path, { body, token, cookie, form } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
        redirect: "manual",
    });
    const text = await res.text();
    let parsed = text;
    try {
        parsed = JSON.parse(text);
    } catch {
        /* not JSON */
    }
    return { status: res.status, body: parsed, headers: res.headers };
}

export const get = (path, opts) => call("GET", path, opts);
export const post = (path, body, opts = {}) => call("POST", path, { ...opts, body });
export const put = (path, body, opts = {}) => call("PUT", path, { ...opts, body });
