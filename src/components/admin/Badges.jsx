import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/orderStatus";
import { PAYMENT_STYLES, STATUS_STYLES } from "@/lib/admin/format";

// Status is always shown as a labelled badge, never colour alone.
export function StatusBadge({ status }) {
    return <span className={`admin-badge ${STATUS_STYLES[status] ?? "bg-stone-100 text-stone-700"}`}>{ORDER_STATUSES[status] ?? status}</span>;
}

export function PaymentBadge({ status }) {
    return <span className={`admin-badge ${PAYMENT_STYLES[status] ?? "bg-stone-100 text-stone-700"}`}>{PAYMENT_STATUSES[status] ?? status}</span>;
}
