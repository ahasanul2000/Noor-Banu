// Utility functions for the application

/**
 * Combines class names conditionally
 * @param {...string} classes - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

/**
 * Format price with currency (Bangladeshi grouping, e.g. ৳ 1,25,000)
 * @param {number} price - Price to format
 * @param {string} currency - Currency symbol (default: '৳')
 * @returns {string} Formatted price
 */
export function formatPrice(price, currency = '৳') {
    const amount = Number(price) || 0;
    return `${currency} ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

/**
 * Generate slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} Slug
 */
export function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Get valid image source with fallback
 * @param {string} src - Potential image source
 * @param {string} fallback - Fallback URL (default: placeholder)
 * @returns {string} Balanced image source
 */
export function getOptimizedImage(src, fallback = "https://picsum.photos/1200/800?grayscale&blur=2") {
    if (!src || src === "") return fallback;

    // If it's already an absolute URL (http/https), return it
    if (src.startsWith('http')) return src;

    // Site files (e.g. /img/logo.png) and local uploads are served by this app.
    if (src.startsWith('/') && !src.startsWith('/storage/')) return src;

    // Paths stored by the admin panel ("products/x.jpg", or the old Laravel "/storage/products/x.jpg")
    // live in public/uploads. In production uploads go to Vercel Blob and are stored as full URLs.
    const path = src.replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `/uploads/${path}`;
}

/**
 * All images for a product: main image first, then gallery.
 * Gallery entries may be plain strings or legacy { url } objects.
 * @param {object} product
 * @returns {string[]} Image sources (unresolved — pass each through getOptimizedImage)
 */
export function getProductImages(product) {
    if (!product) return [];
    const gallery = Array.isArray(product.gallery)
        ? product.gallery.map((g) => (typeof g === 'string' ? g : g?.url)).filter(Boolean)
        : [];
    return Array.from(new Set([product.image, ...gallery].filter(Boolean)));
}

/**
 * Product detail bullet points; entries may be strings or { info } objects.
 * @param {object} product
 * @returns {string[]}
 */
export function getProductDetails(product) {
    if (!Array.isArray(product?.details)) return [];
    return product.details.map((d) => (typeof d === 'string' ? d : d?.info)).filter(Boolean);
}

/**
 * Pricing info for display. final_price comes from the API (sale price when active).
 * @param {object} product
 * @returns {{ price: number, original: number, onSale: boolean, percentOff: number }}
 */
export function getProductPricing(product) {
    const original = Number(product?.price) || 0;
    const price = Number(product?.final_price ?? product?.price) || 0;
    const onSale = price > 0 && price < original;
    return { price, original, onSale, percentOff: onSale ? Math.round((1 - price / original) * 100) : 0 };
}

/** Size variants with stock, e.g. [{ size: 'M', stock: 4 }]. */
export function getProductSizes(product) {
    return Array.isArray(product?.variants) ? product.variants.filter((v) => v?.size) : [];
}

/** Colour names the customer can pick from. */
export function getProductColors(product) {
    return Array.isArray(product?.colors)
        ? product.colors.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
        : [];
}

/** Units available for a size (or the whole product when it has no sizes). */
export function getStockFor(product, size) {
    const sizes = getProductSizes(product);
    if (sizes.length === 0) return Number(product?.stock ?? product?.total_stock) || 0;
    return Number(sizes.find((v) => v.size === size)?.stock) || 0;
}
