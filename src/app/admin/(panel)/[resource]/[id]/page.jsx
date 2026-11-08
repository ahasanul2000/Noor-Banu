import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { findResource, relationOptions } from "@/lib/server/adminResources";
import { ResourceForm } from "@/components/admin/ResourceForm";

export async function generateMetadata({ params }) {
    const { resource } = await params;
    const r = getResource(resource);
    return { title: r ? `Edit ${r.singular}` : "Not found" };
}

export default async function EditResourcePage({ params }) {
    const { resource: key, id } = await params;
    const resource = getResource(key);
    if (!resource || !/^\d+$/.test(id)) notFound();
    const row = await findResource(key, Number(id));
    if (!row) notFound();
    return <ResourceForm resourceKey={key} row={row} options={await relationOptions(resource)} />;
}
