/**
 * Copy everything from the old Laravel store (SQLite) into this app's PostgreSQL database,
 * and copy its uploaded images into public/uploads.
 *
 *   node scripts/import-laravel.mjs [path/to/database.sqlite] [path/to/storage/app/public]
 *
 * The target tables are emptied first, so run it on a fresh database (or when you want to redo it).
 * Ids are kept, so links between rows (orders → items → products) stay intact.
 */
import "dotenv/config";
import { cpSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sqlitePath = resolve(process.argv[2] ?? `${root}/../backend_lily_crown/database/database.sqlite`);
const storagePath = resolve(process.argv[3] ?? `${root}/../backend_lily_crown/storage/app/public`);

if (!existsSync(sqlitePath)) {
    console.error(`SQLite database not found: ${sqlitePath}`);
    process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const json = (v, fallback = []) => {
    if (v === null || v === undefined || v === "") return fallback;
    try {
        return JSON.parse(v);
    } catch {
        return fallback;
    }
};
const bool = (v) => v === 1 || v === "1" || v === true;
// Laravel stores "YYYY-MM-DD HH:MM:SS" in UTC.
const date = (v) => {
    if (!v) return null;
    const s = String(v);
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s.replace(" ", "T")}Z`);
};
const orZero = (v) => v ?? 0;
const jsonText = (v) => JSON.stringify(json(v));
const timestamps = { created_at: date, updated_at: date };
const sorted = { sort_order: orZero, is_active: bool };

// Columns per table: { column: transform | null }. null copies the value as-is.
const TABLES = {
    users: {
        id: null, name: null, email: null, email_verified_at: date, password: null, is_admin: bool,
        phone: null, address: null, city: null, shipping_area: null, ...timestamps,
    },
    categories: { id: null, name: null, slug: null, icon: null, image: null, description: null, ...sorted, ...timestamps },
    products: {
        id: null, category_id: null, name: null, slug: null, sku: null, description: null, price: null, sale_price: null,
        stock: orZero, variants: jsonText, colors: jsonText, badge: null, image: null,
        gallery: (v) => JSON.stringify(json(v).map((g) => (typeof g === "string" ? g : g?.url)).filter(Boolean)),
        details: jsonText, is_featured: bool, is_trending: bool, ...sorted, ...timestamps,
    },
    blogs: { id: null, title: null, slug: null, content: null, thumbnail: null, ...timestamps },
    site_settings: { id: null, key: null, value: null, type: (v) => v ?? "text", ...timestamps },
    subscribers: { id: null, email: null, ...timestamps },
    coupons: {
        id: null, code: null, type: null, value: null, min_order_amount: orZero, max_discount: null,
        usage_limit: null, used_count: orZero, starts_at: date, expires_at: date, is_active: bool, ...timestamps,
    },
    orders: {
        id: null, user_id: null, order_number: null, customer_name: null, customer_email: null, customer_phone: null,
        shipping_address: null, city: null, shipping_area: null, note: null, admin_note: null,
        subtotal: orZero, discount: orZero, shipping_cost: orZero, total: null, coupon_code: null,
        payment_method: (v) => v ?? "cod", payment_status: (v) => v ?? "unpaid", status: (v) => v ?? "pending",
        items: (v) => (v ? JSON.stringify(json(v, null)) : null), ...timestamps,
    },
    order_items: {
        id: null, order_id: null, product_id: null, product_name: null, product_image: null, size: null, color: null,
        unit_price: null, quantity: null, line_total: null, ...timestamps,
    },
    hero_slides: {
        id: null, title: null, highlight: null, subtitle: null, image: null, button_text: null, button_link: null,
        ...sorted, ...timestamps,
    },
    testimonials: { id: null, name: null, role: null, content: null, image: null, rating: (v) => v ?? 5, ...sorted, ...timestamps },
    features: { id: null, title: null, description: null, icon: (v) => v ?? "gem", ...sorted, ...timestamps },
    lookbooks: { id: null, title: null, image: null, product_id: null, category_name: null, ...sorted, ...timestamps },
    instagram_posts: { id: null, image: null, link: null, caption: null, ...sorted, ...timestamps },
};

const now = new Date();
try {
    await db.query("BEGIN");
    const targets = [...Object.keys(TABLES).reverse(), "api_tokens", "rate_limits"];
    await db.query(`TRUNCATE ${targets.join(", ")} RESTART IDENTITY CASCADE`);

    for (const [table, columns] of Object.entries(TABLES)) {
        const sourceCols = new Set(sqlite.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
        const rows = sqlite.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
        const cols = Object.keys(columns);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        for (const row of rows) {
            const values = cols.map((col) => {
                const raw = sourceCols.has(col) ? row[col] : undefined;
                const value = columns[col] ? columns[col](raw) : (raw ?? null);
                return (col === "created_at" || col === "updated_at") && !value ? now : value;
            });
            await db.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`, values);
        }
        // Continue auto-increment ids after the imported rows.
        await db.query(
            `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`
        );
        console.log(`${table.padEnd(16)} ${rows.length} rows`);
    }
    await db.query("COMMIT");
} catch (error) {
    await db.query("ROLLBACK");
    console.error("Import failed, nothing was changed:", error.message);
    process.exit(1);
} finally {
    await db.end();
}

if (existsSync(storagePath)) {
    cpSync(storagePath, `${root}/public/uploads`, { recursive: true, filter: (src) => !src.includes("/basset") });
    console.log("Copied uploaded images to public/uploads");
} else {
    console.log(`No upload folder at ${storagePath}, skipped images.`);
}
