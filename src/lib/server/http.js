import { NextResponse } from "next/server";

/** A validation failure, rendered like Laravel's 422 response: { message, errors: { field: [msg] } }. */
export class ValidationError extends Error {
    constructor(errors) {
        const map = {};
        for (const [field, msg] of Object.entries(errors)) map[field] = Array.isArray(msg) ? msg : [msg];
        super(Object.values(map)[0]?.[0] || "The given data was invalid.");
        this.errors = map;
    }
}

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const json = (data, status = 200, headers) => NextResponse.json(data, { status, headers });

/** Wrap a route handler so thrown ValidationError/HttpError become proper JSON responses. */
export function handle(fn) {
    return async (request, context) => {
        try {
            return await fn(request, context);
        } catch (error) {
            if (error instanceof ValidationError) {
                return json({ message: error.message, errors: error.errors }, 422);
            }
            if (error instanceof HttpError) {
                return json({ message: error.message }, error.status);
            }
            console.error(error);
            return json({ message: "Server error. Please try again." }, 500);
        }
    };
}

export async function readJson(request) {
    try {
        return (await request.json()) ?? {};
    } catch {
        return {};
    }
}
