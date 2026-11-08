import { prisma } from "./db";
import { HttpError } from "./http";

const clientIp = (request) =>
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

/**
 * Allow `max` requests per `minutes` for this route + client IP (like Laravel's throttle:max,minutes).
 * Counters live in Postgres so the limit holds across serverless instances.
 */
export async function throttle(request, name, max, minutes = 1) {
    const key = `${name}:${clientIp(request)}`;
    const now = new Date();
    const reset = new Date(now.getTime() + minutes * 60_000);
    const [row] = await prisma.$queryRaw`
        INSERT INTO rate_limits (key, count, reset_at) VALUES (${key}, 1, ${reset})
        ON CONFLICT (key) DO UPDATE SET
            count = CASE WHEN rate_limits.reset_at <= ${now} THEN 1 ELSE rate_limits.count + 1 END,
            reset_at = CASE WHEN rate_limits.reset_at <= ${now} THEN ${reset} ELSE rate_limits.reset_at END
        RETURNING count`;
    if (row.count > max) throw new HttpError(429, "Too Many Attempts.");
}
