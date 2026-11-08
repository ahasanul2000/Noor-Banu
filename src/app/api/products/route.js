import { handle, json } from "@/lib/server/http";
import { listProducts } from "@/lib/server/catalog";

export const GET = handle(async (request) => {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    return json(await listProducts(params));
});
