import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { SHIPPING_AREAS } from "@/lib/orderStatus";
import { dateTime, taka } from "@/lib/admin/format";
import { StatusBadge } from "@/components/admin/Badges";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }) {
    const { id } = await params;
    if (!/^\d+$/.test(id)) notFound();
    const record = await prisma.user.findFirst({
        where: { id: Number(id), is_admin: false },
        include: { orders: { orderBy: { id: "desc" }, take: 20 }, _count: { select: { orders: true } } },
    });
    if (!record) notFound();
    const { password, ...safe } = record; // never send the hash to the page
    const user = plain(safe);
    const spent = user.orders.filter((o) => !["cancelled", "returned"].includes(o.status)).reduce((s, o) => s + o.total, 0);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <h1 className="font-serif text-3xl text-emerald-royal">{user.name}</h1>
                <Link href="/admin/customers" className="admin-btn"><ChevronLeft size={16} /> All customers</Link>
            </div>
            <div className="grid lg:grid-cols-3 gap-5 items-start">
                <section className="admin-card p-5">
                    <dl className="space-y-3 text-sm">
                        <div><dt className="text-stone-500">Phone</dt><dd className="font-bold">{user.phone || "—"}</dd></div>
                        <div><dt className="text-stone-500">Email</dt><dd>{user.email || "—"}</dd></div>
                        <div><dt className="text-stone-500">Address</dt><dd className="whitespace-pre-line">{user.address || "—"}</dd></div>
                        <div><dt className="text-stone-500">City</dt><dd>{user.city || "—"}{user.shipping_area ? ` · ${SHIPPING_AREAS[user.shipping_area] ?? ""}` : ""}</dd></div>
                        <div><dt className="text-stone-500">Joined</dt><dd>{dateTime(user.created_at)}</dd></div>
                        <div><dt className="text-stone-500">Orders</dt><dd className="font-bold tabular-nums">{user._count.orders} · {taka(spent)} spent</dd></div>
                    </dl>
                </section>
                <section className="admin-card overflow-hidden lg:col-span-2">
                    <h2 className="font-bold text-stone-800 p-5 pb-3">Recent orders</h2>
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead>
                            <tbody>
                                {user.orders.map((o) => (
                                    <tr key={o.id}>
                                        <td><Link href={`/admin/orders/${o.id}`} className="font-bold text-emerald-royal hover:underline">{o.order_number}</Link></td>
                                        <td className="tabular-nums font-bold">{taka(o.total)}</td>
                                        <td><StatusBadge status={o.status} /></td>
                                        <td className="text-stone-500 whitespace-nowrap">{dateTime(o.created_at)}</td>
                                    </tr>
                                ))}
                                {user.orders.length === 0 && <tr><td colSpan={4} className="text-center text-stone-500 py-10">No orders yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
