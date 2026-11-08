// The API lives in this same Next.js app (src/app/api). Browsers call it by path; server code
// needs an absolute URL (server components should prefer src/lib/server/* directly).
const API_URL = process.env.NEXT_PUBLIC_API_URL
    || (typeof window === 'undefined' ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api` : '/api');

// In the browser, identical GET requests share one response: fresh for 30s, then served stale
// (up to 5 min) while a background refresh updates the cache for the next visit. This makes
// back/forward navigation and repeat page visits instant; checkout always re-checks prices/stock.
const FRESH_MS = 30_000;
const STALE_MS = 5 * 60_000;
const browserCache = new Map();

export function fetchFromApi(endpoint, options = {}) {
    const cacheable = typeof window !== 'undefined' && !options.method && options.cache !== 'no-store';
    if (!cacheable) return requestJson(endpoint, options);

    const key = `${endpoint}|${options.fullResponse ? 'full' : 'data'}`;
    const load = () => {
        const promise = requestJson(endpoint, options).then((result) => {
            if (result === null && browserCache.get(key)?.promise === promise) browserCache.delete(key); // don't remember failures
            return result;
        });
        browserCache.set(key, { at: Date.now(), promise });
        return promise;
    };

    const hit = browserCache.get(key);
    const age = hit ? Date.now() - hit.at : Infinity;
    if (age < FRESH_MS) return hit.promise;
    if (age < STALE_MS) {
        const stale = hit.promise;
        load(); // refresh in the background
        return stale;
    }
    return load();
}

/** Warm the browser cache for likely next pages (called when the browser is idle). */
export function prefetchCommonData() {
    fetchFromApi('products?per_page=12', { fullResponse: true }); // default /shop listing
    fetchFromApi('categories');
}

async function requestJson(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            next: { revalidate: 60 }, // Default revalidation
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const json = await response.json();

        if (options.fullResponse) {
            return json;
        }

        // Some endpoints might not wrap in 'data' (like settings)
        return json.data !== undefined ? json.data : json;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

export const TOKEN_KEY = 'noorbanu_token';

/** The signed-in customer's API token (browser only). */
export function getAuthToken() {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

/**
 * Request that reports failures instead of swallowing them, for forms (checkout, tracking, account).
 * Sends the customer's token when signed in, so orders are linked to their account.
 * Resolves to { ok, status, data, meta, token, message, errors } — errors is Laravel's { field: [messages] } map.
 */
export async function requestApi(endpoint, { method = 'GET', body } = {}) {
    const token = getAuthToken();
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method,
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = response.status === 429
                ? 'Too many attempts. Please wait a minute and try again.'
                : json.message || 'Something went wrong. Please try again.';
            return { ok: false, status: response.status, data: null, message, errors: json.errors || {} };
        }

        return { ok: true, status: response.status, data: json.data ?? json, meta: json.meta, token: json.token, message: json.message, errors: {} };
    } catch {
        return { ok: false, status: 0, data: null, message: 'Could not reach the store. Check your connection and try again.', errors: {} };
    }
}

function toQuery(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') search.set(key, value);
    });
    const qs = search.toString();
    return qs ? `?${qs}` : '';
}

export const api = {
    getProducts: (params) => fetchFromApi(`products${toQuery(params)}`),
    /** Paginated product search: resolves to { data, meta } or null. */
    searchProducts: (params) => fetchFromApi(`products${toQuery(params)}`, { fullResponse: true }),
    // Cached briefly on the server so repeat visits are instant; checkout re-checks stock and prices.
    getProduct: (idOrSlug) => fetchFromApi(`products/${idOrSlug}`, { next: { revalidate: 30 } }),
    getRelatedProducts: (id) => fetchFromApi(`products/${id}/related`),
    getProductsByIds: (ids) => fetchFromApi(`products/by-ids?ids=${ids.join(',')}`, { cache: 'no-store', next: undefined }),
    getBlogs: () => fetchFromApi('blogs'),
    getBlog: (slug) => fetchFromApi(`blogs/${slug}`),
    getHeroSlides: () => fetchFromApi('hero-slides'),
    getCategories: () => fetchFromApi('categories'),
    getLookbook: (page = 1, limit = 8) => fetchFromApi(`lookbook?page=${page}&per_page=${limit}`, { fullResponse: true }),
    getTestimonials: () => fetchFromApi('testimonials'),
    getSettings: () => fetchFromApi('settings'),
    getInstagramPosts: () => fetchFromApi('instagram-posts'),
    getFeatures: () => fetchFromApi('features'),
    subscribe: (email) => fetchFromApi('subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }),
    /** Server-calculated subtotal, discount, delivery charge and total for the bag. */
    quote: (body) => requestApi('checkout/quote', { method: 'POST', body }),
    placeOrder: (body) => requestApi('orders', { method: 'POST', body }),
    trackOrder: (orderNumber, phone) => requestApi(`orders/track${toQuery({ order_number: orderNumber, phone })}`),
    // Customer accounts
    register: (body) => requestApi('auth/register', { method: 'POST', body }),
    login: (login, password) => requestApi('auth/login', { method: 'POST', body: { login, password } }),
    logout: () => requestApi('auth/logout', { method: 'POST' }),
    getAccount: () => requestApi('account'),
    updateAccount: (body) => requestApi('account', { method: 'PUT', body }),
    changePassword: (body) => requestApi('account/password', { method: 'PUT', body }),
    getMyOrders: (page = 1) => requestApi(`account/orders?page=${page}`),
};
