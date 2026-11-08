import { handle, json, readJson, ValidationError } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { checkPassword, issueToken, presentCustomer } from "@/lib/server/auth";
import { throttle } from "@/lib/server/rateLimit";
import { normalisePhone, validate } from "@/lib/server/validate";

/** Log in with either the mobile number or the email address. */
export const POST = handle(async (request) => {
    await throttle(request, "login", 10);
    const data = validate(await readJson(request), {
        login: { required: true, string: true, max: 150 },
        password: { required: true, string: true },
    });
    const login = data.login.trim();
    const user = login.includes("@")
        ? await prisma.user.findFirst({ where: { email: { equals: login, mode: "insensitive" } } })
        : await prisma.user.findUnique({ where: { phone: normalisePhone(login) } });

    // Staff accounts sign in through the admin panel, not the storefront.
    if (!user || user.is_admin || !(await checkPassword(data.password, user.password))) {
        throw new ValidationError({ login: "Incorrect mobile number/email or password." });
    }
    const { token } = await issueToken(user.id, "storefront");
    return json({ token, data: await presentCustomer(user) });
});
