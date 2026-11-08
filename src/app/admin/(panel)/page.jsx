import Link from "next/link";
import { AlertTriangle, Bell, ExternalLink, LineChart, Plus, ShoppingBag, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/server/auth";
import { dashboardData } from "@/lib/server/dashboard";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { dateTime, STATUS_STYLES, taka, TIME_ZONE } from "@/lib/admin/format";
import { getOptimizedImage } from "@/lib/utils";
import { SalesChart } from "@/components/admin/SalesChart";
import { StatusBadge } from "@/components/admin/Badges";

export const metadata = { title: "Dashboard" };

function Stat({ href, label, value, sub, icon: Icon, tone }) {
    return (
        <Link href={href} className="admin-card p-5 flex items-start gap-4 hover:border-stone-300 transition-colors">
            <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon size={20} />
            </span>
            <span className="min-w-0">
                <span className="block text-xs font-bold uppercase tracking-wider text-stone-500">{label}</span>
                <span className="block text-2xl font-bold text-stone-900 tabular-nums mt-0.5">{value}</span>
                <span className="block text-xs text-stone-500 mt-0.5">{sub}</span>
            </span>
        </Link>
    );
}

export default async function DashboardPage() {
    const admin = await requireAdminPage();
    const { stats, days, statusCounts, topProducts, lowStock, recent } = await dashboardData();

    const now = new Date();
    const hour = Number(now.toLocaleString("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hour12: false }));
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const monthName = now.toLocaleString("en-GB", { timeZone: TIME_ZONE, month: "long" });
    const periodTotal = days.reduce((s, d) => s + d.total, 0);
    const statusTotal = Math.max(1, Object.values(statusCounts).reduce((a, b) => a + b, 0));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl text-emerald-royal">{greeting}, {admin.name.split(" ")[0]}</h1>
                    <p className="text-stone-500 mt-1">
                        {now.toLocaleDateString("en-GB", { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Here&apos;s how Noor Banu is doing.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/products/new" className="admin-btn-primary"><Plus size={16} /> Add product</Link>
                    <Link href="/admin/orders?status=pending" className="admin-btn"><Bell size={16} /> Pending orders</Link>
                    <a href="/" target="_blank" rel="noreferrer" className="admin-btn"><ExternalLink size={16} /> View shop</a>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Stat href="/admin/orders" label="Today's sales" value={taka(stats.todaySales.total)} sub={`${stats.todaySales.count} orders today`} icon={ShoppingBag} tone="bg-emerald-50 text-emerald-800" />
                <Stat href="/admin/orders?status=pending" label="Needs action" value={stats.pending} sub="pending orders to confirm" icon={Bell} tone="bg-amber-50 text-amber-800" />
                <Stat href="/admin/orders" label="This month" value={taka(stats.monthSales.total)} sub={`${stats.monthSales.count} orders · ${monthName}`} icon={LineChart} tone="bg-sky-50 text-sky-800" />
                <Stat href="/admin/customers" label="Customers" value={stats.customers} sub={`${stats.newCustomers} joined in 30 days`} icon={Users} tone="bg-rose-50 text-rose-800" />
            </div>

            <div className="grid xl:grid-cols-3 gap-4">
                <section className="admin-card p-5 xl:col-span-2">
                    <div className="flex items-baseline justify-between mb-5">
                        <h2 className="font-bold text-stone-800">Daily sales · last 14 days</h2>
                        <span className="text-sm text-stone-500 tabular-nums">{taka(periodTotal)} total</span>
                    </div>
                    <SalesChart days={days} />
                </section>

                <section className="admin-card p-5">
                    <h2 className="font-bold text-stone-800 mb-4">Orders by status</h2>
                    <ul className="space-y-3">
                        {Object.entries(ORDER_STATUSES).map(([key, label]) => {
                            const count = statusCounts[key] ?? 0;
                            return (
                                <li key={key}>
                                    <Link href={`/admin/orders?status=${key}`} className="block group">
                                        <span className="flex justify-between text-sm mb-1">
                                            <span className={`admin-badge ${STATUS_STYLES[key]}`}>{label}</span>
                                            <span className="tabular-nums text-stone-600 group-hover:text-stone-900">{count}</span>
                                        </span>
                                        <span className="block h-1.5 rounded-full bg-stone-100 overflow-hidden">
                                            <span className="block h-full rounded-full bg-[#064E3B]" style={{ width: `${(count / statusTotal) * 100}%` }} />
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <section className="admin-card p-5">
                    <h2 className="font-bold text-stone-800 mb-4">Top products</h2>
                    {topProducts.length === 0 ? (
                        <p className="text-sm text-stone-500">No sales yet.</p>
                    ) : (
                        <ol className="space-y-3">
                            {topProducts.map((p, i) => (
                                <li key={`${p.product_id}-${i}`} className="flex items-center gap-3">
                                    <span className="w-5 text-sm font-bold text-stone-400 tabular-nums">{i + 1}</span>
                                    <img src={getOptimizedImage(p.product_image)} alt="" className="w-10 h-12 rounded-md object-cover bg-stone-100" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-sm font-bold text-stone-800 truncate">{p.product_name}</span>
                                        <span className="block text-xs text-stone-500">{p.qty} sold</span>
                                    </span>
                                    <span className="text-sm font-bold tabular-nums">{taka(p.revenue)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="admin-card p-5">
                    <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" /> Low stock
                    </h2>
                    {lowStock.length === 0 ? (
                        <p className="text-sm text-stone-500">Everything is well stocked.</p>
                    ) : (
                        <ul className="space-y-3">
                            {lowStock.map((p) => (
                                <li key={p.id} className="flex items-center gap-3">
                                    <img src={getOptimizedImage(p.image)} alt="" className="w-10 h-12 rounded-md object-cover bg-stone-100" />
                                    <span className="flex-1 min-w-0">
                                        <Link href={`/admin/products/${p.id}`} className="block text-sm font-bold text-stone-800 truncate hover:underline">{p.name}</Link>
                                        {(p.variants || []).length > 0 && (
                                            <span className="block text-xs text-stone-500">{p.variants.map((v) => `${v.size}: ${v.stock}`).join(" · ")}</span>
                                        )}
                                    </span>
                                    <span className={`admin-badge ${p.total_stock === 0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                                        {p.total_stock === 0 ? "Out of stock" : `${p.total_stock} left`}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <section className="admin-card overflow-hidden">
                <div className="flex items-center justify-between p-5 pb-3">
                    <h2 className="font-bold text-stone-800">Recent orders</h2>
                    <Link href="/admin/orders" className="text-sm font-bold text-heritage-gold hover:underline">View all</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Placed</th></tr>
                        </thead>
                        <tbody>
                            {recent.map((o) => (
                                <tr key={o.id}>
                                    <td><Link href={`/admin/orders/${o.id}`} className="font-bold text-emerald-royal hover:underline">{o.order_number}</Link></td>
                                    <td>{o.customer_name}<span className="block text-xs text-stone-500">{o.customer_phone}</span></td>
                                    <td className="tabular-nums">{o._count.order_items}</td>
                                    <td className="tabular-nums font-bold">{taka(o.total)}</td>
                                    <td><StatusBadge status={o.status} /></td>
                                    <td className="text-stone-500 whitespace-nowrap">{dateTime(o.created_at)}</td>
                                </tr>
                            ))}
                            {recent.length === 0 && (
                                <tr><td colSpan={6} className="text-center text-stone-500 py-8">No orders yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
