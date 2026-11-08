// Formatting shared by admin screens. The shop runs in Bangladesh, so dates show Dhaka time.
export const TIME_ZONE = "Asia/Dhaka";

export const taka = (n) =>
    n === null || n === undefined || n === "" ? "—" : `৳ ${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const dateTime = (v) =>
    v
        ? new Date(v).toLocaleString("en-GB", {
              timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          })
        : "—";

export const dateOnly = (v) =>
    v ? new Date(v).toLocaleDateString("en-GB", { timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric" }) : "—";

/** Read "a.b.c" from an object. */
export const pick = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

export const STATUS_STYLES = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-sky-100 text-sky-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-cyan-100 text-cyan-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-rose-100 text-rose-800",
    returned: "bg-stone-200 text-stone-700",
};

export const PAYMENT_STYLES = {
    unpaid: "bg-stone-100 text-stone-700",
    paid: "bg-emerald-100 text-emerald-800",
    refunded: "bg-rose-100 text-rose-800",
};
