import { notFound } from "next/navigation";

// Unknown storefront URLs render the store's own 404 page (inside the store layout).
export default function Missing() {
    notFound();
}
