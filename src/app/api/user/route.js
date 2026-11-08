import { handle, json } from "@/lib/server/http";
import { presentCustomer, requireCustomer } from "@/lib/server/auth";

export const GET = handle(async (request) => {
    const { user } = await requireCustomer(request);
    return json(await presentCustomer(user));
});
