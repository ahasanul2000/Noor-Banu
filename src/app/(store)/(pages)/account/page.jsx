"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, KeyRound, Loader2, LogOut, Package, User } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Field, PasswordInput } from "@/components/account/AuthForm";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn, formatPrice, getOptimizedImage } from "@/lib/utils";

const inputClass =
    "w-full bg-white border border-emerald-royal/20 px-4 py-3.5 text-base md:text-sm text-emerald-royal outline-none focus:border-heritage-gold focus:ring-1 focus:ring-heritage-gold/40 placeholder:text-emerald-royal/30";

const STATUS_STYLES = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-sky-100 text-sky-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-200 text-gray-700",
};

const TABS = [
    { id: "orders", label: "My Orders", icon: Package },
    { id: "profile", label: "Profile & Address", icon: User },
    { id: "password", label: "Password", icon: KeyRound },
];

const firstErrors = (errors = {}) =>
    Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));

function formatDate(iso) {
    try {
        return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function SavedNotice({ text }) {
    return (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border-l-4 border-emerald-500 p-3">
            <CheckCircle2 size={16} aria-hidden="true" /> {text}
        </p>
    );
}

function OrdersTab({ phone }) {
    const [page, setPage] = useState(1);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        api.getMyOrders(page).then((res) => active && setResult(res));
        return () => { active = false; };
    }, [page]);

    if (!result) {
        return <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-heritage-gold" aria-label="Loading orders" /></div>;
    }
    if (!result.ok) {
        return <p className="text-sm text-red-600">{result.message}</p>;
    }
    if (result.data.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="font-serif text-xl text-emerald-royal mb-2">No orders yet</p>
                <p className="text-sm text-emerald-royal/60 mb-8">Orders you place while signed in will appear here.</p>
                <Link href="/shop" className="inline-block px-8 py-3 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors">
                    Start Shopping
                </Link>
            </div>
        );
    }

    const lastPage = result.meta?.last_page || 1;
    return (
        <div className="space-y-5">
            {result.data.map((order) => (
                <article key={order.order_number} className="border border-heritage-gold/15 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="font-serif text-lg text-emerald-royal">{order.order_number}</p>
                            <p className="text-xs text-emerald-royal/50">Placed on {formatDate(order.created_at)}</p>
                        </div>
                        <span className={cn("text-[10px] uppercase tracking-widest font-bold px-3 py-1", STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700")}>
                            {order.status_label}
                        </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                        {order.items.map((item, i) => (
                            <div key={i} className="relative w-14 h-[74px] shrink-0 bg-muslin-cream" title={item.product_name}>
                                <Image src={getOptimizedImage(item.product_image)} alt={item.product_name} fill sizes="56px" className="object-cover" />
                                {item.quantity > 1 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-royal text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">{item.quantity}</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-emerald-royal/10">
                        <p className="text-sm text-emerald-royal/70">
                            {order.items.reduce((n, i) => n + i.quantity, 0)} item(s) · <span className="font-bold text-emerald-royal">{formatPrice(order.total)}</span>
                            <span className="text-emerald-royal/50"> · Cash on Delivery ({order.payment_status === "paid" ? "Paid" : "Unpaid"})</span>
                        </p>
                        <Link
                            href={`/track-order?order=${order.order_number}&phone=${encodeURIComponent(order.customer_phone || phone || "")}`}
                            className="text-xs uppercase tracking-widest font-bold text-emerald-royal underline underline-offset-4 hover:text-heritage-gold"
                        >
                            View details
                        </Link>
                    </div>
                </article>
            ))}

            {lastPage > 1 && (
                <nav className="flex items-center justify-center gap-4 pt-4" aria-label="Order pages">
                    <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
                        className="p-2 border border-emerald-royal/20 disabled:opacity-30" aria-label="Previous page">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm text-emerald-royal">Page {page} of {lastPage}</span>
                    <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= lastPage}
                        className="p-2 border border-emerald-royal/20 disabled:opacity-30" aria-label="Next page">
                        <ChevronRight size={18} />
                    </button>
                </nav>
            )}
        </div>
    );
}

function ProfileTab({ user }) {
    const { updateProfile } = useAuth();
    const [form, setForm] = useState({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
        city: user.city || "",
        shipping_area: user.shipping_area || "",
    });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    const setField = (name) => (e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        setStatus(null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const res = await updateProfile({ ...form, email: form.email.trim() || null, shipping_area: form.shipping_area || null });
        setSaving(false);
        setErrors(firstErrors(res.errors));
        setStatus(res.ok ? "saved" : res.message);
    };

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-5 max-w-xl">
            {status === "saved" && <SavedNotice text="Your details have been saved. We'll use them to fill in checkout." />}
            {status && status !== "saved" && !Object.keys(errors).length && <p className="text-sm text-red-600">{status}</p>}
            <div className="grid sm:grid-cols-2 gap-5">
                <Field id="name" label="Full name" required error={errors.name}>
                    <input id="name" value={form.name} onChange={setField("name")} autoComplete="name" className={inputClass} />
                </Field>
                <Field id="phone" label="Mobile number" required error={errors.phone}>
                    <input id="phone" type="tel" inputMode="tel" value={form.phone} onChange={setField("phone")} autoComplete="tel" className={inputClass} />
                </Field>
            </div>
            <Field id="email" label="Email (optional)" error={errors.email}>
                <input id="email" type="email" value={form.email} onChange={setField("email")} autoComplete="email" className={inputClass} />
            </Field>
            <Field id="address" label="Delivery address" error={errors.address} hint="House / road / area / landmark">
                <textarea id="address" rows={3} value={form.address} onChange={setField("address")} autoComplete="street-address" className={inputClass} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
                <Field id="city" label="City / district" error={errors.city}>
                    <input id="city" value={form.city} onChange={setField("city")} autoComplete="address-level2" className={inputClass} />
                </Field>
                <Field id="shipping_area" label="Delivery area" error={errors.shipping_area}>
                    <select id="shipping_area" value={form.shipping_area} onChange={setField("shipping_area")} className={inputClass}>
                        <option value="">Choose…</option>
                        <option value="inside_dhaka">Inside Dhaka</option>
                        <option value="outside_dhaka">Outside Dhaka</option>
                    </select>
                </Field>
            </div>
            <button type="submit" disabled={saving}
                className="px-8 py-3.5 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors disabled:opacity-60 flex items-center gap-2 min-h-[48px]">
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Save Details
            </button>
        </form>
    );
}

function PasswordTab() {
    const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    const setField = (name) => (e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        setStatus(null);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setErrors({ password_confirmation: "Passwords do not match." });
            return;
        }
        setSaving(true);
        const res = await api.changePassword(form);
        setSaving(false);
        setErrors(firstErrors(res.errors));
        setStatus(res.ok ? "saved" : res.message);
        if (res.ok) setForm({ current_password: "", password: "", password_confirmation: "" });
    };

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-5 max-w-md">
            {status === "saved" && <SavedNotice text="Password changed. Other devices have been signed out." />}
            {status && status !== "saved" && !Object.keys(errors).length && <p className="text-sm text-red-600">{status}</p>}
            <Field id="current_password" label="Current password" required error={errors.current_password}>
                <PasswordInput id="current_password" value={form.current_password} onChange={setField("current_password")} error={errors.current_password} autoComplete="current-password" />
            </Field>
            <Field id="new_password" label="New password" required error={errors.password} hint="At least 6 characters.">
                <PasswordInput id="new_password" value={form.password} onChange={setField("password")} error={errors.password} autoComplete="new-password" />
            </Field>
            <Field id="password_confirmation" label="Confirm new password" required error={errors.password_confirmation}>
                <PasswordInput id="password_confirmation" value={form.password_confirmation} onChange={setField("password_confirmation")} error={errors.password_confirmation} autoComplete="new-password" />
            </Field>
            <button type="submit" disabled={saving}
                className="px-8 py-3.5 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors disabled:opacity-60 flex items-center gap-2 min-h-[48px]">
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Change Password
            </button>
        </form>
    );
}

export default function AccountPage() {
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [tab, setTab] = useState("orders");
    // Set while signing out so the "not signed in" redirect below doesn't send us to /login.
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        if (!loading && !user && !signingOut) router.replace("/login?next=/account");
    }, [loading, user, signingOut, router]);

    const onLogout = async () => {
        setSigningOut(true);
        await logout();
        router.replace("/");
    };

    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <section className="pt-nav-lg pb-20 max-w-6xl mx-auto px-4 md:px-6">
                {!user ? (
                    <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-heritage-gold" aria-label="Loading" /></div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
                            <div>
                                <span className="text-heritage-gold text-[10px] uppercase tracking-[0.3em] font-bold">My Account</span>
                                <h1 className="font-serif text-3xl md:text-5xl text-emerald-royal mt-2">Hello, {user.name.split(" ")[0]}</h1>
                                <p className="text-sm text-emerald-royal/60 mt-2">{user.phone}{user.email ? ` · ${user.email}` : ""}</p>
                            </div>
                            <button type="button" onClick={onLogout}
                                className="flex items-center gap-2 px-5 py-3 border border-emerald-royal/30 text-emerald-royal text-xs uppercase tracking-widest font-bold hover:bg-emerald-royal hover:text-white transition-colors">
                                <LogOut size={14} aria-hidden="true" /> Sign out
                            </button>
                        </div>

                        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
                            <nav className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar" aria-label="Account sections">
                                {TABS.map(({ id, label, icon: Icon }) => (
                                    <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-bold whitespace-nowrap text-left transition-colors",
                                            tab === id ? "bg-emerald-royal text-white" : "bg-white text-emerald-royal hover:bg-heritage-gold/10"
                                        )}>
                                        <Icon size={16} aria-hidden="true" /> {label}
                                    </button>
                                ))}
                            </nav>
                            <div className="bg-white shadow-md border-t-4 border-heritage-gold p-5 sm:p-8 min-w-0">
                                {tab === "orders" && <OrdersTab phone={user.phone} />}
                                {tab === "profile" && <ProfileTab user={user} />}
                                {tab === "password" && <PasswordTab />}
                            </div>
                        </div>
                    </>
                )}
            </section>
            <Footer />
        </main>
    );
}
