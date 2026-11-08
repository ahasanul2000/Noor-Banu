"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    AlertCircle, ArrowLeft, Banknote, CheckCircle2, Loader2, Lock, Tag, Truck, X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn, formatPrice, getOptimizedImage } from "@/lib/utils";
import { toOrderItems, useCheckoutQuote } from "@/hooks/useCheckoutQuote";

const INFO_KEY = "noorbanu_checkout_info";
const PHONE_RE = /^(\+?88)?01[3-9]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_ORDER = ["customer_name", "customer_phone", "customer_email", "shipping_address", "city", "shipping_area", "note"];

const normalisePhone = (value) => value.replace(/[\s-]/g, "");

function loadSavedInfo() {
    try {
        const saved = JSON.parse(localStorage.getItem(INFO_KEY) || "null");
        return saved && typeof saved === "object" ? saved : {};
    } catch {
        return {};
    }
}

function saveInfo(form) {
    try {
        const { customer_name, customer_phone, shipping_address, city, shipping_area } = form;
        localStorage.setItem(INFO_KEY, JSON.stringify({ customer_name, customer_phone, shipping_address, city, shipping_area }));
    } catch { /* storage unavailable */ }
}

function validate(form) {
    const errors = {};
    if (!form.customer_name.trim()) errors.customer_name = "Please enter your full name.";
    const phone = normalisePhone(form.customer_phone);
    if (!phone) errors.customer_phone = "Please enter your mobile number.";
    else if (!PHONE_RE.test(phone)) errors.customer_phone = "Please enter a valid Bangladeshi mobile number (e.g. 01712345678).";
    if (form.customer_email.trim() && !EMAIL_RE.test(form.customer_email.trim())) errors.customer_email = "Please enter a valid email address.";
    if (!form.shipping_address.trim()) errors.shipping_address = "Please enter your full delivery address.";
    if (!form.city.trim()) errors.city = "Please enter your city or district.";
    if (!form.shipping_area) errors.shipping_area = "Please choose a delivery area.";
    return errors;
}

const inputClass = (hasError) =>
    cn(
        "w-full bg-white border px-4 py-3.5 text-base md:text-sm text-emerald-royal outline-none transition-colors placeholder:text-emerald-royal/30",
        "focus:border-heritage-gold focus:ring-1 focus:ring-heritage-gold/40",
        hasError ? "border-red-400" : "border-emerald-royal/20"
    );

function Field({ id, label, required, error, hint, children, className }) {
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                {label}
                {required ? <span className="text-deep-maroon ml-1" aria-hidden="true">*</span> : <span className="ml-1 normal-case tracking-normal font-normal text-emerald-royal/40">(optional)</span>}
            </label>
            {children}
            {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-emerald-royal/50">{hint}</p>}
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5" role="alert">
                    <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}
        </div>
    );
}

function SectionTitle({ step, children }) {
    return (
        <h2 className="flex items-center gap-3 text-xl font-serif text-emerald-royal mb-6 pb-4 border-b border-emerald-royal/10">
            <span className="w-7 h-7 rounded-full bg-emerald-royal text-white text-xs font-bold flex items-center justify-center font-sans">{step}</span>
            {children}
        </h2>
    );
}

function CheckoutForm({ onPlaced }) {
    const { cartItems, settings } = useStore();
    const [form, setForm] = useState(() => {
        const saved = loadSavedInfo();
        return {
            customer_name: saved.customer_name || "",
            customer_phone: saved.customer_phone || "",
            customer_email: "",
            shipping_address: saved.shipping_address || "",
            city: saved.city || "",
            shipping_area: ["inside_dhaka", "outside_dhaka"].includes(saved.shipping_area) ? saved.shipping_area : "",
            note: "",
        };
    });
    // Fill blanks from the signed-in customer's profile once it is available.
    const { user } = useAuth();
    const [prefilledFor, setPrefilledFor] = useState(null);
    if (user && prefilledFor !== user.id) {
        setPrefilledFor(user.id);
        setForm((f) => ({
            ...f,
            customer_name: f.customer_name || user.name || "",
            customer_phone: f.customer_phone || user.phone || "",
            customer_email: f.customer_email || user.email || "",
            shipping_address: f.shipping_address || user.address || "",
            city: f.city || user.city || "",
            shipping_area: f.shipping_area || user.shipping_area || "",
        }));
    }
    const [errors, setErrors] = useState({});
    const [formMessage, setFormMessage] = useState(null);
    const [generalErrors, setGeneralErrors] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    const { quote, loading, message: quoteMessage, lineErrors } = useCheckoutQuote({
        couponCode: appliedCoupon,
        shippingArea: form.shipping_area || null,
    });

    const hasLineErrors = Object.keys(lineErrors).length > 0;
    const couponFailed = Boolean(appliedCoupon && quote && !loading && quote.coupon_error);
    const couponOk = Boolean(appliedCoupon && quote && !loading && quote.coupon_code && !quote.coupon_error);

    const quoteLine = (item) =>
        quote?.items?.find((l) => l.product_id === item.product_id && (l.size || null) === (item.size || null) && (l.color || null) === (item.color || null));

    const subtotal = quote ? Number(quote.subtotal) : cartItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
    const discount = quote ? Number(quote.discount) || 0 : 0;
    const shipping = quote ? Number(quote.shipping_cost) || 0 : null;
    const total = form.shipping_area && quote ? Number(quote.total) : Math.max(0, subtotal - discount);

    const insideCharge = Number(settings?.shipping_inside_dhaka) || 0;
    const outsideCharge = Number(settings?.shipping_outside_dhaka) || 0;
    const threshold = Number(settings?.free_shipping_threshold) || 0;
    const freeDelivery = threshold > 0 && subtotal >= threshold;

    const setField = (name) => (e) => {
        const value = e.target.value;
        setForm((f) => ({ ...f, [name]: value }));
        if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
    };

    const applyCoupon = () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setAppliedCoupon(code);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
    };

    const focusField = (name) => {
        const el = document.getElementById(name === "shipping_area" ? "shipping_area_inside_dhaka" : name);
        el?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setFormMessage(null);
        setGeneralErrors([]);

        const clientErrors = validate(form);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            setFormMessage("Please check the highlighted fields.");
            focusField(FIELD_ORDER.find((f) => clientErrors[f]));
            return;
        }
        setErrors({});
        setSubmitting(true);

        const payload = {
            ...form,
            customer_name: form.customer_name.trim(),
            customer_phone: normalisePhone(form.customer_phone),
            customer_email: form.customer_email.trim() || null,
            shipping_address: form.shipping_address.trim(),
            city: form.city.trim(),
            note: form.note.trim() || null,
            coupon_code: appliedCoupon && !couponFailed ? appliedCoupon : null,
            items: toOrderItems(cartItems),
        };

        const res = await api.placeOrder(payload);
        if (!res.ok) {
            const fieldErrors = {};
            const general = [];
            Object.entries(res.errors || {}).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : msgs;
                if (FIELD_ORDER.includes(field)) fieldErrors[field] = msg;
                else if (field.startsWith("items.")) {
                    const item = cartItems[Number(field.split(".")[1])];
                    general.push(item && !msg.includes(item.name) ? `${item.name}: ${msg}` : msg);
                } else general.push(msg);
            });
            setErrors(fieldErrors);
            setGeneralErrors(general);
            setFormMessage(res.message);
            setSubmitting(false);
            const first = FIELD_ORDER.find((f) => fieldErrors[f]);
            if (first) focusField(first);
            else window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        saveInfo(payload);
        onPlaced(res.data);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12 items-start">
            <div className="lg:col-span-3 space-y-8">
                {(formMessage || generalErrors.length > 0) && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700" role="alert">
                        <p className="font-bold flex items-center gap-2">
                            <AlertCircle size={16} aria-hidden="true" />
                            {formMessage || "We couldn't place your order."}
                        </p>
                        {generalErrors.length > 0 && (
                            <ul className="mt-2 list-disc pl-6 space-y-1">
                                {generalErrors.map((m) => <li key={m}>{m}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Contact & delivery */}
                <section className="bg-white p-6 md:p-8 shadow-md border border-heritage-gold/10" aria-labelledby="delivery-heading">
                    <SectionTitle step={1}><span id="delivery-heading">Delivery Details</span></SectionTitle>
                    {!user && (
                        <p className="-mt-2 mb-6 text-sm text-emerald-royal/60">
                            Have an account?{" "}
                            <Link href="/login?next=/checkout" className="font-bold text-emerald-royal underline underline-offset-4 hover:text-heritage-gold">Sign in</Link>
                            {" "}to fill this in automatically and keep your orders in one place. Or simply continue as a guest.
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field id="customer_name" label="Full name" required error={errors.customer_name} className="sm:col-span-2">
                            <input
                                id="customer_name"
                                name="customer_name"
                                type="text"
                                autoComplete="name"
                                required
                                maxLength={120}
                                value={form.customer_name}
                                onChange={setField("customer_name")}
                                aria-invalid={Boolean(errors.customer_name)}
                                aria-describedby={errors.customer_name ? "customer_name-error" : undefined}
                                className={inputClass(errors.customer_name)}
                                placeholder="e.g. Ayesha Rahman"
                            />
                        </Field>
                        <Field id="customer_phone" label="Mobile number" required error={errors.customer_phone} hint="We'll call this number to confirm your order.">
                            <input
                                id="customer_phone"
                                name="customer_phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                required
                                maxLength={20}
                                value={form.customer_phone}
                                onChange={setField("customer_phone")}
                                aria-invalid={Boolean(errors.customer_phone)}
                                aria-describedby={errors.customer_phone ? "customer_phone-error" : "customer_phone-hint"}
                                className={inputClass(errors.customer_phone)}
                                placeholder="01712345678"
                            />
                        </Field>
                        <Field id="customer_email" label="Email" error={errors.customer_email}>
                            <input
                                id="customer_email"
                                name="customer_email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                maxLength={150}
                                value={form.customer_email}
                                onChange={setField("customer_email")}
                                aria-invalid={Boolean(errors.customer_email)}
                                aria-describedby={errors.customer_email ? "customer_email-error" : undefined}
                                className={inputClass(errors.customer_email)}
                                placeholder="you@example.com"
                            />
                        </Field>
                        <Field id="shipping_address" label="Full address" required error={errors.shipping_address} className="sm:col-span-2" hint="House / road / area / landmark">
                            <textarea
                                id="shipping_address"
                                name="shipping_address"
                                autoComplete="street-address"
                                required
                                rows={3}
                                maxLength={500}
                                value={form.shipping_address}
                                onChange={setField("shipping_address")}
                                aria-invalid={Boolean(errors.shipping_address)}
                                aria-describedby={errors.shipping_address ? "shipping_address-error" : "shipping_address-hint"}
                                className={cn(inputClass(errors.shipping_address), "resize-y")}
                                placeholder="House 12, Road 5, Dhanmondi"
                            />
                        </Field>
                        <Field id="city" label="City / District" required error={errors.city} className="sm:col-span-2">
                            <input
                                id="city"
                                name="city"
                                type="text"
                                autoComplete="address-level2"
                                required
                                maxLength={100}
                                value={form.city}
                                onChange={setField("city")}
                                aria-invalid={Boolean(errors.city)}
                                aria-describedby={errors.city ? "city-error" : undefined}
                                className={inputClass(errors.city)}
                                placeholder="e.g. Dhaka, Chattogram, Sylhet"
                            />
                        </Field>

                        <fieldset className="sm:col-span-2" aria-describedby={errors.shipping_area ? "shipping_area-error" : undefined}>
                            <legend className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                                Delivery area<span className="text-deep-maroon ml-1" aria-hidden="true">*</span>
                            </legend>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { value: "inside_dhaka", label: "Inside Dhaka", charge: insideCharge, eta: "1–3 days" },
                                    { value: "outside_dhaka", label: "Outside Dhaka", charge: outsideCharge, eta: "3–5 days" },
                                ].map((opt) => {
                                    const checked = form.shipping_area === opt.value;
                                    return (
                                        <label
                                            key={opt.value}
                                            htmlFor={`shipping_area_${opt.value}`}
                                            className={cn(
                                                "flex items-center gap-3 border p-4 min-h-[56px] transition-colors",
                                                checked ? "border-heritage-gold bg-heritage-gold/5" : "border-emerald-royal/20 hover:border-heritage-gold/50",
                                                errors.shipping_area && "border-red-400"
                                            )}
                                        >
                                            <input
                                                id={`shipping_area_${opt.value}`}
                                                type="radio"
                                                name="shipping_area"
                                                value={opt.value}
                                                checked={checked}
                                                onChange={setField("shipping_area")}
                                                required
                                                className="w-5 h-5 accent-emerald-royal"
                                            />
                                            <span className="flex-1">
                                                <span className="block text-sm font-bold text-emerald-royal">{opt.label}</span>
                                                <span className="block text-xs text-emerald-royal/50">{opt.eta}</span>
                                            </span>
                                            <span className="text-sm font-bold text-heritage-gold">
                                                {freeDelivery ? <span className="text-emerald-royal">Free</span> : opt.charge ? formatPrice(opt.charge) : ""}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {errors.shipping_area && (
                                <p id="shipping_area-error" className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5" role="alert">
                                    <AlertCircle size={13} className="shrink-0" aria-hidden="true" />
                                    {errors.shipping_area}
                                </p>
                            )}
                        </fieldset>

                        <Field id="note" label="Order note" error={errors.note} className="sm:col-span-2">
                            <textarea
                                id="note"
                                name="note"
                                rows={2}
                                maxLength={1000}
                                value={form.note}
                                onChange={setField("note")}
                                className={cn(inputClass(errors.note), "resize-y")}
                                placeholder="Anything we should know? e.g. preferred delivery time"
                            />
                        </Field>
                    </div>
                </section>

                {/* Payment */}
                <section className="bg-white p-6 md:p-8 shadow-md border border-heritage-gold/10" aria-labelledby="payment-heading">
                    <SectionTitle step={2}><span id="payment-heading">Payment</span></SectionTitle>
                    <fieldset>
                        <legend className="sr-only">Payment method</legend>
                        <label htmlFor="payment_cod" className="flex items-center gap-4 border border-heritage-gold bg-heritage-gold/5 p-4 min-h-[56px]">
                            <input id="payment_cod" type="radio" name="payment_method" value="cod" checked readOnly className="w-5 h-5 accent-emerald-royal" />
                            <Banknote size={24} className="text-heritage-gold shrink-0" aria-hidden="true" />
                            <span>
                                <span className="block text-sm font-bold text-emerald-royal">Cash on Delivery</span>
                                <span className="block text-xs text-emerald-royal/60">Pay when you receive your order.</span>
                            </span>
                        </label>
                    </fieldset>
                    <p className="mt-3 text-xs text-emerald-royal/50">Online payment options are coming soon.</p>
                </section>
            </div>

            {/* Order summary */}
            <aside className="lg:col-span-2 lg:sticky lg:top-32" aria-labelledby="summary-heading">
                <div className="bg-white p-6 md:p-8 shadow-xl border-t-4 border-heritage-gold">
                    <h2 id="summary-heading" className="text-xl font-serif text-emerald-royal mb-6 border-b border-emerald-royal/10 pb-4 flex items-center justify-between">
                        Order Summary
                        {loading && <Loader2 size={16} className="animate-spin text-heritage-gold" aria-label="Updating totals" />}
                    </h2>

                    <ul className="space-y-4 mb-6 max-h-[360px] overflow-y-auto pr-1">
                        {cartItems.map((item) => {
                            const line = quoteLine(item);
                            const lineTotal = line ? Number(line.line_total) : (item.price || 0) * item.quantity;
                            const error = lineErrors[item.key];
                            return (
                                <li key={item.key} className="flex gap-4">
                                    <div className="relative w-16 h-20 shrink-0 bg-muslin-cream">
                                        <Image src={getOptimizedImage(item.image)} alt={item.name} fill sizes="64px" className="object-cover" />
                                        <span className="absolute -top-2 -right-2 bg-emerald-royal text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-serif text-emerald-royal leading-snug">{item.name}</p>
                                        <p className="text-[11px] text-emerald-royal/60 space-x-2">
                                            {item.size && <span>Size {item.size}</span>}
                                            {item.color && <span>{item.color}</span>}
                                            <span>Qty {item.quantity}</span>
                                        </p>
                                        {error && <p className="text-[11px] text-red-600 mt-1" role="alert">{error}</p>}
                                    </div>
                                    <p className="text-sm font-bold text-emerald-royal whitespace-nowrap">{formatPrice(lineTotal)}</p>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Coupon */}
                    <div className="mb-6 pb-6 border-b border-emerald-royal/10">
                        <label htmlFor="coupon_code" className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                            Coupon code
                        </label>
                        {appliedCoupon && !couponFailed ? (
                            <div className="flex items-center justify-between gap-3 bg-emerald-royal/5 border border-emerald-royal/20 px-4 py-3">
                                <span className="flex items-center gap-2 text-sm text-emerald-royal">
                                    <Tag size={14} className="text-heritage-gold" aria-hidden="true" />
                                    <strong>{appliedCoupon}</strong>
                                    {couponOk && discount > 0 && <span className="text-xs">− {formatPrice(discount)}</span>}
                                    {loading && <Loader2 size={12} className="animate-spin" aria-label="Checking coupon" />}
                                </span>
                                <button type="button" onClick={removeCoupon} className="text-xs uppercase tracking-widest font-bold text-deep-maroon hover:underline p-1 flex items-center gap-1">
                                    <X size={12} aria-hidden="true" /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    id="coupon_code"
                                    type="text"
                                    autoCapitalize="characters"
                                    autoComplete="off"
                                    maxLength={50}
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            applyCoupon();
                                        }
                                    }}
                                    aria-invalid={couponFailed}
                                    aria-describedby={couponFailed ? "coupon_code-error" : undefined}
                                    className={cn(inputClass(couponFailed), "uppercase py-3")}
                                    placeholder="Enter code"
                                />
                                <button
                                    type="button"
                                    onClick={applyCoupon}
                                    disabled={!couponInput.trim() || (loading && Boolean(appliedCoupon))}
                                    className="px-5 bg-emerald-royal text-white text-xs uppercase tracking-widest font-bold hover:bg-heritage-gold transition-colors disabled:opacity-40"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                        {couponFailed && (
                            <p id="coupon_code-error" className="mt-2 text-xs text-red-600 flex items-start gap-1.5" role="alert">
                                <AlertCircle size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
                                {quote.coupon_error}
                            </p>
                        )}
                        {couponOk && (
                            <p className="mt-2 text-xs text-emerald-royal flex items-center gap-1.5" role="status">
                                <CheckCircle2 size={13} aria-hidden="true" /> Coupon applied — you save {formatPrice(discount)}.
                            </p>
                        )}
                    </div>

                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between text-emerald-royal/80">
                            <dt>Subtotal</dt>
                            <dd>{formatPrice(subtotal)}</dd>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-emerald-royal">
                                <dt>Discount{quote?.coupon_code ? ` (${quote.coupon_code})` : ""}</dt>
                                <dd>− {formatPrice(discount)}</dd>
                            </div>
                        )}
                        <div className="flex justify-between text-emerald-royal/80">
                            <dt className="flex items-center gap-1.5"><Truck size={14} aria-hidden="true" /> Delivery</dt>
                            <dd>
                                {!form.shipping_area ? (
                                    <span className="text-xs italic text-emerald-royal/50">Select delivery area</span>
                                ) : shipping === null ? (
                                    "—"
                                ) : shipping === 0 ? (
                                    <span className="font-bold text-emerald-royal">Free</span>
                                ) : (
                                    formatPrice(shipping)
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-emerald-royal pt-4 border-t border-emerald-royal/10">
                            <dt>Total</dt>
                            <dd>{formatPrice(total)}</dd>
                        </div>
                        <p className="text-[11px] text-emerald-royal/60 text-right">Pay in cash when your order arrives</p>
                    </dl>

                    {quoteMessage && (
                        <p className="mt-4 text-xs text-red-600 flex items-start gap-2" role="alert">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                            {quoteMessage}
                        </p>
                    )}
                    {hasLineErrors && (
                        <p className="mt-4 text-xs text-red-600 flex items-start gap-2" role="alert">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                            <span>
                                Some items aren&apos;t available as requested.{" "}
                                <Link href="/cart" className="underline font-bold">Update your bag</Link>
                            </span>
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || hasLineErrors}
                        aria-busy={submitting}
                        className="mt-6 w-full py-4 min-h-[56px] bg-heritage-gold text-white uppercase tracking-widest text-xs font-bold hover:bg-emerald-royal transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-heritage-gold"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Placing your order…
                            </>
                        ) : (
                            <>
                                <Lock size={14} aria-hidden="true" /> Place Order · {formatPrice(total)}
                            </>
                        )}
                    </button>
                    <p className="text-[11px] text-center text-emerald-royal/50 mt-4">
                        By placing your order you agree to our{" "}
                        <Link href="/shipping-returns" className="underline hover:text-heritage-gold">delivery &amp; returns policy</Link>.
                    </p>
                </div>
            </aside>
        </form>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const { cartItems, hydrated, clearCart } = useStore();
    const [placedOrder, setPlacedOrder] = useState(null);

    const handlePlaced = (order) => {
        try {
            sessionStorage.setItem("noorbanu_last_order", JSON.stringify(order));
        } catch { /* storage unavailable */ }
        setPlacedOrder(order);
        clearCart();
        router.push(`/checkout/success?order=${encodeURIComponent(order.order_number)}`);
    };

    let content;
    if (placedOrder) {
        content = (
            <div className="text-center py-20 bg-white shadow-xl border border-heritage-gold/20" role="status">
                <CheckCircle2 size={48} className="mx-auto text-emerald-royal mb-4" aria-hidden="true" />
                <p className="text-lg font-serif text-emerald-royal">Order {placedOrder.order_number} placed!</p>
                <p className="text-sm text-emerald-royal/60 mt-2">Taking you to your confirmation…</p>
            </div>
        );
    } else if (!hydrated) {
        content = (
            <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-heritage-gold" size={32} aria-label="Loading checkout" />
            </div>
        );
    } else if (cartItems.length === 0) {
        content = (
            <div className="text-center py-20 bg-white shadow-xl border border-heritage-gold/20">
                <p className="text-lg text-emerald-royal/60 mb-8 font-serif">Your bag is empty — add something beautiful first.</p>
                <Link
                    href="/shop"
                    className="inline-block px-8 py-3 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg"
                >
                    Start Shopping
                </Link>
            </div>
        );
    } else {
        content = <CheckoutForm onPlaced={handlePlaced} />;
    }

    return (
        <main className="bg-muslin-cream min-h-screen">
            <Navbar />

            <div className="pt-nav pb-16 max-w-7xl mx-auto px-4 md:px-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-heritage-gold mb-2">Secure Checkout · Cash on Delivery</p>
                    <h1 className="text-3xl md:text-5xl font-serif text-emerald-royal">Checkout</h1>
                    {!placedOrder && hydrated && cartItems.length > 0 && (
                        <Link href="/cart" className="inline-flex items-center gap-1.5 mt-4 text-xs uppercase tracking-widest font-bold text-emerald-royal/60 hover:text-heritage-gold">
                            <ArrowLeft size={14} aria-hidden="true" /> Back to bag
                        </Link>
                    )}
                </motion.div>
                {content}
            </div>

            <Footer />
        </main>
    );
}
