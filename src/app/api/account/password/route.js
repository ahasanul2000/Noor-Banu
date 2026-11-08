import { handle, json, readJson, ValidationError } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { checkPassword, hashPassword, requireCustomer } from "@/lib/server/auth";
import { throttle } from "@/lib/server/rateLimit";
import { validate } from "@/lib/server/validate";

export const PUT = handle(async (request) => {
    const { user, tokenId } = await requireCustomer(request);
    await throttle(request, "password", 10);
    const data = validate(await readJson(request), {
        current_password: { required: true, string: true },
        password: { required: true, string: true, min: 6, confirmed: true },
    });
    if (!(await checkPassword(data.current_password, user.password))) {
        throw new ValidationError({ current_password: "Your current password is incorrect." });
    }
    await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(data.password) } });
    // Sign out other devices; keep this one.
    await prisma.apiToken.deleteMany({ where: { user_id: user.id, NOT: { id: tokenId } } });
    return json({ message: "Password changed" });
});
