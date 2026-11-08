import { handle, json } from "@/lib/server/http";
import { getSettingsMap } from "@/lib/server/settings";

export const GET = handle(async () => json({ data: await getSettingsMap() }));
