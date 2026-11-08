import { requireAdminPage } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { AdminShell } from "@/components/admin/AdminShell";

// Every admin page reads live data and depends on the signed-in user.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }) {
    const admin = await requireAdminPage();
    const pending = await prisma.order.count({ where: { status: "pending" } });
    return (
        <AdminShell admin={{ name: admin.name, email: admin.email }} pendingOrders={pending}>
            {children}
        </AdminShell>
    );
}
