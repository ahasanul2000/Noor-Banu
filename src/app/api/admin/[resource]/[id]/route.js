import { handle, HttpError, json, readJson } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/auth";
import { deleteResource, saveResource } from "@/lib/server/adminResources";

const idFrom = async (params) => {
    const { resource, id } = await params;
    if (!/^\d+$/.test(id)) throw new HttpError(404, "Not found.");
    return { resource, id: Number(id) };
};

export const PUT = handle(async (request, { params }) => {
    await requireAdmin(request);
    const { resource, id } = await idFrom(params);
    const row = await saveResource(resource, await readJson(request), id);
    return json({ message: "Saved", data: row });
});

export const DELETE = handle(async (request, { params }) => {
    await requireAdmin(request);
    const { resource, id } = await idFrom(params);
    await deleteResource(resource, id);
    return json({ message: "Deleted" });
});
