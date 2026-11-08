import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { relationOptions } from "@/lib/server/adminResources";
import { ResourceForm } from "@/components/admin/ResourceForm";

export async function generateMetadata({ params }) {
    const { resource } = await params;
    const r = getResource(resource);
    return { title: r ? `Add ${r.singular}` : "Not found" };
}

export default async function NewResourcePage({ params }) {
    const { resource: key } = await params;
    const resource = getResource(key);
    if (!resource) notFound();
    return <ResourceForm resourceKey={key} options={await relationOptions(resource)} />;
}
