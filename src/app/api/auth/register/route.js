import { handle, json, readJson } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { hashPassword, issueToken, presentCustomer } from "@/lib/server/auth";
import { ACCOUNT_MESSAGES, assertUnique, PHONE_RULE } from "@/lib/server/accounts";
import { throttle } from "@/lib/server/rateLimit";
import { normalisePhone, validate } from "@/lib/server/validate";

export const POST = handle(async (request) => {
    await throttle(request, "register", 10);
    const body = await readJson(request);
    body.phone = normalisePhone(body.phone);
    const data = validate(
        body,
        {
            name: { required: true, string: true, max: 120 },
            phone: PHONE_RULE,
            email: { email: true, max: 150 },
            password: { required: true, string: true, min: 6, confirmed: true },
        },
        ACCOUNT_MESSAGES
    );
    await assertUnique(data);
    const user = await prisma.user.create({
        data: { name: data.name, phone: data.phone, email: data.email || null, password: await hashPassword(data.password) },
    });
    const { token } = await issueToken(user.id, "storefront");
    return json({ token, data: await presentCustomer(user) }, 201);
});
