import { handle, json, readJson, ValidationError } from "@/lib/server/http";
import { prisma } from "@/lib/server/db";
import { throttle } from "@/lib/server/rateLimit";
import { validate } from "@/lib/server/validate";

export const POST = handle(async (request) => {
    await throttle(request, "subscribe", 10);
    const { email } = validate(await readJson(request), { email: { required: true, email: true, max: 150 } });
    const normalised = email.toLowerCase();
    if (await prisma.subscriber.findUnique({ where: { email: normalised } })) {
        throw new ValidationError({ email: "The email has already been taken." });
    }
    await prisma.subscriber.create({ data: { email: normalised } });
    return json({ message: "Subscribed successfully" });
});
