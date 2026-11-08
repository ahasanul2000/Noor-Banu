import { handle, json } from "@/lib/server/http";
import { endAdminSession } from "@/lib/server/auth";

export const POST = handle(async () => {
    await endAdminSession();
    return json({ message: "Signed out" });
});
