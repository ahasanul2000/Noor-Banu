import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { getSettingsMap } from "@/lib/server/settings";
import { ORDER_STATUSES, SHIPPING_AREAS } from "@/lib/orderStatus";
import { dateTime, taka } from "@/lib/admin/format";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    const { id } = await params;
    return { title: `Invoice #${id}` };
}

/** A printable invoice / packing slip (outside the panel layout so it prints cleanly). */
export default async function InvoicePage({ params }) {
    await requireAdminPage();
    const { id } = await params;
    if (!/^\d+$/.test(id)) notFound();
    const record = await prisma.order.findUnique({ where: { id: Number(id) }, include: { order_items: { orderBy: { id: "asc" } } } });
    if (!record) notFound();
    const order = plain(record);
    const settings = await getSettingsMap();

    return (
        <div className="min-h-screen bg-white text-stone-800 print:p-0 p-6 sm:p-10">
            <div className="max-w-3xl mx-auto">
                <div className="admin-no-print mb-6 flex justify-end">
                    <PrintButton />
                </div>

                <header className="flex justify-between items-start gap-6 border-b-2 border-emerald-royal pb-4">
                    <div className="flex items-center gap-3">
                        <img src="/img/logo.png" alt="" className="w-14 h-14 rounded-full" />
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-emerald-royal">{settings.brand_name || "Noor Banu"}</h1>
                            {settings.contact_address && <p className="text-sm text-stone-500">{settings.contact_address}</p>}
                            {settings.contact_phone && <p className="text-sm text-stone-500">{settings.contact_phone}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold tracking-widest text-emerald-royal">INVOICE</p>
                        <p className="font-bold">{order.order_number}</p>
                        <p className="text-sm text-stone-500">{dateTime(order.created_at)}</p>
                        <p className="text-sm text-stone-500">Status: {ORDER_STATUSES[order.status] ?? order.status}</p>
                    </div>
                </header>

                <div className="grid grid-cols-2 gap-6 my-6 text-sm">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Deliver to</h3>
                        <p className="font-bold">{order.customer_name}</p>
                        <p>{order.customer_phone}</p>
                        <p className="whitespace-pre-line">{order.shipping_address}</p>
                        <p>{order.city} — {SHIPPING_AREAS[order.shipping_area] ?? order.shipping_area}</p>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Note</h3>
                        <p className="whitespace-pre-line">{order.note || "—"}</p>
                    </div>
                </div>

                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="text-left border-b border-stone-300">
                            <th className="py-2 pr-2">Item</th><th className="py-2 px-2">Size</th><th className="py-2 px-2">Colour</th>
                            <th className="py-2 px-2 text-right">Price</th><th className="py-2 px-2 text-right">Qty</th><th className="py-2 pl-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.order_items.map((item) => (
                            <tr key={item.id} className="border-b border-stone-200">
                                <td className="py-2 pr-2">{item.product_name}</td>
                                <td className="py-2 px-2">{item.size || "—"}</td>
                                <td className="py-2 px-2">{item.color || "—"}</td>
                                <td className="py-2 px-2 text-right tabular-nums">{taka(item.unit_price)}</td>
                                <td className="py-2 px-2 text-right tabular-nums">{item.quantity}</td>
                                <td className="py-2 pl-2 text-right tabular-nums">{taka(item.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="tabular-nums">
                        <tr><td colSpan={5} className="pt-3 text-right">Subtotal</td><td className="pt-3 text-right">{taka(order.subtotal)}</td></tr>
                        {order.discount > 0 && (
                            <tr><td colSpan={5} className="text-right">Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</td><td className="text-right">− {taka(order.discount)}</td></tr>
                        )}
                        <tr><td colSpan={5} className="text-right">Delivery charge</td><td className="text-right">{taka(order.shipping_cost)}</td></tr>
                        <tr className="text-lg font-bold"><td colSpan={5} className="pt-2 text-right">Total</td><td className="pt-2 text-right">{taka(order.total)}</td></tr>
                    </tfoot>
                </table>

                {order.payment_method === "cod" && order.payment_status !== "paid" && (
                    <p className="mt-6 rounded-lg border-2 border-dashed border-emerald-royal p-3 text-center font-bold text-emerald-royal">
                        Cash on Delivery — collect {taka(order.total)}
                    </p>
                )}
            </div>
        </div>
    );
}
