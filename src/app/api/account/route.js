import { handle, json, readJson } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { presentCustomer, requireCustomer } from "@/lib/server/auth";
import { ACCOUNT_MESSAGES, assertUnique, PHONE_RULE } from "@/lib/server/accounts";
import { SHIPPING_AREAS } from "@/lib/orderStatus";
import { normalisePhone, validate } from "@/lib/server/validate";

export const GET = handle(async (request) => {
    const { user } = await requireCustomer(request);
    return json({ data: await presentCustomer(user) });
});

export const PUT = handle(async (request) => {
    const { user } = await requireCustomer(request);
    const body = await readJson(request);
    body.phone = normalisePhone(body.phone ?? user.phone);
    const data = validate(
        body,
        {
            name: { required: true, string: true, max: 120 },
            phone: PHONE_RULE,
            email: { email: true, max: 150 },
            address: { string: true, max: 500 },
            city: { string: true, max: 100 },
            shipping_area: { in: Object.keys(SHIPPING_AREAS) },
        },
        ACCOUNT_MESSAGES
    );
    await assertUnique(data, user.id);
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return json({ message: "Profile updated", data: await presentCustomer(updated) });
});
