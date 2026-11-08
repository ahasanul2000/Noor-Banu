import { handle, json } from "@/lib/server/http";
import { findProduct } from "@/lib/server/catalog";

export const GET = handle(async (_request, { params }) => {
    const { idOrSlug } = await params;
    const product = await findProduct(idOrSlug);
    return product ? json({ data: product }) : json({ message: "Product not found" }, 404);
});
