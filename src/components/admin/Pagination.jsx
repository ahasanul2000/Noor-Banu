import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, lastPage, params = {}, base }) {
    if (lastPage <= 1) return null;
    const href = (p) => {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
        if (p > 1) qs.set("page", String(p));
        const s = qs.toString();
        return `${base}${s ? `?${s}` : ""}`;
    };
    return (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
            <span className="text-stone-500">Page {page} of {lastPage}</span>
            <span className="flex gap-2">
                {page > 1 ? (
                    <Link href={href(page - 1)} className="admin-btn"><ChevronLeft size={16} /> Previous</Link>
                ) : (
                    <span className="admin-btn opacity-50"><ChevronLeft size={16} /> Previous</span>
                )}
                {page < lastPage ? (
                    <Link href={href(page + 1)} className="admin-btn">Next <ChevronRight size={16} /></Link>
                ) : (
                    <span className="admin-btn opacity-50">Next <ChevronRight size={16} /></span>
                )}
            </span>
        </nav>
    );
}
