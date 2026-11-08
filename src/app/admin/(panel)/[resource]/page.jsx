import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Minus, Pencil, Plus, Search } from "lucide-react";
import { getResource } from "@/lib/admin/resources";
import { listResource } from "@/lib/server/adminResources";
import { totalStock } from "@/lib/server/products";
import { dateTime, pick, taka } from "@/lib/admin/format";
import { getOptimizedImage } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";
import { DeleteButton } from "@/components/admin/DeleteButton";

export async function generateMetadata({ params }) {
    const { resource } = await params;
    return { title: getResource(resource)?.label ?? "Not found" };
}

function Cell({ column, row }) {
    const value = pick(row, column.key);
    switch (column.type) {
        case "image":
            return value ? <img src={getOptimizedImage(value)} alt="" className="w-10 h-12 rounded-md object-cover bg-stone-100" /> : <span className="block w-10 h-12 rounded-md bg-stone-100" />;
        case "money":
            return <span className="tabular-nums">{value === null || value === undefined ? "—" : taka(value)}</span>;
        case "bool":
            return value
                ? <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold"><Check size={14} /> Yes</span>
                : <span className="inline-flex items-center gap-1 text-stone-400 text-xs font-bold"><Minus size={14} /> No</span>;
        case "date":
            return <span className="text-stone-500 whitespace-nowrap">{dateTime(value)}</span>;
        case "count":
            return <span className="tabular-nums">{value ?? 0}</span>;
        case "stars":
            return <span className="text-heritage-gold" aria-label={`${value} out of 5`}>{"★".repeat(value || 0)}<span className="text-stone-200">{"★".repeat(5 - (value || 0))}</span></span>;
        case "discount":
            return <span className="font-bold">{row.type === "fixed" ? taka(row.value) : `${Number(row.value)}%`}</span>;
        case "usage":
            return <span className="tabular-nums">{row.used_count}{row.usage_limit ? ` / ${row.usage_limit}` : ""}</span>;
        case "stock": {
            const stock = totalStock(row);
            const tone = stock === 0 ? "bg-rose-100 text-rose-800" : stock <= 5 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800";
            return (
                <span className="whitespace-nowrap">
                    <span className={`admin-badge ${tone}`}>{stock}</span>
                    {(row.variants || []).length > 0 && (
                        <span className="ml-1.5 text-xs text-stone-500">{row.variants.map((v) => `${v.size}:${v.stock}`).join(" ")}</span>
                    )}
                </span>
            );
        }
        default: {
            if (value === null || value === undefined || value === "") return <span className="text-stone-400">—</span>;
            const text = String(value);
            return <span>{column.truncate && text.length > column.truncate ? `${text.slice(0, column.truncate)}…` : text}</span>;
        }
    }
}

export default async function ResourceListPage({ params, searchParams }) {
    const { resource: key } = await params;
    const resource = getResource(key);
    if (!resource) notFound();
    const sp = await searchParams;
    const q = String(sp.q ?? "").trim();
    const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
    const { rows, total, lastPage } = await listResource(key, { q, page });
    const titleColumn = resource.columns.find((c) => c.type !== "image") ?? resource.columns[0];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="font-serif text-3xl text-emerald-royal">{resource.label}</h1>
                    <p className="text-stone-500 text-sm mt-1">{total} {total === 1 ? resource.singular : resource.label.toLowerCase()}{q ? ` matching “${q}”` : ""}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <form className="relative flex-1 sm:w-72" action={`/admin/${key}`}>
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input name="q" defaultValue={q} placeholder="Search…" className="admin-input pl-9" aria-label={`Search ${resource.label.toLowerCase()}`} />
                    </form>
                    <Link href={`/admin/${key}/new`} className="admin-btn-primary"><Plus size={16} /> Add {resource.singular}</Link>
                </div>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {resource.columns.map((c) => <th key={c.key}>{c.label ?? ""}</th>)}
                                <th className="!text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    {resource.columns.map((c) => (
                                        <td key={c.key} className={c === titleColumn ? "font-bold text-stone-900" : ""}>
                                            {c === titleColumn ? (
                                                <Link href={`/admin/${key}/${row.id}`} className="hover:underline"><Cell column={c} row={row} /></Link>
                                            ) : (
                                                <Cell column={c} row={row} />
                                            )}
                                        </td>
                                    ))}
                                    <td className="text-right whitespace-nowrap">
                                        <span className="inline-flex gap-1.5">
                                            <Link href={`/admin/${key}/${row.id}`} className="admin-btn !px-2.5 !py-1.5" aria-label="Edit"><Pencil size={14} /></Link>
                                            <DeleteButton resource={key} id={row.id} label={`${resource.singular} “${pick(row, titleColumn.key) ?? row.id}”`} warning={key === "categories" ? "Deleting a category also deletes all of its products." : undefined} compact />
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan={resource.columns.length + 1} className="text-center text-stone-500 py-12">Nothing here yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination page={page} lastPage={lastPage} params={{ q }} base={`/admin/${key}`} />
        </div>
    );
}
