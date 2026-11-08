"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ArrowRight, AlertCircle, Truck, Loader2, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatPrice, getOptimizedImage, cn } from "@/lib/utils";
import { useCheckoutQuote } from "@/hooks/useCheckoutQuote";

function FreeDeliveryHint({ subtotal, threshold }) {
    if (!threshold || threshold <= 0) return null;
    const remaining = Math.max(0, threshold - subtotal);
    const progress = Math.min(100, (subtotal / threshold) * 100);

    return (
        <div className="mb-6 p-4 bg-muslin-cream border border-heritage-gold/20">
            <p className="flex items-center gap-2 text-xs text-emerald-royal mb-3">
                <Truck size={16} className="text-heritage-gold shrink-0" aria-hidden="true" />
                {remaining > 0 ? (
                    <span>
                        Add <strong>{formatPrice(remaining)}</strong> more for <strong>free delivery</strong>.
                    </span>
                ) : (
                    <span className="font-bold">You&apos;ve unlocked free delivery!</span>
                )}
            </p>
            <div
                className="h-1.5 bg-emerald-royal/10 overflow-hidden"
                role="progressbar"
                aria-label="Progress towards free delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
            >
                <motion.div
                    className="h-full bg-heritage-gold"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
    );
}

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, settings, hydrated } = useStore();
    const { quote, loading, message, lineErrors } = useCheckoutQuote();

    const hasErrors = Object.keys(lineErrors).length > 0;
    // With line errors the server leaves those lines out of its subtotal, so show the bag total instead.
    const subtotal = quote && !hasErrors ? Number(quote.subtotal) : cartTotal;
    const threshold = Number(settings?.free_shipping_threshold) || 0;
    const canCheckout = !hasErrors && !loading && !message;

    return (
        <main className="bg-muslin-cream min-h-screen">
            <Navbar />

            <div className="pt-nav pb-16 max-w-7xl mx-auto px-4 md:px-6">
                <h1 className="text-3xl md:text-5xl font-serif text-emerald-royal mb-8 text-center">Your Royal Bag</h1>

                {!hydrated ? (
                    <div className="py-20 flex justify-center" aria-live="polite">
                        <Loader2 className="animate-spin text-heritage-gold" size={32} aria-label="Loading your bag" />
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="text-center py-20 bg-white shadow-xl rounded-sm border border-heritage-gold/20">
                        <p className="text-lg text-emerald-royal/60 mb-8 font-serif">Your bag is currently empty, my majesty.</p>
                        <Link
                            href="/shop"
                            className="inline-block px-8 py-3 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnimatePresence initial={false}>
                                {cartItems.map((item) => {
                                    const href = `/product/${item.slug || item.product_id}`;
                                    const error = lineErrors[item.key];
                                    const atMax = item.max ? item.quantity >= item.max : false;
                                    return (
                                        <motion.div
                                            key={item.key}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -30 }}
                                            className={cn(
                                                "bg-white p-4 sm:p-6 shadow-md border gap-6 hover:shadow-lg transition-shadow",
                                                error ? "border-red-300" : "border-heritage-gold/10"
                                            )}
                                        >
                                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                                <Link href={href} className="relative w-full sm:w-32 h-56 sm:h-40 flex-shrink-0 bg-muslin-cream block overflow-hidden">
                                                    <Image
                                                        src={getOptimizedImage(item.image)}
                                                        alt={item.name}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, 128px"
                                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                                    />
                                                </Link>

                                                <div className="flex-1 text-center sm:text-left w-full">
                                                    <h3 className="text-xl font-serif text-emerald-royal">
                                                        <Link href={href} className="hover:text-heritage-gold transition-colors">
                                                            {item.name}
                                                        </Link>
                                                    </h3>
                                                    {item.category && (
                                                        <p className="text-xs text-emerald-royal/50 uppercase tracking-widest mb-1">{item.category}</p>
                                                    )}
                                                    {(item.size || item.color) && (
                                                        <p className="text-xs text-emerald-royal/70 mb-2 space-x-3">
                                                            {item.size && <span>Size: <strong>{item.size}</strong></span>}
                                                            {item.color && <span>Colour: <strong>{item.color}</strong></span>}
                                                        </p>
                                                    )}
                                                    <div className="text-lg font-bold text-heritage-gold">{formatPrice(item.price)}</div>
                                                    {item.quantity > 1 && (
                                                        <p className="text-xs text-emerald-royal/50">
                                                            Line total: {formatPrice((item.price || 0) * item.quantity)}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 sm:gap-6">
                                                    <div className="flex items-center border border-emerald-royal/20" role="group" aria-label={`Quantity of ${item.name}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.key, -1)}
                                                            className="p-3 text-emerald-royal hover:bg-emerald-royal/5 transition-colors disabled:opacity-30"
                                                            disabled={item.quantity <= 1}
                                                            aria-label="Decrease quantity"
                                                        >
                                                            <Minus size={16} />
                                                        </button>
                                                        <span className="w-10 text-center text-sm font-bold text-emerald-royal" aria-live="polite">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(item.key, 1)}
                                                            className="p-3 text-emerald-royal hover:bg-emerald-royal/5 transition-colors disabled:opacity-30"
                                                            disabled={atMax}
                                                            aria-label="Increase quantity"
                                                            title={atMax ? "No more in stock" : undefined}
                                                        >
                                                            <Plus size={16} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.key)}
                                                        className="text-red-500 hover:text-red-600 transition-colors p-3"
                                                        aria-label={`Remove ${item.name} from bag`}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                            {error && (
                                                <p className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2" role="alert">
                                                    <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
                                                    {error}
                                                </p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white p-6 md:p-8 shadow-xl border-t-4 border-heritage-gold lg:sticky lg:top-32">
                                <h2 className="text-xl font-serif text-emerald-royal mb-6 border-b border-emerald-royal/10 pb-4">Order Summary</h2>

                                <FreeDeliveryHint subtotal={subtotal} threshold={threshold} />

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm text-emerald-royal/80">
                                        <span>Subtotal</span>
                                        <span className="flex items-center gap-2">
                                            {loading && <Loader2 size={12} className="animate-spin" aria-label="Updating" />}
                                            {formatPrice(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-emerald-royal/80">
                                        <span>Delivery</span>
                                        <span className="text-emerald-royal/50 text-xs italic">Calculated at checkout</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-emerald-royal pt-4 border-t border-emerald-royal/10">
                                        <span>Total</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                </div>

                                {message && (
                                    <p className="mb-4 text-xs text-red-600 flex items-start gap-2" role="alert">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                                        {message}
                                    </p>
                                )}
                                {hasErrors && (
                                    <p className="mb-4 text-xs text-red-600 flex items-start gap-2" role="alert">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                                        Please fix the highlighted items in your bag before checking out.
                                    </p>
                                )}

                                {canCheckout ? (
                                    <Link
                                        href="/checkout"
                                        className="w-full py-4 bg-heritage-gold text-white uppercase tracking-widest text-xs font-bold hover:bg-emerald-royal transition-all shadow-lg flex items-center justify-center gap-2 group"
                                    >
                                        Checkout Now
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-4 bg-heritage-gold/50 text-white uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                                        Checkout Now
                                    </button>
                                )}

                                <p className="text-[11px] text-center text-emerald-royal/60 mt-4 flex items-center justify-center gap-1.5">
                                    <ShieldCheck size={14} className="text-heritage-gold" aria-hidden="true" />
                                    Delivery charge calculated at checkout · Cash on Delivery
                                </p>
                                <Link
                                    href="/shop"
                                    className="block text-center text-[10px] uppercase tracking-widest font-bold text-emerald-royal/60 hover:text-heritage-gold mt-4"
                                >
                                    Continue shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
