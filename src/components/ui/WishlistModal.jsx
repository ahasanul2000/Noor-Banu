"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Heart, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";
import Skeleton from "@/components/ui/Skeleton";
import {
    formatPrice,
    getOptimizedImage,
    getProductColors,
    getProductPricing,
    getProductSizes,
} from "@/lib/utils";

export function WishlistModal() {
    const { isWishlistOpen, setIsWishlistOpen, toggleWishlist, addToCart } = useStore();
    const { products: wishlistedProducts, loading } = useWishlistProducts(isWishlistOpen);

    const close = () => setIsWishlistOpen(false);

    return (
        <AnimatePresence>
            {isWishlistOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={close}
                        className="fixed inset-0 bg-black/50 z-[60]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-6 md:p-8"
                    >
                        <div className="flex justify-between items-center mb-8 border-b pb-4">
                            <h2 className="font-serif text-2xl">Your Wishlist</h2>
                            <button onClick={close} className="text-2xl hover:text-rose-gold p-2" aria-label="Close wishlist">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto h-[calc(100vh-180px)] pr-2">
                            {loading ? (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4 p-2">
                                        <Skeleton className="w-20 h-24 flex-shrink-0" />
                                        <div className="flex-1 space-y-2 py-2">
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-4 w-1/3" />
                                        </div>
                                    </div>
                                ))
                            ) : wishlistedProducts.length === 0 ? (
                                <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Heart size={32} />
                                    </div>
                                    <p className="font-serif text-lg">Your wishlist is empty</p>
                                    <p className="text-xs mt-2">Start adding items you love.</p>
                                    <button
                                        onClick={close}
                                        className="mt-6 px-6 py-2 border border-gray-300 text-xs uppercase hover:bg-black hover:text-white transition-colors"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                wishlistedProducts.map((product) => {
                                    const href = `/product/${product.slug || product.id}`;
                                    const { price, original, onSale } = getProductPricing(product);
                                    const soldOut = product.in_stock === false;
                                    const needsChoice = getProductSizes(product).length > 0 || getProductColors(product).length > 1;

                                    return (
                                        <div key={product.id} className="flex gap-4 p-2 hover:bg-gray-50 transition-colors rounded">
                                            <Link href={href} onClick={close} className="relative w-20 h-24 flex-shrink-0">
                                                <Image
                                                    src={getOptimizedImage(product.image)}
                                                    alt={product.name}
                                                    fill
                                                    sizes="80px"
                                                    className="object-cover rounded"
                                                />
                                            </Link>
                                            <div className="flex-1 flex flex-col justify-center text-left">
                                                <Link href={href} onClick={close}>
                                                    <h4 className="font-serif text-gray-800 hover:text-heritage-gold transition-colors">{product.name}</h4>
                                                </Link>
                                                <p className="text-sm">
                                                    <span className="text-rose-gold font-bold">{formatPrice(price)}</span>
                                                    {onSale && <span className="ml-2 text-xs text-gray-400 line-through">{formatPrice(original)}</span>}
                                                </p>
                                                {soldOut ? (
                                                    <span className="text-xs uppercase tracking-wider mt-2 text-deep-maroon font-bold">Sold out</span>
                                                ) : needsChoice ? (
                                                    <Link
                                                        href={href}
                                                        onClick={close}
                                                        className="text-xs uppercase tracking-wider text-left mt-2 underline text-gray-500 hover:text-black"
                                                    >
                                                        Choose Size
                                                    </Link>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        className="text-xs uppercase tracking-wider text-left mt-2 underline text-gray-500 hover:text-black"
                                                    >
                                                        Move to Cart
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleWishlist(product.id)}
                                                className="text-gray-400 hover:text-red-500 self-center p-2"
                                                aria-label={`Remove ${product.name} from wishlist`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
