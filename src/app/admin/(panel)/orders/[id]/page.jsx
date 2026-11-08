import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Lock, MessageSquare, Printer } from "lucide-react";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { SHIPPING_AREAS } from "@/lib/orderStatus";
import { dateTime, taka } from "@/lib/admin/format";
import { getOptimizedImage } from "@/lib/utils";
import { PaymentBadge, StatusBadge } from "@/components/admin/Badges";
import { OrderActions } from "@/components/admin/OrderActions";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const order = /^\d+$/.test(id) ? await prisma.order.findUnique({ where: { id: Number(id) }, select: { order_number: true } }) : null;
    return { title: order?.order_number ?? "Order" };
}

export default async function OrderPage({ params }) {
    const { id } = await params;
    if (!/^\d+$/.test(id)) notFound();
    const record = await prisma.order.findUnique({
        where: { id: Number(id) },
        include: { order_items: { orderBy: { id: "asc" } }, user: { select: { id: true, name: true } } },
    });
    if (!record) notFound();
    const order = plain(record);
    const units = order.order_items.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Sans + tabular figures: Playfair's old-style digits make "NB000002" read like letters. */}
                    <h1 className="text-3xl font-bold tracking-wide tabular-nums text-emerald-royal">{order.order_number}</h1>
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-stone-500">Placed {dateTime(order.created_at)}</span>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/orders" className="admin-btn"><ChevronLeft size={16} /> All orders</Link>
                    <a href={`/admin/invoice/${order.id}`} target="_blank" rel="noreferrer" className="admin-btn"><Printer size={16} /> Invoice</a>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 items-start">
                <div className="lg:col-span-2 space-y-5">
                    <section className="admin-card overflow-hidden">
                        <h2 className="font-bold text-stone-800 p-5 pb-3">Items ({units})</h2>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr><th>Product</th><th>Size</th><th>Colour</th><th className="!text-right">Price</th><th className="!text-right">Qty</th><th className="!text-right">Total</th></tr>
                                </thead>
                                <tbody>
                                    {order.order_items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="flex items-center gap-3">
                                                    <img src={getOptimizedImage(item.product_image)} alt="" className="w-10 h-12 rounded-md object-cover bg-stone-100" />
                                                    {item.product_id ? (
                                                        <Link href={`/admin/products/${item.product_id}`} className="font-bold hover:underline">{item.product_name}</Link>
                                                    ) : (
                                                        <span className="font-bold">{item.product_name}</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td>{item.size ? <span className="admin-badge bg-stone-100 text-stone-700">{item.size}</span> : "—"}</td>
                                            <td>{item.color || "—"}</td>
                                            <td className="text-right tabular-nums">{taka(item.unit_price)}</td>
                                            <td className="text-right tabular-nums">{item.quantity}</td>
                                            <td className="text-right tabular-nums font-bold">{taka(item.line_total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <dl className="border-t border-stone-100 p-5 ml-auto max-w-xs text-sm space-y-1.5">
                            <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="tabular-nums">{taka(order.subtotal)}</dd></div>
                            {order.discount > 0 && (
                                <div className="flex justify-between">
                                    <dt className="text-stone-500">Discount {order.coupon_code && <span className="admin-badge bg-amber-50 text-amber-800 ml-1">{order.coupon_code}</span>}</dt>
                                    <dd className="tabular-nums text-rose-700">− {taka(order.discount)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between"><dt className="text-stone-500">Delivery ({SHIPPING_AREAS[order.shipping_area] ?? "—"})</dt><dd className="tabular-nums">{order.shipping_cost > 0 ? taka(order.shipping_cost) : "Free"}</dd></div>
                            <div className="flex justify-between border-t border-stone-200 pt-2 mt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{taka(order.total)}</dd></div>
                            <div className="flex justify-end items-center gap-2 text-xs text-stone-500">Cash on Delivery <PaymentBadge status={order.payment_status} /></div>
                        </dl>
                    </section>

                    {(order.note || order.admin_note) && (
                        <section className="admin-card p-5 space-y-4">
                            {order.note && (
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2 text-stone-700"><MessageSquare size={15} /> Customer note</h3>
                                    <p className="text-sm mt-1 whitespace-pre-line">{order.note}</p>
                                </div>
                            )}
                            {order.admin_note && (
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2 text-stone-700"><Lock size={15} /> Admin note</h3>
                                    <p className="text-sm mt-1 whitespace-pre-line">{order.admin_note}</p>
                                </div>
                            )}
                        </section>
                    )}

                    <section className="admin-card p-5">
                        <h2 className="font-bold text-stone-800 mb-3">Customer & delivery</h2>
                        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            <div><dt className="text-stone-500">Name</dt><dd className="font-bold">{order.customer_name}{order.user && <Link href={`/admin/customers/${order.user.id}`} className="ml-2 text-xs text-heritage-gold hover:underline">account</Link>}</dd></div>
                            <div><dt className="text-stone-500">Phone</dt><dd><a href={`tel:${order.customer_phone}`} className="font-bold hover:underline">{order.customer_phone}</a></dd></div>
                            <div><dt className="text-stone-500">Email</dt><dd>{order.customer_email || "—"}</dd></div>
                            <div><dt className="text-stone-500">Delivery area</dt><dd>{SHIPPING_AREAS[order.shipping_area] ?? "—"}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-stone-500">Address</dt><dd className="whitespace-pre-line">{order.shipping_address || "—"}{order.city ? `, ${order.city}` : ""}</dd></div>
                        </dl>
                    </section>
                </div>

                <OrderActions order={order} />
            </div>
        </div>
    );
}
