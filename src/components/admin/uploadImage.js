// Upload one image to /api/admin/upload. Large photos are shrunk in the browser first, so each
// request stays well under Vercel's 4.5 MB request limit and pages load faster.
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_SIDE = 2000;

async function shrink(file) {
    const resizable = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (!resizable) return file;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= MAX_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

/** Resolves to the stored path/URL, or throws an Error with a readable message. */
export async function uploadImage(file, folder) {
    const body = new FormData();
    body.append("file", await shrink(file));
    body.append("folder", folder);
    let res;
    try {
        res = await fetch("/api/admin/upload", { method: "POST", body });
    } catch {
        throw new Error("Upload failed: could not reach the server.");
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Upload failed.");
    return json.path;
}
