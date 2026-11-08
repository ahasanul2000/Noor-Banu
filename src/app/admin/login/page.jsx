import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/server/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
    if (await currentAdmin()) redirect("/admin");
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top,#fdfbf7,#efe7d8)]">
            <div className="flex flex-col items-center mb-8">
                <img src="/img/logo.png" alt="" className="w-24 h-24 rounded-full shadow-[0_4px_20px_rgba(153,101,21,0.35)]" />
                <span className="mt-4 font-serif text-2xl font-semibold text-emerald-royal tracking-wide">Noor Banu</span>
                <span className="text-[11px] uppercase tracking-[0.35em] text-heritage-gold mt-1">Admin</span>
            </div>
            <LoginForm />
        </main>
    );
}
