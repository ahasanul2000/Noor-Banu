import dynamic from 'next/dynamic';
import { Navbar, Hero } from "@/components";

// Lazy load non-critical components
const Categories = dynamic(() => import('@/components').then(mod => ({ default: mod.Categories })));
const FeaturedProducts = dynamic(() => import('@/components').then(mod => ({ default: mod.FeaturedProducts })));
const PickYourRoyalLook = dynamic(() => import('@/components').then(mod => ({ default: mod.PickYourRoyalLook })));
const Trending = dynamic(() => import('@/components').then(mod => ({ default: mod.Trending })));
const Features = dynamic(() => import('@/components').then(mod => ({ default: mod.Features })));
const Testimonials = dynamic(() => import('@/components').then(mod => ({ default: mod.Testimonials })));
const BlogPreview = dynamic(() => import('@/components').then(mod => ({ default: mod.BlogPreview })));
const InstagramFeed = dynamic(() => import('@/components').then(mod => ({ default: mod.InstagramFeed })));
const Newsletter = dynamic(() => import('@/components').then(mod => ({ default: mod.Newsletter })));
const Footer = dynamic(() => import('@/components').then(mod => ({ default: mod.Footer })));
const WishlistModal = dynamic(() => import('@/components').then(mod => ({ default: mod.WishlistModal })));
const Toast = dynamic(() => import('@/components').then(mod => ({ default: mod.Toast })));

export default function Home() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <Categories />
            <FeaturedProducts />
            <PickYourRoyalLook />
            <Trending />
            <Features />
            <Testimonials />
            <BlogPreview />
            <InstagramFeed />
            <Newsletter />
            <Footer />

            {/* Overlays */}
            <WishlistModal />
            <Toast />
        </main>
    );
}
