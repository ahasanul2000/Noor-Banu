import { handle, json } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { saveImage } from "@/lib/server/storage";

/** One image per request (keeps each request under Vercel's 4.5 MB body limit). */
export const POST = handle(async (request) => {
    await requireAdmin(request);
    const form = await request.formData();
    const path = await saveImage(form.get("file"), String(form.get("folder") || ""));
    return json({ path });
});
