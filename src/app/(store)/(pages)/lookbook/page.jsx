"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar, Footer, Toast, WishlistModal } from "@/components"; // Ensure these imports work/exist
import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export default function LookbookPage() {
    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <div className="pt-nav-lg pb-12 px-4 md:px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <span className="text-heritage-gold text-xs uppercase tracking-[0.3em] font-bold">
                        Archive
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-emerald-royal">
                        Royal Lookbook Collection
                    </h1>
                    <div className="w-24 h-1 bg-heritage-gold mx-auto"></div>
                </div>
                <LookbookGrid />
            </div>
            <Footer />
            {/* Overlays */}
            <WishlistModal />
            <Toast />
        </main>
    );
}

function LookbookGrid() {
    const [page, setPage] = React.useState(1);
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        const loadLookbooks = async () => {
            setLoading(true);
            const result = await api.getLookbook(page);
            if (result) {
                setData(result);
            }
            setLoading(false);

            if (containerRef.current && page > 1) {
                containerRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        };

        loadLookbooks();
    }, [page]);

    const handleNext = () => {
        if (data?.meta?.last_page && page < data.meta.last_page) {
            setPage(p => p + 1);
        }
    };

    const handlePrev = () => {
        if (page > 1) setPage(p => p - 1);
    };

    if (loading && !data) {
        return <PageSkeleton />;
    }

    const items = data?.data || [];

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 font-serif text-xl">No collections found.</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnimatePresence mode="wait">
                    {items.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="group relative"
                        >
                            <div className="aspect-[3/4] overflow-hidden rounded-xl shadow-lg nakshi-border bg-white relative">
                                <Image
                                    src={getOptimizedImage(item.image)}
                                    alt={item.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    priority={idx < 4}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-royal/90 via-emerald-royal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                                    <p className="text-heritage-gold text-xs tracking-widest uppercase mb-2 font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                                        {item.category_name}
                                    </p>
                                    <h3 className="text-white font-serif text-xl leading-snug transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-200">
                                        {item.title}
                                    </h3>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="flex justify-center gap-4 pt-8">
                <button
                    onClick={handlePrev}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-heritage-gold/30 text-emerald-royal hover:bg-emerald-royal hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-emerald-royal transition-all duration-300 uppercase text-xs font-bold tracking-widest"
                >
                    <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex items-center gap-2 text-emerald-royal font-serif">
                    <span className="font-bold">{page}</span> / <span className="opacity-60">{data?.meta?.last_page || 1}</span>
                </div>
                <button
                    onClick={handleNext}
                    disabled={!data?.meta?.last_page || page >= data.meta.last_page}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-heritage-gold/30 text-emerald-royal hover:bg-emerald-royal hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-emerald-royal transition-all duration-300 uppercase text-xs font-bold tracking-widest"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

function PageSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden">
                    <Skeleton className="w-full h-full" />
                </div>
            ))}
        </div>
    );
}
