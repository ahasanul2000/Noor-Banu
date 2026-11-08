"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export function PickYourRoyalLook() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const loadLookbooks = async (expanded = false) => {
        setLoading(true);
        // If expanded, fetch a large number to show "all". Otherwise fetch 7.
        const limit = expanded ? 100 : 7;
        const result = await api.getLookbook(1, limit);
        if (result?.data) {
            setItems(result.data);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        loadLookbooks(false);
    }, []);

    const handleSeeAll = () => {
        setIsExpanded(true);
        loadLookbooks(true);
    };

    if (loading && items.length === 0) {
        return <SectionSkeleton />;
    }

    if (items.length === 0) return null;

    return (
        <section className="py-24 bg-muslin-cream relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <Image
                    src="/pattern-bg.png"
                    alt="pattern"
                    fill
                    sizes="100vw"
                    className="object-cover"
                />
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <span className="text-heritage-gold text-xs uppercase tracking-[0.3em] font-bold">
                        Royal Wardrobe
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif text-emerald-royal">
                        Pick Your Royal Look
                    </h2>
                    <div className="w-24 h-1 bg-heritage-gold mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
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
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-royal/90 via-emerald-royal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                                        <p className="text-heritage-gold text-xs tracking-widest uppercase mb-2 font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                                            {item.product?.category?.name || item.category_name}
                                        </p>
                                        <h3 className="text-white font-serif text-xl leading-snug transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-200">
                                            {item.product?.name || item.title}
                                        </h3>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {!isExpanded && (
                    <div className="mt-16 text-center">
                        <button
                            onClick={handleSeeAll}
                            className="inline-block px-12 py-4 bg-emerald-royal text-white font-serif text-lg tracking-wider hover:bg-emerald-royal/90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                        >
                            See All Collections
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

function SectionSkeleton() {
    return (
        <section className="py-24 bg-muslin-cream">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16 space-y-4 flex flex-col items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-64" />
                    <Skeleton className="h-1 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden">
                            <Skeleton className="w-full h-full" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
