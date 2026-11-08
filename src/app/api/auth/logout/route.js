import { handle, json } from "@/lib/server/http";
import { requireCustomer, revokeToken } from "@/lib/server/auth";

export const POST = handle(async (request) => {
    const { tokenId } = await requireCustomer(request);
    await revokeToken(tokenId);
    return json({ message: "Logged out" });
});
