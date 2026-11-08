import { cache } from "react";
import { findProduct, relatedProducts } from "@/lib/server/catalog";
import { getOptimizedImage } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductDetail } from "@/components/product/ProductDetail";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { WishlistModal } from "@/components/ui/WishlistModal";
import { Toast } from "@/components/ui/Toast";
import { notFound } from "next/navigation";

// Render each product page on its first visit, then serve it from cache (refreshed every 30s).
// Products aren't built ahead of time because they're managed live in the admin panel.
export const revalidate = 30;

export async function generateStaticParams() {
    return [];
}

// `id` may be a numeric id or a slug. Read straight from the database (no HTTP hop);
// cached so metadata and the page share one query.
const getProduct = cache((idOrSlug) => findProduct(idOrSlug));

export async function generateMetadata({ params }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    const description = product.description?.slice(0, 160) || `Shop ${product.name} at Noor Banu.`;
    const image = getOptimizedImage(product.image);

    return {
        title: product.name,
        description,
        alternates: { canonical: `/product/${product.slug || product.id}` },
        openGraph: {
            title: product.name,
            description,
            images: [{ url: image, alt: product.name }],
        },
    };
}

export default async function ProductPage({ params }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    const related = await relatedProducts(product.id);

    return (
        <main className="min-h-screen">
            <Navbar />
            <ProductDetail product={product} />
            <RelatedProducts product={product} products={related} />
            <Footer />

            {/* Overlays */}
            <WishlistModal />
            <Toast />
        </main>
    );
}
