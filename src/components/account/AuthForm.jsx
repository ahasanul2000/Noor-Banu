"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const inputClass =
    "w-full bg-white border border-emerald-royal/20 px-4 py-3.5 text-base md:text-sm text-emerald-royal outline-none focus:border-heritage-gold focus:ring-1 focus:ring-heritage-gold/40 placeholder:text-emerald-royal/30";
const PHONE_RE = /^(\+?88)?01[3-9]\d{8}$/;

/** Only allow redirects back into this site (e.g. ?next=/checkout). */
function safeNext(value) {
    return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function Field({ id, label, error, hint, required, children }) {
    return (
        <div>
            <label htmlFor={id} className="block text-[11px] uppercase tracking-widest font-bold text-emerald-royal/70 mb-2">
                {label} {required && <span className="text-deep-maroon" aria-hidden="true">*</span>}
            </label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 flex items-start gap-1.5">
                    <AlertCircle size={13} className="mt-px shrink-0" aria-hidden="true" /> {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-[11px] text-emerald-royal/45">{hint}</p>
            ) : null}
        </div>
    );
}

export function PasswordInput({ id, value, onChange, error, autoComplete }) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                type={visible ? "text" : "password"}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(inputClass, "pr-12", error && "border-red-400")}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-0 top-0 h-full px-4 text-emerald-royal/50 hover:text-emerald-royal"
                aria-label={visible ? "Hide password" : "Show password"}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

/** Login or registration form. `mode` is "login" or "register". */
export function AuthForm({ mode }) {
    const isRegister = mode === "register";
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = safeNext(searchParams.get("next"));
    const { login, register, isLoggedIn, loading } = useAuth();

    const [form, setForm] = useState({ name: "", phone: "", email: "", login: "", password: "", password_confirmation: "" });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Already signed in (e.g. opened /login in a new tab): go straight on.
    useEffect(() => {
        if (!loading && isLoggedIn && !submitting) router.replace(next);
    }, [loading, isLoggedIn, submitting, next, router]);

    const setField = (name) => (e) => {
        setForm((f) => ({ ...f, [name]: e.target.value }));
        if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
    };

    const validate = () => {
        const errs = {};
        if (isRegister) {
            if (!form.name.trim()) errs.name = "Please enter your name.";
            if (!PHONE_RE.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "Please enter a valid Bangladeshi mobile number (e.g. 01712345678).";
            if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
            if (form.password !== form.password_confirmation) errs.password_confirmation = "Passwords do not match.";
        } else {
            if (!form.login.trim()) errs.login = "Enter your mobile number or email.";
            if (!form.password) errs.password = "Enter your password.";
        }
        return errs;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        const errs = validate();
        setErrors(errs);
        setMessage(null);
        if (Object.keys(errs).length) return;

        setSubmitting(true);
        const res = isRegister
            ? await register({
                name: form.name.trim(),
                phone: form.phone.replace(/[\s-]/g, ""),
                email: form.email.trim() || null,
                password: form.password,
                password_confirmation: form.password_confirmation,
            })
            : await login(form.login.trim(), form.password);

        if (res.ok) {
            router.replace(next);
            return;
        }
        setSubmitting(false);
        const fieldErrors = Object.fromEntries(Object.entries(res.errors || {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
        setErrors(fieldErrors);
        if (!Object.keys(fieldErrors).length) setMessage(res.message);
    };

    const switchHref = `${isRegister ? "/login" : "/register"}${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`;

    return (
        <section className="pt-nav-lg pb-20 px-4 md:px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto bg-white shadow-xl border-t-4 border-heritage-gold p-6 sm:p-10"
            >
                <span className="text-heritage-gold text-[10px] uppercase tracking-[0.3em] font-bold">
                    {isRegister ? "Join Noor Banu" : "Welcome back"}
                </span>
                <h1 className="font-serif text-3xl md:text-4xl text-emerald-royal mt-2 mb-2">
                    {isRegister ? "Create Account" : "Sign In"}
                </h1>
                <p className="text-sm text-emerald-royal/60 mb-8">
                    {isRegister
                        ? "Save your delivery details and see all your orders in one place."
                        : "Sign in to check out faster and track your orders."}
                </p>

                {message && (
                    <div role="alert" className="mb-6 flex items-start gap-2 bg-red-50 border-l-4 border-red-500 p-3 text-sm text-red-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {message}
                    </div>
                )}

                <form onSubmit={onSubmit} noValidate className="space-y-5">
                    {isRegister ? (
                        <>
                            <Field id="name" label="Full name" required error={errors.name}>
                                <input id="name" value={form.name} onChange={setField("name")} autoComplete="name" required
                                    className={cn(inputClass, errors.name && "border-red-400")} aria-invalid={Boolean(errors.name)} />
                            </Field>
                            <Field id="phone" label="Mobile number" required error={errors.phone} hint="You'll sign in with this number.">
                                <input id="phone" type="tel" inputMode="tel" value={form.phone} onChange={setField("phone")} autoComplete="tel"
                                    placeholder="01712345678" required className={cn(inputClass, errors.phone && "border-red-400")} aria-invalid={Boolean(errors.phone)} />
                            </Field>
                            <Field id="email" label="Email (optional)" error={errors.email}>
                                <input id="email" type="email" value={form.email} onChange={setField("email")} autoComplete="email"
                                    placeholder="you@example.com" className={cn(inputClass, errors.email && "border-red-400")} aria-invalid={Boolean(errors.email)} />
                            </Field>
                        </>
                    ) : (
                        <Field id="login" label="Mobile number or email" required error={errors.login}>
                            <input id="login" value={form.login} onChange={setField("login")} autoComplete="username"
                                placeholder="01712345678" required className={cn(inputClass, errors.login && "border-red-400")} aria-invalid={Boolean(errors.login)} />
                        </Field>
                    )}

                    <Field id="password" label="Password" required error={errors.password} hint={isRegister ? "At least 6 characters." : undefined}>
                        <PasswordInput id="password" value={form.password} onChange={setField("password")} error={errors.password}
                            autoComplete={isRegister ? "new-password" : "current-password"} />
                    </Field>

                    {isRegister && (
                        <Field id="password_confirmation" label="Confirm password" required error={errors.password_confirmation}>
                            <PasswordInput id="password_confirmation" value={form.password_confirmation} onChange={setField("password_confirmation")}
                                error={errors.password_confirmation} autoComplete="new-password" />
                        </Field>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 min-h-[52px]"
                    >
                        {submitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                        {isRegister ? "Create Account" : "Sign In"}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-emerald-royal/60">
                    {isRegister ? "Already have an account?" : "New to Noor Banu?"}{" "}
                    <Link href={switchHref} className="font-bold text-emerald-royal underline underline-offset-4 hover:text-heritage-gold">
                        {isRegister ? "Sign in" : "Create an account"}
                    </Link>
                </p>
                {!isRegister && (
                    <p className="mt-3 text-center text-xs text-emerald-royal/45">
                        Forgot your password? Message us on WhatsApp and we&apos;ll help you reset it.
                    </p>
                )}
            </motion.div>
        </section>
    );
}
