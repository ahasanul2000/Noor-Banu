import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "./http";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
};
// Replaced or deleted images are deliberately kept: the same file can be used by several rows
// (e.g. the imported demo photos), so removing it could break another product or banner.
export const MAX_UPLOAD_MB = 4;
const FOLDERS = new Set(["products", "categories", "banners", "lookbook", "instagram", "testimonials", "blog"]);

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Save an uploaded image and return what to store in the database:
 * - with BLOB_READ_WRITE_TOKEN (Vercel): the public Blob URL
 * - otherwise (local dev): "folder/file.ext", served from public/uploads
 */
export async function saveImage(file, folder) {
    if (!file || typeof file.arrayBuffer !== "function") throw new HttpError(422, "No file was uploaded.");
    if (!FOLDERS.has(folder)) throw new HttpError(422, "Unknown upload folder.");
    const ext = IMAGE_TYPES[file.type];
    if (!ext) throw new HttpError(422, "Please upload a JPG, PNG, WebP, GIF or AVIF image.");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new HttpError(422, `Images must be smaller than ${MAX_UPLOAD_MB} MB.`);

    const name = `${folder}/${Date.now().toString(36)}-${randomUUID().slice(0, 8)}.${ext}`;

    if (useBlob()) {
        const { put } = await import("@vercel/blob");
        const blob = await put(name, file, { access: "public", contentType: file.type });
        return blob.url;
    }
    if (process.env.VERCEL) {
        // Vercel's filesystem is read-only and not shared between requests.
        throw new HttpError(500, "Image uploads need Vercel Blob: add a Blob store to this project (BLOB_READ_WRITE_TOKEN).");
    }
    await mkdir(path.join(UPLOAD_DIR, folder), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    return name;
}

