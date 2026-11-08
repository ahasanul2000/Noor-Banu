import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { ORDER_STATUSES } from "@/lib/orderStatus";
import { dateTime, taka } from "@/lib/admin/format";
import { PaymentBadge, StatusBadge } from "@/components/admin/Badges";
import { Pagination } from "@/components/admin/Pagination";

export const metadata = { title: "Orders" };

const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }) {
    const sp = await searchParams;
    const status = Object.hasOwn(ORDER_STATUSES, sp.status ?? "") ? sp.status : "";
    const q = String(sp.q ?? "").trim();
    const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

    const where = {
        ...(status ? { status } : {}),
        ...(q
            ? {
                  OR: ["order_number", "customer_name", "customer_phone", "customer_email", "city"].map((f) => ({
                      [f]: { contains: q, mode: "insensitive" },
                  })),
              }
            : {}),
    };

    const [total, orders, counts] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy: { id: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
        prisma.order.groupBy({ by: ["status"], _count: true }),
    ]);
    const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count]));
    const all = counts.reduce((s, c) => s + c._count, 0);
    const rows = plain(orders);

    const tabHref = (s) => {
        const p = new URLSearchParams();
        if (s) p.set("status", s);
        if (q) p.set("q", q);
        const qs = p.toString();
        return `/admin/orders${qs ? `?${qs}` : ""}`;
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="font-serif text-3xl text-emerald-royal">Orders</h1>
                    <p className="text-stone-500 text-sm mt-1">{total} {status ? ORDER_STATUSES[status].toLowerCase() : ""} orders{q ? ` matching “${q}”` : ""}</p>
                </div>
                <form className="relative w-full sm:w-80" action="/admin/orders">
                    {status && <input type="hidden" name="status" value={status} />}
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input name="q" defaultValue={q} placeholder="Order #, name, phone…" className="admin-input pl-9" aria-label="Search orders" />
                </form>
            </div>

            <nav className="flex gap-1.5 overflow-x-auto pb-1" aria-label="Filter by status">
                {[["", "All", all], ...Object.entries(ORDER_STATUSES).map(([k, l]) => [k, l, countBy[k] ?? 0])].map(([key, label, n]) => (
                    <Link
                        key={key || "all"}
                        href={tabHref(key)}
                        aria-current={status === key ? "page" : undefined}
                        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
                            status === key ? "bg-emerald-royal text-white border-emerald-royal" : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
                        }`}
                    >
                        {label} <span className={`ml-1 tabular-nums ${status === key ? "text-white/70" : "text-stone-400"}`}>{n}</span>
                    </Link>
                ))}
            </nav>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr><th>Order #</th><th>Customer</th><th>City</th><th>Total</th><th>Status</th><th>Payment</th><th>Placed at</th></tr>
                        </thead>
                        <tbody>
                            {rows.map((o) => (
                                <tr key={o.id}>
                                    <td><Link href={`/admin/orders/${o.id}`} className="font-bold text-emerald-royal hover:underline">{o.order_number}</Link></td>
                                    <td>{o.customer_name}<span className="block text-xs text-stone-500">{o.customer_phone}</span></td>
                                    <td>{o.city || "—"}</td>
                                    <td className="font-bold tabular-nums">{taka(o.total)}</td>
                                    <td><StatusBadge status={o.status} /></td>
                                    <td><PaymentBadge status={o.payment_status} /></td>
                                    <td className="text-stone-500 whitespace-nowrap">{dateTime(o.created_at)}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={7} className="text-center text-stone-500 py-12">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination page={page} lastPage={Math.max(1, Math.ceil(total / PER_PAGE))} params={{ status, q }} base="/admin/orders" />
        </div>
    );
}
