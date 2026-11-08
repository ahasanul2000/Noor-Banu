/**
 * Move images that are stored as local paths ("demo/x.jpg", served from public/uploads) to Vercel Blob,
 * and point the database at the Blob URLs. Run after importing data into the production database:
 *
 *   DATABASE_URL=<production url> BLOB_READ_WRITE_TOKEN=<token> node scripts/upload-images-to-blob.mjs
 *
 * Safe to run again: rows that already hold full URLs are left alone.
 */
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";
import pg from "pg";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set.");
    process.exit(1);
}

const uploads = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "uploads");
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };

// [table, column, isJsonArray]
const COLUMNS = [
    ["products", "image", false],
    ["products", "gallery", true],
    ["categories", "image", false],
    ["hero_slides", "image", false],
    ["lookbooks", "image", false],
    ["instagram_posts", "image", false],
    ["testimonials", "image", false],
    ["blogs", "thumbnail", false],
    ["order_items", "product_image", false],
];

const isLocal = (v) => typeof v === "string" && v !== "" && !/^https?:\/\//.test(v);
const clean = (v) => v.replace(/^\/?(storage|uploads)\//, "").replace(/^\/+/, "");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const urlFor = new Map();
let missing = 0;
async function upload(path) {
    const key = clean(path);
    if (urlFor.has(key)) return urlFor.get(key);
    const file = join(uploads, key);
    if (!file.startsWith(uploads) || !existsSync(file)) {
        console.warn(`  missing file, left as is: ${key}`);
        missing++;
        urlFor.set(key, null);
        return null;
    }
    const blob = await put(key, readFileSync(file), {
        access: "public",
        contentType: TYPES[extname(key).toLowerCase()] || "application/octet-stream",
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    urlFor.set(key, blob.url);
    return blob.url;
}

let updated = 0;
for (const [table, column, isArray] of COLUMNS) {
    const { rows } = await db.query(`SELECT id, ${column} AS v FROM ${table} WHERE ${column} IS NOT NULL`);
    for (const row of rows) {
        if (isArray) {
            const list = Array.isArray(row.v) ? row.v : [];
            if (!list.some(isLocal)) continue;
            const next = [];
            for (const item of list) next.push(isLocal(item) ? (await upload(item)) ?? item : item);
            await db.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [JSON.stringify(next), row.id]);
            updated++;
        } else if (isLocal(row.v)) {
            const url = await upload(row.v);
            if (!url) continue;
            await db.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [url, row.id]);
            updated++;
        }
    }
}
await db.end();
console.log(`Uploaded ${[...urlFor.values()].filter(Boolean).length} images, updated ${updated} rows${missing ? `, ${missing} files missing` : ""}.`);
