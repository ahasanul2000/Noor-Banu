import { handle, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { saveResource } from "@/lib/server/adminResources";

export const POST = handle(async (request, { params }) => {
    await requireAdmin(request);
    const { resource } = await params;
    const row = await saveResource(resource, await readJson(request));
    return json({ message: "Saved", data: row }, 201);
});
