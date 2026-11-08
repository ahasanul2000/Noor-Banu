import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/server/db";
import { plain } from "@/lib/server/serialize";
import { dateTime } from "@/lib/admin/format";
import { Pagination } from "@/components/admin/Pagination";

export const metadata = { title: "Customers" };

const PER_PAGE = 25;

export default async function CustomersPage({ searchParams }) {
    const sp = await searchParams;
    const q = String(sp.q ?? "").trim();
    const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
    const where = {
        is_admin: false,
        ...(q ? { OR: ["name", "phone", "email", "city"].map((f) => ({ [f]: { contains: q, mode: "insensitive" } })) } : {}),
    };
    const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { id: "desc" },
            skip: (page - 1) * PER_PAGE,
            take: PER_PAGE,
            select: { id: true, name: true, phone: true, email: true, city: true, created_at: true, _count: { select: { orders: true } } },
        }),
    ]);
    const rows = plain(users);

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="font-serif text-3xl text-emerald-royal">Customers</h1>
                    <p className="text-stone-500 text-sm mt-1">{total} registered customers</p>
                </div>
                <form className="relative w-full sm:w-80" action="/admin/customers">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input name="q" defaultValue={q} placeholder="Name, phone, email…" className="admin-input pl-9" aria-label="Search customers" />
                </form>
            </div>
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>Orders</th><th>Joined</th></tr></thead>
                        <tbody>
                            {rows.map((u) => (
                                <tr key={u.id}>
                                    <td><Link href={`/admin/customers/${u.id}`} className="font-bold text-emerald-royal hover:underline">{u.name}</Link></td>
                                    <td>{u.phone || "—"}</td>
                                    <td>{u.email || "—"}</td>
                                    <td>{u.city || "—"}</td>
                                    <td className="tabular-nums">{u._count.orders}</td>
                                    <td className="text-stone-500 whitespace-nowrap">{dateTime(u.created_at)}</td>
                                </tr>
                            ))}
                            {rows.length === 0 && <tr><td colSpan={6} className="text-center text-stone-500 py-12">No customers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination page={page} lastPage={Math.max(1, Math.ceil(total / PER_PAGE))} params={{ q }} base="/admin/customers" />
        </div>
    );
}
