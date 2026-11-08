import { handle, json } from "@/lib/server/http";
import { productsByIds } from "@/lib/server/catalog";

/** Lightweight lookup for wishlist / recently-viewed lists. */
export const GET = handle(async (request) => json({ data: await productsByIds(request.nextUrl.searchParams.get("ids")) }));
