"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    BookOpen, Camera, ExternalLink, FolderOpen, Gem, Image as ImageIcon, LayoutDashboard, LogOut, Mail, Menu,
    PenLine, Quote, Settings, Shirt, ShoppingBag, Ticket, Users, X,
} from "lucide-react";

const NAV = [
    { items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
    {
        title: "Shop",
        items: [
            { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "pending" },
            { href: "/admin/products", label: "Products", icon: Shirt },
            { href: "/admin/categories", label: "Categories", icon: FolderOpen },
            { href: "/admin/coupons", label: "Coupons", icon: Ticket },
            { href: "/admin/customers", label: "Customers", icon: Users },
        ],
    },
    {
        title: "Homepage",
        items: [
            { href: "/admin/hero-slides", label: "Hero slides", icon: ImageIcon },
            { href: "/admin/lookbook", label: "Lookbook", icon: BookOpen },
            { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
            { href: "/admin/features", label: "Features", icon: Gem },
            { href: "/admin/instagram-posts", label: "Instagram posts", icon: Camera },
        ],
    },
    {
        title: "Content & settings",
        items: [
            { href: "/admin/blogs", label: "Blog posts", icon: PenLine },
            { href: "/admin/site-settings", label: "Site settings", icon: Settings },
            { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
        ],
    },
];

function Brand() {
    return (
        <Link href="/admin" className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <img src="/img/logo.png" alt="" className="w-10 h-10 rounded-full" />
            <span className="flex flex-col leading-tight">
                <b className="font-serif text-lg font-semibold text-white">Noor Banu</b>
                <small className="text-[10px] tracking-[0.32em] uppercase text-[#e3bd6b]">Admin</small>
            </span>
        </Link>
    );
}

export function AdminShell({ admin, pendingOrders, children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Close the mobile menu after navigating.
    useEffect(() => setOpen(false), [pathname]);

    const isActive = (item) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

    async function logout() {
        await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
        router.replace("/admin/login");
        router.refresh();
    }

    const sidebar = (
        <nav className="flex flex-col h-full bg-[#06362a] text-white/80" aria-label="Admin">
            <Brand />
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV.map((group, i) => (
                    <div key={i}>
                        {group.title && (
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{group.title}</p>
                        )}
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = isActive(item);
                                const Icon = item.icon;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                active ? "bg-[#e3bd6b] text-[#2a1c05] font-bold" : "hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            <Icon size={17} className={active ? "text-[#2a1c05]" : "text-white/60"} />
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge === "pending" && pendingOrders > 0 && (
                                                <span className={`admin-badge ${active ? "bg-[#2a1c05] text-[#e3bd6b]" : "bg-amber-400 text-amber-950"}`}>
                                                    {pendingOrders}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-white/10 p-4">
                <p className="text-sm font-bold text-white truncate">{admin.name}</p>
                <p className="text-xs text-white/50 truncate mb-3">{admin.email}</p>
                <div className="flex gap-2">
                    <a href="/" target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1.5 text-xs">
                        <ExternalLink size={13} /> View shop
                    </a>
                    <button onClick={logout} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-1.5 text-xs">
                        <LogOut size={13} /> Log out
                    </button>
                </div>
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen lg:pl-64">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 admin-no-print">{sidebar}</aside>

            {/* Mobile top bar + drawer */}
            <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#06362a] text-white px-4 py-3 admin-no-print">
                <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1">
                    <Menu size={22} />
                </button>
                <span className="font-serif font-semibold">Noor Banu Admin</span>
                <img src="/img/logo.png" alt="" className="w-8 h-8 rounded-full" />
            </header>
            {open && (
                <div className="lg:hidden fixed inset-0 z-40 admin-no-print">
                    <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl">
                        <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-6 z-10 text-white/70">
                            <X size={20} />
                        </button>
                        {sidebar}
                    </aside>
                </div>
            )}

            <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8 max-w-[1400px]">{children}</main>
        </div>
    );
}
