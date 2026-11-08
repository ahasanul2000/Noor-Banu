"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
    formatPrice,
    getOptimizedImage,
    getProductColors,
    getProductImages,
    getProductPricing,
    getProductSizes,
} from "@/lib/utils";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function ProductCard({ product, index = 0, priority = false }) {
    const { addToCart, toggleWishlist, wishlistItems } = useStore();
    const isWishlisted = wishlistItems.has(product.id);
    const [isHovered, setIsHovered] = React.useState(false);

    // Get primary and secondary images
    const images = getProductImages(product);
    const primaryImage = getOptimizedImage(images[0]);
    const secondaryImage = images.length > 1 ? getOptimizedImage(images[1]) : primaryImage;

    const href = `/product/${product.slug || product.id}`;
    const { price, original, onSale, percentOff } = getProductPricing(product);
    const soldOut = product.in_stock === false;
    // Sized or multi-colour pieces need a choice on the product page before they can go in the bag
    const needsChoice = getProductSizes(product).length > 0 || getProductColors(product).length > 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            viewport={{ once: true }}
            className="group relative flex flex-col h-full"
        >
            <div
                className="relative overflow-hidden rounded-2xl mb-5 aspect-[3/4] bg-muslin-cream/50 nakshi-border transition-all duration-1000 group-hover:royal-shadow"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {(product.badge || (onSale && !soldOut)) && (
                    <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
                        {product.badge && (
                            <span className="relative inline-block px-4 py-1.5 text-[9px] uppercase font-bold tracking-[0.2em] text-heritage-gold border border-heritage-gold/30 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm -z-10"></div>
                                {product.badge}
                            </span>
                        )}
                        {onSale && !soldOut && (
                            <span className="inline-block px-3 py-1 text-[9px] uppercase font-bold tracking-[0.2em] text-white bg-deep-maroon rounded-full shadow-md">
                                -{percentOff}%
                            </span>
                        )}
                    </div>
                )}

                <Link href={href} className="block h-full relative cursor-none md:cursor-pointer">
                    {/* Primary Image */}
                    <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={cn(
                            "object-cover transition-all duration-700 ease-out",
                            isHovered ? "opacity-0 scale-110" : "opacity-100 scale-100"
                        )}
                    />

                    {/* Secondary Image - Shows on Hover */}
                    <Image
                        src={secondaryImage}
                        alt={`${product.name} - alternate view`}
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={cn(
                            "object-cover transition-all duration-700 ease-out",
                            isHovered ? "opacity-100 scale-110" : "opacity-0 scale-100"
                        )}
                    />

                    {/* Sold Out Veil */}
                    {soldOut && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <span className="px-5 py-2 bg-emerald-royal/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-full shadow-lg">
                                Sold out
                            </span>
                        </div>
                    )}

                    {/* Satin Shimmer Overlay on Hover */}
                    <div className="absolute inset-x-0 inset-y-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-[1500ms] pointer-events-none"></div>
                </Link>

                {/* Glassmorphism Actions Panel */}
                {!soldOut && (
                    <div className="absolute bottom-4 left-4 right-4 p-2 translate-y-[120%] group-hover:translate-y-0 transition-all duration-700 delay-75 z-20">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl shadow-2xl flex gap-1">
                            {needsChoice ? (
                                <Link
                                    href={href}
                                    className="flex-1 text-center bg-emerald-royal text-white py-3.5 text-[9px] uppercase tracking-[0.25em] font-bold hover:bg-heritage-gold transition-all duration-500 rounded-lg shadow-inner active:scale-95"
                                    aria-label={`Choose options for ${product.name}`}
                                >
                                    Choose Size
                                </Link>
                            ) : (
                                <button
                                    onClick={() => addToCart(product)}
                                    className="flex-1 bg-emerald-royal text-white py-3.5 text-[9px] uppercase tracking-[0.25em] font-bold hover:bg-heritage-gold transition-all duration-500 rounded-lg shadow-inner active:scale-95"
                                    aria-label={`Add ${product.name} to bag`}
                                >
                                    Keep in My Bag
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                        "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md z-20 border border-white/20",
                        isWishlisted ? "bg-white shadow-xl" : "bg-white/40 hover:bg-white"
                    )}
                    aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                >
                    <motion.div
                        animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ repeat: isWishlisted ? Infinity : 0, duration: 2 }}
                    >
                        <Heart
                            size={18}
                            className={cn(
                                "transition-colors duration-500",
                                isWishlisted ? "fill-deep-maroon text-deep-maroon" : "text-emerald-royal/60"
                            )}
                        />
                    </motion.div>
                </button>
            </div>

            <div className="px-1 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] text-heritage-gold uppercase tracking-[0.35em] font-bold">
                        {product.category?.name || product.category}
                    </span>
                    <div className="h-px flex-1 bg-heritage-gold/10"></div>
                </div>

                <Link href={href} className="block mb-2">
                    <h3 className="font-serif text-lg md:text-xl text-emerald-royal group-hover:text-heritage-gold transition-colors duration-500 leading-snug">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto pt-2 flex items-end justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-emerald-royal/40 font-bold mb-0.5">
                            {soldOut ? "Sold out" : "Investment"}
                        </span>
                        <div className="flex items-baseline flex-wrap gap-x-2">
                            <p className={cn(
                                "font-serif text-lg md:text-xl font-medium tracking-tight",
                                onSale ? "text-deep-maroon" : "text-emerald-royal"
                            )}>
                                {formatPrice(price)}
                            </p>
                            {onSale && (
                                <span className="text-xs text-emerald-royal/40 line-through">{formatPrice(original)}</span>
                            )}
                        </div>
                    </div>
                    {/* View Details Subtle Hook */}
                    <div className="text-heritage-gold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-700">
                        <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Details &rarr;</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
