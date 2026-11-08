/** JSON request to the admin API. Resolves to { ok, status, data, message, errors }. */
export async function adminFetch(url, { method = "GET", body } = {}) {
    try {
        const res = await fetch(url, {
            method,
            headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const json = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data: json.data, message: json.message, errors: json.errors || {} };
    } catch {
        return { ok: false, status: 0, message: "Could not reach the server. Check your connection.", errors: {} };
    }
}

/** The best single message to show for a failed request. */
export function firstError(res) {
    if (res.status === 429) return "Too many attempts. Please wait a minute and try again.";
    if (res.status === 401) return "Your session has ended. Please sign in again.";
    const first = Object.values(res.errors || {})[0];
    return (Array.isArray(first) ? first[0] : first) || res.message || "Something went wrong. Please try again.";
}
