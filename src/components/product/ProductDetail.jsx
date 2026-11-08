"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, ShieldCheck, Truck, RefreshCw,
    Banknote, Minus, Plus, Ruler, Zap,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import {
    cn,
    formatPrice,
    getOptimizedImage,
    getProductColors,
    getProductDetails,
    getProductImages,
    getProductPricing,
    getProductSizes,
    getStockFor,
} from "@/lib/utils";

export function ProductDetail({ product }) {
    const router = useRouter();
    const { addToCart, toggleWishlist, wishlistItems } = useStore();
    const [activeImage, setActiveImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);

    if (!product) return null;

    const isWishlisted = wishlistItems.has(product.id);
    const images = getProductImages(product);
    const details = getProductDetails(product);
    const sizes = getProductSizes(product);
    const colors = getProductColors(product);
    const { price, original, onSale, percentOff } = getProductPricing(product);

    // A single size / colour is chosen for the customer
    const size = selectedSize ?? (sizes.length === 1 && sizes[0].stock > 0 ? sizes[0].size : null);
    const color = selectedColor ?? (colors.length === 1 ? colors[0] : null);

    const soldOut = product.in_stock === false;
    // Before a size is picked, let the stepper go as high as the best-stocked size
    const maxQty = sizes.length > 0 && !size
        ? Math.max(0, ...sizes.map((s) => Number(s.stock) || 0))
        : getStockFor(product, size);
    const qty = Math.max(1, Math.min(quantity, maxQty || 1));
    const sizeStock = size ? getStockFor(product, size) : null;

    const imageCount = images.length;
    const nextImage = () => setActiveImage((prev) => (prev + 1) % imageCount);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + imageCount) % imageCount);

    const handleAdd = () => addToCart(product, { size, color, quantity: qty });
    const handleBuyNow = () => {
        if (handleAdd()) router.push("/checkout");
    };

    return (
        <section className="pt-nav pb-16 md:pb-24 bg-muslin-cream">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-14 items-start">

                    {/* Left: Image Gallery */}
                    <div className="space-y-4 w-full mx-auto max-w-xl lg:max-w-[min(100%,calc((100vh-var(--nav-h)-10rem)*3/4))] lg:sticky lg:top-[calc(var(--nav-h)+1.5rem)]">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl nakshi-border group bg-white">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeImage}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full w-full"
                                >
                                    <Image
                                        src={getOptimizedImage(images[activeImage])}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        className="object-cover"
                                        priority
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {soldOut && (
                                <div className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-emerald-royal/90 text-white text-[10px] uppercase tracking-[0.3em] font-bold rounded-full shadow-lg">
                                    Sold out
                                </div>
                            )}

                            {/* Navigation Arrows - Optimized for Touch */}
                            {imageCount > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        aria-label="Previous image"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-all z-10 hover:bg-white text-emerald-royal"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        aria-label="Next image"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-all z-10 hover:bg-white text-emerald-royal"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {imageCount > 1 && (
                            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 no-scrollbar px-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={img}
                                        onClick={() => setActiveImage(idx)}
                                        aria-label={`View image ${idx + 1}`}
                                        className={`relative w-16 md:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === idx ? "border-heritage-gold scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <Image src={getOptimizedImage(img)} alt={`${product.name} thumbnail ${idx + 1}`} fill sizes="100px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Details */}
                    <div className="space-y-6 md:space-y-8 px-2 lg:px-0">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-heritage-gold text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
                                    {product.category?.name || product.category}
                                </span>
                                {product.badge && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-heritage-gold/30"></div>
                                        <span className="bg-heritage-gold text-white text-[9px] md:text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-widest shadow-sm">
                                            {product.badge}
                                        </span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl xl:text-5xl font-serif text-emerald-royal leading-tight">
                                {product.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <p className={cn("text-3xl md:text-4xl font-bold", onSale ? "text-deep-maroon" : "text-emerald-royal")}>
                                        {formatPrice(price)}
                                    </p>
                                    {onSale && (
                                        <>
                                            <span className="text-lg text-emerald-royal/40 line-through">{formatPrice(original)}</span>
                                            <span className="bg-deep-maroon text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-widest">
                                                Save {percentOff}%
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-heritage-gold sm:pl-6 sm:border-l border-heritage-gold/20">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} className="fill-current" />
                                    ))}
                                    <span className="text-emerald-royal/40 text-[10px] md:text-xs ml-2 font-bold uppercase tracking-widest">Royal Reviews</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] md:text-xs uppercase tracking-widest font-bold">
                                <span className={cn("flex items-center gap-2", soldOut ? "text-deep-maroon" : "text-emerald-royal")}>
                                    <span className={cn("w-2 h-2 rounded-full", soldOut ? "bg-deep-maroon" : "bg-emerald-500")}></span>
                                    {soldOut ? "Sold out" : "In stock"}
                                </span>
                                {product.sku && (
                                    <span className="text-emerald-royal/40">SKU: {product.sku}</span>
                                )}
                            </div>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 leading-relaxed font-light text-lg md:text-xl max-w-xl"
                        >
                            {product.description}
                        </motion.p>

                        {/* Options */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="space-y-6"
                        >
                            {sizes.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-bold text-emerald-royal">
                                            Size{size && <span className="text-heritage-gold">: {size}</span>}
                                        </span>
                                        <Link
                                            href="/size-guide"
                                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-heritage-gold hover:text-emerald-royal transition-colors"
                                        >
                                            <Ruler size={14} />
                                            Size Guide
                                        </Link>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map((s) => {
                                            const out = !(Number(s.stock) > 0);
                                            const active = size === s.size;
                                            return (
                                                <button
                                                    key={s.size}
                                                    onClick={() => setSelectedSize(s.size)}
                                                    disabled={out}
                                                    aria-pressed={active}
                                                    aria-label={out ? `Size ${s.size} (sold out)` : `Size ${s.size}`}
                                                    className={cn(
                                                        "min-w-[3rem] h-12 px-4 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all",
                                                        active && "bg-emerald-royal border-emerald-royal text-white shadow-lg",
                                                        !active && !out && "bg-white border-heritage-gold/20 text-emerald-royal hover:border-heritage-gold",
                                                        out && "bg-white/50 border-gray-200 text-gray-300 line-through cursor-not-allowed"
                                                    )}
                                                >
                                                    {s.size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {size && sizeStock > 0 && sizeStock <= 3 && (
                                        <p className="text-xs text-deep-maroon font-bold tracking-wide">
                                            Only {sizeStock} left in size {size}
                                        </p>
                                    )}
                                </div>
                            )}

                            {colors.length > 0 && (
                                <div className="space-y-3">
                                    <span className="block text-[10px] md:text-xs uppercase tracking-[0.25em] font-bold text-emerald-royal">
                                        Colour{color && <span className="text-heritage-gold">: {color}</span>}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map((c) => (
                                            <button
                                                key={c}
                                                onClick={() => setSelectedColor(c)}
                                                aria-pressed={color === c}
                                                className={cn(
                                                    "h-11 px-5 rounded-full border text-xs font-bold tracking-widest transition-all",
                                                    color === c
                                                        ? "bg-emerald-royal border-emerald-royal text-white shadow-lg"
                                                        : "bg-white border-heritage-gold/20 text-emerald-royal hover:border-heritage-gold"
                                                )}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!soldOut && (
                                <div className="space-y-3">
                                    <span className="block text-[10px] md:text-xs uppercase tracking-[0.25em] font-bold text-emerald-royal">
                                        Quantity
                                    </span>
                                    <div className="inline-flex items-center bg-white border border-heritage-gold/20 rounded-lg">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, qty - 1))}
                                            disabled={qty <= 1}
                                            aria-label="Decrease quantity"
                                            className="w-12 h-12 flex items-center justify-center text-emerald-royal disabled:opacity-30 hover:text-heritage-gold transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-10 text-center font-bold text-emerald-royal" aria-live="polite">{qty}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(maxQty, qty + 1))}
                                            disabled={qty >= maxQty}
                                            aria-label="Increase quantity"
                                            className="w-12 h-12 flex items-center justify-center text-emerald-royal disabled:opacity-30 hover:text-heritage-gold transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-4 py-8 border-y border-heritage-gold/10"
                        >
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAdd}
                                    disabled={soldOut}
                                    className="flex-1 gold-gradient-bg text-white py-5 px-8 uppercase tracking-[0.2em] font-bold text-xs md:text-sm shadow-2xl hover:shadow-emerald-royal/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    <ShoppingBag size={20} />
                                    {soldOut ? "Sold out" : "Add to bag"}
                                </button>
                                {!soldOut && (
                                    <button
                                        onClick={handleBuyNow}
                                        className="flex-1 bg-emerald-royal text-white py-5 px-8 uppercase tracking-[0.2em] font-bold text-xs md:text-sm shadow-2xl hover:bg-heritage-gold transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Zap size={20} />
                                        Buy now
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => toggleWishlist(product.id)}
                                className={`w-full border-2 py-4 px-8 uppercase tracking-[0.2em] font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-3 ${isWishlisted
                                    ? "border-deep-maroon text-deep-maroon bg-deep-maroon/5 shadow-inner"
                                    : "border-emerald-royal text-emerald-royal hover:bg-emerald-royal hover:text-white"
                                    }`}
                            >
                                <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
                                {isWishlisted ? "Saved in My Sanctuary" : "Save to My Sanctuary"}
                            </button>
                        </motion.div>

                        {/* Features/Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {details.length > 0 && (
                                <div className="space-y-5">
                                    <h4 className="font-serif text-xl md:text-2xl text-emerald-royal">Shundor (Beautiful) Details</h4>
                                    <ul className="space-y-4">
                                        {details.map((detail, idx) => (
                                            <li key={idx} className="flex items-center gap-4 text-sm md:text-base text-gray-500 font-light">
                                                <div className="w-2 h-2 rounded-full bg-heritage-gold flex-shrink-0 animate-pulse"></div>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-5 bg-white p-8 rounded-2xl shadow-xl border border-heritage-gold/5 flex flex-col justify-center">
                                <div className="flex items-center gap-4 text-sm md:text-base text-emerald-royal font-bold">
                                    <Banknote size={20} className="text-heritage-gold flex-shrink-0" />
                                    <span>Cash on Delivery available</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm md:text-base text-emerald-royal font-bold">
                                    <ShieldCheck size={20} className="text-heritage-gold flex-shrink-0" />
                                    <span>Real Nawabi Quality</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm md:text-base text-emerald-royal font-bold">
                                    <Truck size={20} className="text-heritage-gold flex-shrink-0" />
                                    <span>Fast Royal Delivery</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm md:text-base text-emerald-royal font-bold">
                                    <RefreshCw size={20} className="text-heritage-gold flex-shrink-0" />
                                    <span>Easy 14-day Exchange</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
