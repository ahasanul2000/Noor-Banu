"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useStore, cartKey } from "@/context/StoreContext";

/** Request payload for the bag, as the checkout/orders endpoints expect it. */
export function toOrderItems(cartItems) {
    return cartItems.map((i) => ({
        product_id: i.product_id,
        size: i.size || null,
        color: i.color || null,
        quantity: i.quantity,
    }));
}

/**
 * Server-calculated quote for the bag (debounced). Keeps bag prices in sync with the server.
 * Returns { quote, loading, message, lineErrors } — lineErrors maps cart line key → message.
 */
export function useCheckoutQuote({ couponCode = null, shippingArea = null, delay = 350 } = {}) {
    const { cartItems, hydrated, syncCartWithQuote } = useStore();
    const payload = JSON.stringify({
        items: toOrderItems(cartItems),
        coupon_code: couponCode || undefined,
        shipping_area: shippingArea || undefined,
    });
    const [result, setResult] = useState({ for: null, quote: null, message: null, lineErrors: {} });

    useEffect(() => {
        const body = JSON.parse(payload);
        if (!hydrated || body.items.length === 0) return undefined;

        let cancelled = false;
        const timer = setTimeout(async () => {
            const res = await api.quote(body);
            if (cancelled) return;
            if (!res.ok) {
                setResult({ for: payload, quote: null, message: res.message, lineErrors: {} });
                return;
            }
            const quote = res.data;
            // Errors are keyed by the request index ("items.0"); map them back to bag lines.
            const lineErrors = {};
            Object.entries(quote.errors && !Array.isArray(quote.errors) ? quote.errors : {}).forEach(([field, msg]) => {
                const index = Number(field.split(".")[1]);
                const item = body.items[index];
                if (item) lineErrors[cartKey(item.product_id, item.size, item.color)] = Array.isArray(msg) ? msg[0] : msg;
            });
            setResult({ for: payload, quote, message: null, lineErrors });
            if (Array.isArray(quote.items)) syncCartWithQuote(quote.items);
        }, delay);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [payload, hydrated, delay, syncCartWithQuote]);

    const isEmpty = cartItems.length === 0;
    return {
        quote: isEmpty ? null : result.quote,
        message: isEmpty ? null : result.message,
        lineErrors: isEmpty ? {} : result.lineErrors,
        loading: hydrated && !isEmpty && result.for !== payload,
    };
}
