"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export function Categories() {
    const [categories, setCategories] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isExpanded, setIsExpanded] = React.useState(false);

    React.useEffect(() => {
        const loadCategories = async () => {
            const data = await api.getCategories();
            if (data) {
                // Add visual logic props since they aren't in the DB
                const enriched = data.map((cat, idx) => ({
                    ...cat,
                    span: idx === 1,
                    bordered: idx > 1,
                    href: `/shop?category=${cat.slug}`
                }));
                setCategories(enriched);
            }
            setLoading(false);
        };
        loadCategories();
    }, []);

    const visibleCategories = isExpanded ? categories : categories.slice(0, 4);

    return (
        <section id="categories" className="py-24 bg-muslin-cream">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-heritage-gold text-xs uppercase tracking-[0.3em] font-bold"
                    >
                        Hand-Made Dhaka Style
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-4xl font-serif mt-3 text-emerald-royal"
                    >
                        Pick Your Royal Look
                    </motion.h2>
                    <div className="w-16 h-px bg-heritage-gold/30 mx-auto mt-6"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-0">
                    {loading ? (
                        <>
                            <div className="md:col-span-2 h-64 md:h-96">
                                <Skeleton className="w-full h-full rounded-2xl" />
                            </div>
                            <div className="h-64 md:h-96">
                                <Skeleton className="w-full h-full rounded-2xl" />
                            </div>
                            <div className="h-64 md:h-96">
                                <Skeleton className="w-full h-full rounded-2xl" />
                            </div>
                        </>
                    ) : visibleCategories.length > 0 ? (
                        visibleCategories.map((category, index) => (
                            <Link
                                key={category.id}
                                href={category.href}
                                className={`group relative ${category.span ? "md:col-span-2 h-64 md:h-96" : "h-64 md:h-80 lg:h-96"
                                    } overflow-hidden rounded-2xl cursor-pointer shadow-xl nakshi-border block`}
                                aria-label={`View ${category.name} collection`}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="w-full h-full relative"
                                >
                                    <Image
                                        src={getOptimizedImage(category.image)}
                                        alt={category.name}
                                        fill
                                        loading="lazy"
                                        sizes={category.span ? "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"}
                                        className="object-cover transition-transform duration-[1200ms] group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-emerald-royal/20 group-hover/active:bg-emerald-royal/40 lg:group-hover:bg-emerald-royal/30 transition-colors duration-300"></div>

                                    {category.bordered ? (
                                        <div className="absolute inset-0 flex items-center justify-center p-6 md:p-4">
                                            <h3 className="font-serif text-2xl md:text-3xl text-white border-2 border-heritage-gold/50 px-6 py-3 md:px-6 md:py-2 uppercase tracking-[0.2em] group-hover:bg-muslin-cream group-hover:text-emerald-royal group-hover:border-transparent transition-all text-center backdrop-blur-[2px] md:backdrop-blur-none">
                                                {category.name}
                                            </h3>
                                        </div>
                                    ) : (
                                        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-white">
                                            <h3 className="font-serif text-3xl md:text-4xl mb-2 translate-y-0 lg:translate-y-4 lg:group-hover:translate-y-0 transition-transform duration-500">
                                                {category.name}
                                            </h3>
                                            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-heritage-gold/60 mt-2">Loyal Monarch</p>
                                            <span className="text-xs md:text-sm uppercase tracking-widest opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500 underline underline-offset-8 decoration-heritage-gold decoration-2 font-bold">
                                                See this story
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400 italic font-light">
                            The royal collections are currently being curated.
                        </div>
                    )}
                </div>

                {!isExpanded && !loading && categories.length > 4 && (
                    <div className="mt-16 text-center">
                        <button
                            onClick={() => setIsExpanded(true)}
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
