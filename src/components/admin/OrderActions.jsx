"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { ORDER_STATUSES, PAYMENT_STATUSES, RESTOCKED_STATUSES } from "@/lib/orderStatus";
import { adminFetch, firstError } from "./adminFetch";

// The usual next step(s) from each status, shown as one-click buttons.
const NEXT_STEPS = {
    pending: { confirmed: "Confirm order", cancelled: "Cancel" },
    confirmed: { processing: "Start packing", cancelled: "Cancel" },
    processing: { shipped: "Mark shipped", cancelled: "Cancel" },
    shipped: { delivered: "Mark delivered", returned: "Returned" },
    delivered: { returned: "Mark returned" },
    cancelled: { pending: "Reopen order" },
    returned: {},
};

export function OrderActions({ order }) {
    const router = useRouter();
    const [busy, setBusy] = useState("");
    const [notice, setNotice] = useState(null);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState({
        status: order.status,
        payment_status: order.payment_status,
        customer_name: order.customer_name ?? "",
        customer_phone: order.customer_phone ?? "",
        shipping_address: order.shipping_address ?? "",
        city: order.city ?? "",
        admin_note: order.admin_note ?? "",
    });

    async function update(body, key) {
        setBusy(key);
        setNotice(null);
        setErrors({});
        const res = await adminFetch(`/api/admin/orders/${order.id}`, { method: "PATCH", body });
        setBusy("");
        if (res.ok) {
            setNotice({ ok: true, text: res.message });
            setForm((f) => ({ ...f, ...body }));
            router.refresh();
        } else {
            setErrors(res.errors || {});
            setNotice({ ok: false, text: firstError(res) });
        }
    }

    function quick(status, label) {
        if (RESTOCKED_STATUSES.includes(status) && !confirm(`${label} ${order.order_number}? The items will go back into stock.`)) return;
        update({ status }, status);
    }

    function save(e) {
        e.preventDefault();
        if (
            form.status !== order.status &&
            RESTOCKED_STATUSES.includes(form.status) &&
            !confirm(`Set ${order.order_number} to ${ORDER_STATUSES[form.status]}? The items will go back into stock.`)
        ) return;
        update(form, "save");
    }

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const err = (k) => errors[k]?.[0];
    const steps = Object.entries(NEXT_STEPS[order.status] ?? {});

    const digits = String(order.customer_phone ?? "").replace(/\D/g, "");
    const wa = digits.startsWith("880") ? digits : `88${digits}`;
    const waText = `Assalamu Alaikum ${order.customer_name}, your Noor Banu order ${order.order_number} is ${ORDER_STATUSES[order.status]?.toLowerCase()}.`;

    return (
        <aside className="space-y-5">
            {notice && (
                <p role="status" className={`rounded-lg px-4 py-3 text-sm font-bold ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
                    {notice.text}
                </p>
            )}

            <section className="admin-card p-5">
                <h2 className="font-bold text-stone-800 mb-3">Update order</h2>
                {steps.length > 0 && (
                    <div className="grid gap-2 mb-4">
                        {steps.map(([status, label]) => (
                            <button
                                key={status}
                                type="button"
                                disabled={!!busy}
                                onClick={() => quick(status, label)}
                                className={`${RESTOCKED_STATUSES.includes(status) ? "admin-btn-danger" : "admin-btn-primary"} justify-center`}
                            >
                                {busy === status && <Loader2 size={15} className="animate-spin" />} {label}
                            </button>
                        ))}
                    </div>
                )}
                {order.payment_status === "unpaid" && (
                    <button type="button" disabled={!!busy} onClick={() => update({ payment_status: "paid" }, "paid")} className="admin-btn w-full justify-center">
                        {busy === "paid" && <Loader2 size={15} className="animate-spin" />} Mark payment received
                    </button>
                )}
                <a
                    href={`https://wa.me/${wa}?text=${encodeURIComponent(waText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-btn w-full justify-center mt-2 !text-emerald-700"
                >
                    <MessageCircle size={15} /> WhatsApp customer
                </a>
            </section>

            <form onSubmit={save} className="admin-card p-5 space-y-4" noValidate>
                <h2 className="font-bold text-stone-800">Edit details</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="admin-label" htmlFor="o-status">Status</label>
                        <select id="o-status" className="admin-input" value={form.status} onChange={set("status")}>
                            {Object.entries(ORDER_STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="admin-label" htmlFor="o-pay">Payment</label>
                        <select id="o-pay" className="admin-input" value={form.payment_status} onChange={set("payment_status")}>
                            {Object.entries(PAYMENT_STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <p className="admin-hint !mt-1">Cancelled or Returned puts the items back in stock. Mark as Paid once the courier hands over the cash.</p>
                {[
                    ["customer_name", "Customer name"],
                    ["customer_phone", "Phone"],
                    ["city", "City"],
                ].map(([k, label]) => (
                    <div key={k}>
                        <label className="admin-label" htmlFor={`o-${k}`}>{label}</label>
                        <input id={`o-${k}`} className="admin-input" value={form[k]} onChange={set(k)} aria-invalid={!!err(k)} />
                        {err(k) && <p className="admin-error">{err(k)}</p>}
                    </div>
                ))}
                <div>
                    <label className="admin-label" htmlFor="o-address">Address</label>
                    <textarea id="o-address" rows={3} className="admin-input" value={form.shipping_address} onChange={set("shipping_address")} />
                </div>
                <div>
                    <label className="admin-label" htmlFor="o-note">Admin note</label>
                    <textarea id="o-note" rows={3} className="admin-input" value={form.admin_note} onChange={set("admin_note")} />
                    <p className="admin-hint">Internal only — e.g. courier tracking number.</p>
                </div>
                <button type="submit" disabled={!!busy} className="admin-btn-primary w-full justify-center">
                    {busy === "save" && <Loader2 size={15} className="animate-spin" />} Save changes
                </button>
            </form>
        </aside>
    );
}
