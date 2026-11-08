"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import {
    formatPrice,
    getOptimizedImage,
    getProductColors,
    getProductPricing,
    getProductSizes,
} from "@/lib/utils";

const actionClass = "bg-white text-emerald-royal px-6 py-3 uppercase tracking-widest text-[10px] font-bold hover:bg-emerald-royal hover:text-white transition-all shadow-xl transform translate-y-4 group-hover:translate-y-0 duration-500";

export default function WishlistPage() {
    const { toggleWishlist, addToCart } = useStore();
    const { products: validWishlistItems, loading } = useWishlistProducts();

    return (
        <main className="bg-muslin-cream min-h-screen">
            <Navbar />

            <div className="pt-nav pb-16 max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <span className="text-heritage-gold text-xs uppercase tracking-[0.3em] font-bold">
                        Your Favorites
                    </span>
                    <h1 className="text-3xl md:text-5xl font-serif text-emerald-royal mt-3">Royal Wishlist</h1>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-[3/4] w-full" />
                                <Skeleton className="h-4 w-2/3 mx-auto" />
                                <Skeleton className="h-4 w-1/3 mx-auto" />
                            </div>
                        ))}
                    </div>
                ) : validWishlistItems.length === 0 ? (
                    <div className="text-center py-20 bg-white shadow-xl rounded-sm border border-heritage-gold/20">
                        <p className="text-lg text-emerald-royal/60 mb-8 font-serif">Your wishlist is waiting for your royal selection.</p>
                        <Link
                            href="/shop"
                            className="inline-block px-8 py-3 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg"
                        >
                            Explore Collection
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {validWishlistItems.map((product) => {
                            const href = `/product/${product.slug || product.id}`;
                            const { price, original, onSale } = getProductPricing(product);
                            const soldOut = product.in_stock === false;
                            const needsChoice = getProductSizes(product).length > 0 || getProductColors(product).length > 1;

                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group relative bg-white shadow-md hover:shadow-2xl transition-all duration-500 border border-emerald-royal/5"
                                >
                                    <div className="relative aspect-[3/4] overflow-hidden">
                                        <Image
                                            src={getOptimizedImage(product.image)}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />

                                        {soldOut && (
                                            <span className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-emerald-royal/90 text-white text-[9px] uppercase tracking-[0.3em] font-bold rounded-full">
                                                Sold out
                                            </span>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => toggleWishlist(product.id)}
                                            className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-emerald-royal hover:bg-red-500 hover:text-white transition-all shadow-md z-10"
                                            title="Remove from Wishlist"
                                            aria-label={`Remove ${product.name} from wishlist`}
                                        >
                                            <X size={16} />
                                        </button>

                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-emerald-royal/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            {soldOut ? (
                                                <Link href={href} className={actionClass}>View Piece</Link>
                                            ) : needsChoice ? (
                                                <Link href={href} className={actionClass}>Choose Size</Link>
                                            ) : (
                                                <button onClick={() => addToCart(product)} className={actionClass}>
                                                    Add to Bag
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 text-center">
                                        <Link href={href}>
                                            <h3 className="text-lg font-serif text-emerald-royal hover:text-heritage-gold transition-colors">{product.name}</h3>
                                        </Link>
                                        <p className="text-[10px] uppercase tracking-widest text-emerald-royal/50 my-2">
                                            {product.category?.name || product.category}
                                        </p>
                                        <p>
                                            <span className="text-heritage-gold font-bold">{formatPrice(price)}</span>
                                            {onSale && <span className="ml-2 text-xs text-emerald-royal/40 line-through">{formatPrice(original)}</span>}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
            <Toast />
        </main>
    );
}
