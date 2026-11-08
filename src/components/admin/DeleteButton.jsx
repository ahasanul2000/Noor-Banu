"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { adminFetch, firstError } from "./adminFetch";

export function DeleteButton({ resource, id, label, warning, compact = false, redirectTo }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function remove() {
        if (!confirm(`Delete ${label}?${warning ? `\n\n${warning}` : ""}\n\nThis cannot be undone.`)) return;
        setBusy(true);
        const res = await adminFetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
        setBusy(false);
        if (!res.ok) {
            alert(firstError(res));
            return;
        }
        if (redirectTo) router.replace(redirectTo);
        router.refresh();
    }

    return (
        <button type="button" onClick={remove} disabled={busy} className={`admin-btn-danger ${compact ? "!px-2.5 !py-1.5" : ""}`} aria-label={`Delete ${label}`}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {!compact && "Delete"}
        </button>
    );
}
