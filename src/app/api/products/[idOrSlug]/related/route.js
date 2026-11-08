import { handle, json } from "@/lib/server/http";
import { relatedProducts } from "@/lib/server/catalog";

export const GET = handle(async (_request, { params }) => {
    const { idOrSlug } = await params;
    return json({ data: await relatedProducts(idOrSlug) });
});
