"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle, Banknote, Check, ClipboardCheck, Clock, Home, Loader2, MapPin, Package, RotateCcw, Search, Truck, XCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { cn, formatPrice, getOptimizedImage } from "@/lib/utils";

const STEPS = [
    { status: "pending", label: "Order placed", icon: Clock },
    { status: "confirmed", label: "Confirmed", icon: ClipboardCheck },
    { status: "processing", label: "Processing", icon: Package },
    { status: "shipped", label: "Shipped", icon: Truck },
    { status: "delivered", label: "Delivered", icon: Home },
];
const AREA_LABELS = { inside_dhaka: "Inside Dhaka", outside_dhaka: "Outside Dhaka" };

const inputClass = "w-full bg-white border border-emerald-royal/20 px-4 py-3.5 text-base md:text-sm text-emerald-royal outline-none focus:border-heritage-gold focus:ring-1 focus:ring-heritage-gold/40 placeholder:text-emerald-royal/30";

function formatDate(iso) {
    if (!iso) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function StatusTimeline({ order }) {
    if (order.status === "cancelled" || order.status === "returned") {
        const cancelled = order.status === "cancelled";
        const Icon = cancelled ? XCircle : RotateCcw;
        return (
            <div className={cn("flex items-start gap-4 p-5 border-l-4", cancelled ? "bg-red-50 border-red-500" : "bg-amber-50 border-amber-500")} role="status">
                <Icon size={28} className={cancelled ? "text-red-600 shrink-0" : "text-amber-600 shrink-0"} aria-hidden="true" />
                <div>
                    <p className="font-serif text-lg text-emerald-royal">Order {order.status_label || (cancelled ? "Cancelled" : "Returned")}</p>
                    <p className="text-sm text-emerald-royal/70">
                        {cancelled
                            ? "This order has been cancelled. If this is unexpected, please contact us."
                            : "This order has been returned to us. Contact us if you have any questions about your refund or exchange."}
                    </p>
                </div>
            </div>
        );
    }

    const current = Math.max(0, STEPS.findIndex((s) => s.status === order.status));
    return (
        <ol className="flex flex-col sm:flex-row sm:items-start gap-0" aria-label="Order progress">
            {STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current;
                const reached = i <= current;
                const Icon = step.icon;
                return (
                    <li key={step.status} className="relative flex sm:flex-col items-center sm:flex-1 gap-4 sm:gap-3 pb-6 sm:pb-0 last:pb-0" aria-current={active ? "step" : undefined}>
                        {/* connector */}
                        {i < STEPS.length - 1 && (
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute bg-emerald-royal/10 left-5 top-10 w-0.5 h-[calc(100%-2.5rem)] sm:left-1/2 sm:top-5 sm:h-0.5 sm:w-full",
                                    done && "bg-emerald-royal"
                                )}
                            />
                        )}
                        <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                                done && "bg-emerald-royal border-emerald-royal text-white",
                                active && "bg-heritage-gold border-heritage-gold text-white ring-4 ring-heritage-gold/20",
                                !reached && "bg-white border-emerald-royal/15 text-emerald-royal/30"
                            )}
                        >
                            {done ? <Check size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
                        </motion.span>
                        <span className={cn("text-xs uppercase tracking-widest font-bold sm:text-center", reached ? "text-emerald-royal" : "text-emerald-royal/30")}>
                            {step.label}
                            <span className="sr-only">{done ? " (completed)" : active ? " (current)" : " (upcoming)"}</span>
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

function OrderDetails({ order }) {
    const paid = order.payment_status === "paid";
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <section className="bg-white shadow-xl border-t-4 border-heritage-gold p-6 md:p-8" aria-labelledby="status-heading">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-emerald-royal/10">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/50">Order number</p>
                        <h2 id="status-heading" className="text-3xl font-serif font-bold text-emerald-royal tracking-wider">{order.order_number}</h2>
                        <p className="text-xs text-emerald-royal/60 mt-1">Placed on {formatDate(order.created_at)}</p>
                    </div>
                    <div className="sm:text-right">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/50">Status</p>
                        <p className="text-lg font-serif text-heritage-gold">{order.status_label || order.status}</p>
                    </div>
                </div>
                <StatusTimeline order={order} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <section className="md:col-span-3 bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="items-heading">
                    <h3 id="items-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10">Items</h3>
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
                                        <span>{item.quantity} × {formatPrice(item.unit_price)}</span>
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
                            <dt>Total</dt><dd>{formatPrice(order.total)}</dd>
                        </div>
                    </dl>
                </section>

                <div className="md:col-span-2 space-y-8">
                    <section className="bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="payment-heading">
                        <h3 id="payment-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10 flex items-center gap-2">
                            <Banknote size={18} className="text-heritage-gold" aria-hidden="true" /> Payment
                        </h3>
                        <p className="text-sm text-emerald-royal">
                            Cash on Delivery ·{" "}
                            <span className={cn("inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold", paid ? "bg-emerald-royal text-white" : "bg-heritage-gold/15 text-heritage-gold")}>
                                {paid ? "Paid" : "Unpaid"}
                            </span>
                        </p>
                        {!paid && !["cancelled", "returned"].includes(order.status) && (
                            <p className="text-xs text-emerald-royal/60 mt-2">Please keep {formatPrice(order.total)} ready for the delivery person.</p>
                        )}
                    </section>
                    <section className="bg-white shadow-md border border-heritage-gold/10 p-6" aria-labelledby="address-heading">
                        <h3 id="address-heading" className="text-lg font-serif text-emerald-royal mb-4 pb-3 border-b border-emerald-royal/10 flex items-center gap-2">
                            <MapPin size={18} className="text-heritage-gold" aria-hidden="true" /> Delivery to
                        </h3>
                        <address className="not-italic text-sm text-emerald-royal/80 leading-relaxed">
                            <strong className="text-emerald-royal">{order.customer_name}</strong><br />
                            {order.shipping_address}<br />
                            {order.city}{order.shipping_area ? ` · ${AREA_LABELS[order.shipping_area] || order.shipping_area}` : ""}
                        </address>
                    </section>
                </div>
            </div>
        </motion.div>
    );
}

function TrackOrder({ initialOrder, initialPhone }) {
    const router = useRouter();
    const autoSubmit = Boolean(initialOrder && initialPhone);
    const [orderNumber, setOrderNumber] = useState(initialOrder);
    const [phone, setPhone] = useState(initialPhone);
    const [loading, setLoading] = useState(autoSubmit);
    const [error, setError] = useState(null);
    const [order, setOrder] = useState(null);

    const handleResult = (res) => {
        setLoading(false);
        if (res.ok) {
            setOrder(res.data);
            setError(null);
        } else {
            setOrder(null);
            setError(res.message || "We couldn't find that order.");
        }
    };

    useEffect(() => {
        if (!autoSubmit) return undefined;
        let cancelled = false;
        api.trackOrder(initialOrder.trim(), initialPhone.replace(/[\s-]/g, "")).then((res) => {
            if (!cancelled) handleResult(res);
        });
        return () => {
            cancelled = true;
        };
    }, [autoSubmit, initialOrder, initialPhone]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const o = orderNumber.trim().toUpperCase();
        const p = phone.replace(/[\s-]/g, "");
        if (!o || !p) {
            setError("Please enter both your order number and phone number.");
            return;
        }
        setLoading(true);
        setError(null);
        // Keep the URL shareable / refresh-safe without re-mounting this form.
        router.replace(`/track-order?order=${encodeURIComponent(o)}&phone=${encodeURIComponent(p)}`, { scroll: false });
        handleResult(await api.trackOrder(o, p));
    };

    return (
        <div className="space-y-10">
            <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto bg-white shadow-xl border border-heritage-gold/20 p-6 md:p-8" aria-describedby={error ? "track-error" : undefined}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label htmlFor="order_number" className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                            Order number<span className="text-deep-maroon ml-1" aria-hidden="true">*</span>
                        </label>
                        <input
                            id="order_number"
                            type="text"
                            required
                            autoCapitalize="characters"
                            autoComplete="off"
                            maxLength={30}
                            value={orderNumber}
                            onChange={(e) => setOrderNumber(e.target.value)}
                            className={cn(inputClass, "uppercase")}
                            placeholder="e.g. NB000123"
                        />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                            Phone number<span className="text-deep-maroon ml-1" aria-hidden="true">*</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            required
                            maxLength={20}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={inputClass}
                            placeholder="01712345678"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="mt-6 w-full py-4 min-h-[52px] bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                    {loading ? "Finding your order…" : "Track order"}
                </button>
                <p className="mt-4 text-xs text-center text-emerald-royal/50">
                    Use the phone number you placed the order with. Your order number is on your confirmation page (e.g. NB000123).
                </p>
                <AnimatePresence>
                    {error && (
                        <motion.p
                            id="track-error"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 p-3"
                            role="alert"
                        >
                            <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </form>

            <div aria-live="polite">
                {order && <OrderDetails order={order} />}
            </div>

            {order && (
                <div className="text-center">
                    <Link href="/shop" className="inline-block px-8 py-4 border border-emerald-royal text-emerald-royal uppercase tracking-widest text-xs font-bold hover:bg-emerald-royal hover:text-white transition-colors">
                        Continue shopping
                    </Link>
                </div>
            )}
        </div>
    );
}

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const initialOrder = searchParams.get("order") || "";
    const initialPhone = searchParams.get("phone") || "";
    return <TrackOrder initialOrder={initialOrder} initialPhone={initialPhone} />;
}

export default function TrackOrderPage() {
    return (
        <main className="bg-muslin-cream min-h-screen">
            <Navbar />
            <div className="pt-nav pb-16 max-w-5xl mx-auto px-4 md:px-6">
                <div className="text-center mb-10">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-heritage-gold mb-2">Order status</p>
                    <h1 className="text-3xl md:text-5xl font-serif text-emerald-royal">Track Your Order</h1>
                </div>
                <Suspense
                    fallback={
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-heritage-gold" size={32} aria-label="Loading" />
                        </div>
                    }
                >
                    <TrackOrderContent />
                </Suspense>
            </div>
            <Footer />
        </main>
    );
}
