import { handle, json, readJson, ValidationError } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { checkPassword, startAdminSession } from "@/lib/server/auth";
import { throttle } from "@/lib/server/rateLimit";
import { validate } from "@/lib/server/validate";

export const POST = handle(async (request) => {
    await throttle(request, "admin-login", 10);
    const data = validate(await readJson(request), {
        email: { required: true, email: true, max: 150 },
        password: { required: true, string: true },
    });
    const user = await prisma.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" } } });
    // Only staff accounts may use the panel; customers get the same message as a wrong password.
    if (!user || !user.is_admin || !(await checkPassword(data.password, user.password))) {
        throw new ValidationError({ email: "These credentials do not match our records." });
    }
    await startAdminSession(user.id);
    return json({ message: "Signed in" });
});
