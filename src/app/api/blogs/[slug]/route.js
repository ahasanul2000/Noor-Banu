import { handle, json } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { presentBlog } from "@/lib/server/content";

export const GET = handle(async (_request, { params }) => {
    const { slug } = await params;
    const blog = await prisma.blog.findUnique({ where: { slug } });
    return blog ? json({ data: presentBlog(blog) }) : json({ message: "Blog not found" }, 404);
});
