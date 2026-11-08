"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { adminFetch, firstError } from "./adminFetch";

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await adminFetch("/api/admin/login", { method: "POST", body: { email, password } });
        if (res.ok) {
            router.replace("/admin");
            router.refresh();
            return;
        }
        setBusy(false);
        setError(firstError(res));
    }

    return (
        <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
            <h1 className="text-lg font-semibold text-center text-stone-800 mb-6">Sign in</h1>
            {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 text-rose-700 text-sm px-3 py-2">{error}</p>}
            <label className="admin-label" htmlFor="email">Email</label>
            <input
                id="email" type="email" autoComplete="username" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="admin-input mb-4"
            />
            <label className="admin-label" htmlFor="password">Password</label>
            <div className="relative mb-6">
                <input
                    id="password" type={show ? "text" : "password"} autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="admin-input pr-10"
                />
                <button
                    type="button" onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-0 px-3 text-stone-400 hover:text-stone-600"
                    aria-label={show ? "Hide password" : "Show password"}
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            <button type="submit" disabled={busy} className="admin-btn-primary w-full justify-center">
                {busy && <Loader2 size={16} className="animate-spin" />} Sign in
            </button>
        </form>
    );
}
