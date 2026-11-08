import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { presentBlog } from "@/lib/server/content";

export const GET = handle(async () => {
    const blogs = await prisma.blog.findMany({ orderBy: [{ created_at: "desc" }, { id: "desc" }] });
    return json({ data: blogs.map(presentBlog) });
});
