"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Banknote, Check, CheckCircle2, Copy, Loader2, MapPin, PackageCheck, PhoneCall, Truck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useStore } from "@/context/StoreContext";
import { formatPrice, getOptimizedImage } from "@/lib/utils";

const AREA_LABELS = { inside_dhaka: "Inside Dhaka", outside_dhaka: "Outside Dhaka" };

function readLastOrder(orderNumber) {
    try {
        const order = JSON.parse(sessionStorage.getItem("noorbanu_last_order") || "null");
        if (!order?.order_number) return null;
        if (orderNumber && order.order_number !== orderNumber) return null;
        return order;
    } catch {
        return null;
    }
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };
    return (
        <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-heritage-gold/40 text-[10px] uppercase tracking-widest font-bold text-heritage-gold hover:bg-heritage-gold hover:text-white transition-colors"
            aria-label={copied ? "Order number copied" : "Copy order number"}
        >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

const primaryBtn = "inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg";
const secondaryBtn = "inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] border border-emerald-royal text-emerald-royal uppercase tracking-widest text-xs font-bold hover:bg-emerald-royal hover:text-white transition-colors";

function Confirmation({ orderNumber }) {
    // Only rendered on the client (after the store hydrates), so sessionStorage is available here.
    const [order] = useState(() => readLastOrder(orderNumber));
    const number = order?.order_number || orderNumber;

    if (!number) {
        return (
            <div className="text-center py-20 bg-white shadow-xl border border-heritage-gold/20">
                <p className="text-lg text-emerald-royal/60 mb-8 font-serif">We couldn&apos;t find a recent order in this browser.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/track-order" className={primaryBtn}>Track an order</Link>
                    <Link href="/shop" className={secondaryBtn}>Continue shopping</Link>
                </div>
            </div>
        );
    }

    const trackHref = `/track-order?order=${encodeURIComponent(number)}${order?.customer_phone ? `&phone=${encodeURIComponent(order.customer_phone)}` : ""}`;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white shadow-xl border-t-4 border-heritage-gold p-6 md:p-10 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-royal text-white flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle2 size={36} aria-hidden="true" />
                </motion.div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-heritage-gold mb-2">Order placed</p>
                <h1 className="text-3xl md:text-5xl font-serif text-emerald-royal mb-4">
                    Thank you{order?.customer_name ? `, ${order.customer_name.split(" ")[0]}` : ""}!
                </h1>
                <p className="text-sm text-emerald-royal/70 mb-8">Your order has been received. Please keep your order number to track it.</p>

                <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-muslin-cream border border-heritage-gold/20 px-6 py-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/50">Order number</p>
                        <p className="text-3xl md:text-4xl font-serif font-bold text-emerald-royal tracking-wider select-all">{number}</p>
                    </div>
                    <CopyButton text={number} />
                </div>

                {order && (
                    <div className="mt-8 flex items-center justify-center gap-3 text-emerald-royal">
                        <Banknote size={24} className="text-heritage-gold" aria-hidden="true" />
                        <p className="text-sm">
                            Pay <strong className="text-xl">{formatPrice(order.total)}</strong> in cash on delivery
                        </p>
                    </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={trackHref} className={primaryBtn}>
                        <Truck size={16} aria-hidden="true" /> Track this order
                    </Link>
                    <Link href="/shop" className={secondaryBtn}>Continue shopping</Link>
                </div>
            </div>

            {order && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="items-heading">
                        <h2 id="items-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10">Your items</h2>
                        <ul className="space-y-4">
                            {(order.items || []).map((item, idx) => (
                                <li key={`${item.product_id}-${item.size}-${item.color}-${idx}`} className="flex gap-3">
                                    <div className="relative w-14 h-16 shrink-0 bg-muslin-cream">
                                        <Image src={getOptimizedImage(item.product_image)} alt={item.product_name} fill sizes="56px" className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-serif text-emerald-royal leading-snug">{item.product_name}</p>
                                        <p className="text-[11px] text-emerald-royal/60 space-x-2">
                                            {item.size && <span>Size {item.size}</span>}
                                            {item.color && <span>{item.color}</span>}
                                            <span>Qty {item.quantity}</span>
                                        </p>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-royal whitespace-nowrap">{formatPrice(item.line_total)}</p>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-4 pt-4 border-t border-emerald-royal/10 space-y-2 text-sm">
                            <div className="flex justify-between text-emerald-royal/80"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-emerald-royal/80">
                                    <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</dt>
                                    <dd>− {formatPrice(order.discount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between text-emerald-royal/80">
                                <dt>Delivery</dt>
                                <dd>{Number(order.shipping_cost) > 0 ? formatPrice(order.shipping_cost) : "Free"}</dd>
                            </div>
                            <div className="flex justify-between font-bold text-emerald-royal text-base pt-2 border-t border-emerald-royal/10">
                                <dt>Total (Cash on Delivery)</dt><dd>{formatPrice(order.total)}</dd>
                            </div>
                        </dl>
                    </section>

                    <div className="space-y-8">
                        <section className="bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="address-heading">
                            <h2 id="address-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10 flex items-center gap-2">
                                <MapPin size={18} className="text-heritage-gold" aria-hidden="true" /> Delivery address
                            </h2>
                            <address className="not-italic text-sm text-emerald-royal/80 leading-relaxed">
                                <strong className="text-emerald-royal">{order.customer_name}</strong><br />
                                {order.customer_phone}<br />
                                {order.shipping_address}<br />
                                {order.city}{order.shipping_area ? ` · ${AREA_LABELS[order.shipping_area] || order.shipping_area}` : ""}
                            </address>
                        </section>

                        <section className="bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="next-heading">
                            <h2 id="next-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10">What happens next</h2>
                            <ol className="space-y-4 text-sm text-emerald-royal/80">
                                <li className="flex gap-3">
                                    <PhoneCall size={18} className="text-heritage-gold shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>We&apos;ll call you on <strong>{order.customer_phone}</strong> to confirm your order.</span>
                                </li>
                                <li className="flex gap-3">
                                    <PackageCheck size={18} className="text-heritage-gold shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>Your pieces are carefully packed and handed to our delivery partner.</span>
                                </li>
                                <li className="flex gap-3">
                                    <Banknote size={18} className="text-heritage-gold shrink-0 mt-0.5" aria-hidden="true" />
                                    <span>Pay in cash when the parcel reaches your door.</span>
                                </li>
                            </ol>
                        </section>
                    </div>
                </div>
            )}

            {!order && (
                <p className="text-center text-sm text-emerald-royal/60">
                    Use the order number and the phone number you ordered with to see your order details and delivery status.
                </p>
            )}
        </motion.div>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const { hydrated } = useStore();
    const orderNumber = searchParams.get("order") || "";

    if (!hydrated) {
        return (
            <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-heritage-gold" size={32} aria-label="Loading your order" />
            </div>
        );
    }
    return <Confirmation key={orderNumber} orderNumber={orderNumber} />;
}

export default function CheckoutSuccessPage() {
    return (
        <main className="bg-muslin-cream min-h-screen">
            <Navbar />
            <div className="pt-nav pb-16 max-w-7xl mx-auto px-4 md:px-6">
                <Suspense
                    fallback={
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-heritage-gold" size={32} aria-label="Loading" />
                        </div>
                    }
                >
                    <SuccessContent />
                </Suspense>
            </div>
            <Footer />
        </main>
    );
}
