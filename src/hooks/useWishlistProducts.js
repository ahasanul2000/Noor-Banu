"use client";

import React from "react";
import { api } from "@/lib/api";
import { useStore } from "@/context/StoreContext";

/**
 * Live product data for the ids in the wishlist.
 * @param {boolean} enabled - skip fetching while hidden (e.g. a closed drawer)
 * @returns {{ products: object[], loading: boolean }}
 */
export function useWishlistProducts(enabled = true) {
    const { wishlistItems } = useStore();
    const ids = [...wishlistItems].sort((a, b) => a - b);
    const key = ids.join(",");
    const [result, setResult] = React.useState({ key: null, products: [] });

    React.useEffect(() => {
        if (!enabled || !key) return;
        let cancelled = false;
        api.getProductsByIds(key.split(",")).then((data) => {
            if (!cancelled) setResult({ key, products: data || [] });
        });
        return () => {
            cancelled = true;
        };
    }, [enabled, key]);

    // Filter locally so removals disappear instantly, before any refetch
    const products = key ? result.products.filter((p) => wishlistItems.has(p.id)) : [];
    const loading = enabled && !!key && result.key !== key && products.length === 0;

    return { products, loading };
}
