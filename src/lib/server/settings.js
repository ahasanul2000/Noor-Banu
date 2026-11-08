import { prisma } from "./db";

export async function getSettingsMap(client = prisma) {
    const rows = await client.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSetting(key, fallback = null, client = prisma) {
    const row = await client.siteSetting.findUnique({ where: { key } });
    return row?.value === null || row?.value === undefined || row.value === "" ? fallback : row.value;
}
