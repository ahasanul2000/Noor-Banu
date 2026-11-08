import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { VISIBLE } from "@/lib/server/content";

export const GET = handle(async () => json({ data: plain(await prisma.heroSlide.findMany(VISIBLE)) }));
