"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, prefetchCommonData } from "@/lib/api";
import { getProductPricing, getProductSizes, getProductColors, getStockFor } from "@/lib/utils";

const StoreContext = createContext(undefined);

/** One bag line per product + size + colour. */
export const cartKey = (productId, size, color) => `${productId}|${size || ""}|${color || ""}`;

/** Normalise a stored line (older carts only stored the product under `id`). */
function normaliseLine(item) {
    if (!item) return null;
    const productId = Number(item.product_id ?? item.id);
    if (!productId) return null;
    const size = item.size || null;
    const color = item.color || null;
    return {
        ...item,
        product_id: productId,
        size,
        color,
        key: cartKey(productId, size, color),
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
    };
}

export function StoreProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [wishlistItems, setWishlistItems] = useState(new Set());
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [toast, setToast] = useState({ message: "", visible: false });
    const [settings, setSettings] = useState({});
    const [hydrated, setHydrated] = useState(false);

    // Load from LocalStorage. This must run after mount (not in a state initialiser) so the
    // server-rendered markup matches the first client render.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem("noorbanu_cart");
            const savedWishlist = localStorage.getItem("noorbanu_wishlist");

            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart)) {
                    const lines = parsedCart.map(normaliseLine).filter(Boolean);
                    setCartItems(Array.from(new Map(lines.map((l) => [l.key, l])).values()));
                }
            }

            if (savedWishlist) {
                const parsedWishlist = JSON.parse(savedWishlist);
                if (Array.isArray(parsedWishlist)) setWishlistItems(new Set(parsedWishlist.map(Number)));
            }
        } catch (error) {
            console.error("Failed to load store data from localStorage:", error);
        }
        setHydrated(true);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Store settings (delivery charges, free-delivery threshold) managed from the admin panel.
    useEffect(() => {
        api.getSettings().then((data) => data && setSettings(data));
    }, []);

    // Once the page is idle, fetch the default shop listing so the first click on Shop is instant.
    useEffect(() => {
        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
        const cancel = window.cancelIdleCallback || clearTimeout;
        const handle = idle(() => prefetchCommonData());
        return () => cancel(handle);
    }, []);

    // Save to LocalStorage (only after the initial load, so we never overwrite a saved bag with [])
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem("noorbanu_cart", JSON.stringify(cartItems));
        } catch { /* storage unavailable */ }
    }, [cartItems, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem("noorbanu_wishlist", JSON.stringify(Array.from(wishlistItems)));
        } catch { /* storage unavailable */ }
    }, [wishlistItems, hydrated]);

    const showToast = useCallback((message) => {
        setToast({ message, visible: true });
        setTimeout(() => {
            setToast({ message: "", visible: false });
        }, 3000);
    }, []);

    /**
     * Add a product to the bag. Products with sizes need options.size.
     * Returns false (and explains why in a toast) when it can't be added.
     */
    const addToCart = (product, { size = null, color = null, quantity = 1 } = {}) => {
        const sizes = getProductSizes(product);
        if (sizes.length > 0 && !size) {
            showToast("Please choose a size first.");
            return false;
        }
        const colors = getProductColors(product);
        const chosenColor = color || (colors.length === 1 ? colors[0] : null);
        if (colors.length > 1 && !chosenColor) {
            showToast("Please choose a colour first.");
            return false;
        }

        const stock = getStockFor(product, size);
        const key = cartKey(product.id, size, chosenColor);
        const inBag = cartItems.find((i) => i.key === key)?.quantity || 0;
        if (stock <= 0) {
            showToast(`${product.name}${size ? ` (${size})` : ""} is out of stock.`);
            return false;
        }
        if (inBag + quantity > stock) {
            showToast(`Only ${stock} available${size ? ` in size ${size}` : ""}.`);
            return false;
        }

        setCartItems((prev) => {
            const existing = prev.find((item) => item.key === key);
            if (existing) {
                return prev.map((item) =>
                    item.key === key ? { ...item, quantity: item.quantity + quantity, max: stock } : item
                );
            }
            return [
                ...prev,
                {
                    key,
                    product_id: product.id,
                    slug: product.slug,
                    name: product.name,
                    image: product.image,
                    category: product.category?.name || product.category || "",
                    price: getProductPricing(product).price,
                    size,
                    color: chosenColor,
                    quantity,
                    max: stock,
                },
            ];
        });
        showToast(`${product.name}${size ? ` (${size})` : ""} added to your bag.`);
        return true;
    };

    const removeFromCart = (key) => {
        setCartItems((prev) => prev.filter((item) => item.key !== key));
    };

    const updateQuantity = (key, delta) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.key !== key) return item;
                const limit = item.max || Infinity;
                return { ...item, quantity: Math.min(limit, Math.max(1, item.quantity + delta)) };
            })
        );
    };

    /** Sync bag prices/limits with the server's latest quote lines. */
    const syncCartWithQuote = useCallback((lines = []) => {
        setCartItems((prev) =>
            prev.map((item) => {
                const line = lines.find((l) => cartKey(l.product_id, l.size, l.color) === item.key);
                return line ? { ...item, price: Number(line.unit_price) } : item;
            })
        );
    }, []);

    const clearCart = () => setCartItems([]);

    const toggleWishlist = (id) => {
        const productId = Number(id);
        setWishlistItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);

    return (
        <StoreContext.Provider
            value={{
                cartItems,
                cartCount,
                cartTotal,
                wishlistItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                syncCartWithQuote,
                clearCart,
                toggleWishlist,
                isCartOpen,
                setIsCartOpen,
                isWishlistOpen,
                setIsWishlistOpen,
                isSearchOpen,
                setIsSearchOpen,
                toast,
                showToast,
                settings,
                hydrated,
            }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
