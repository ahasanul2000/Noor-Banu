"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export function Lookbook() {
    const [items, setItems] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadLookbook = async () => {
            const data = await api.getLookbook();
            if (data) {
                setItems(data);
            }
            setLoading(false);
        };
        loadLookbook();
    }, []);

    const primaryItem = items[0] || {
        title: "Essence of Nawabi Grace",
        image: "https://www.fashiongonerogue.com/wp-content/uploads/2020/05/Lily-Jean-Harvey-Jewelry-Editorial02.jpg",
        category_name: "The Dhakai Collection"
    };

    if (loading) {
        return (
            <section className="py-24 bg-muslin-cream overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="relative px-4">
                            <Skeleton className="aspect-[3/4] w-full rounded-2xl nakshi-border" />
                        </div>
                        <div className="space-y-8 px-4">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-16 w-3/4" />
                                <Skeleton className="h-16 w-1/2" />
                                <div className="space-y-2 pt-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pb-8 border-b border-heritage-gold/10">
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-12" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-12" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-14 w-48" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 bg-muslin-cream overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative px-4"
                    >
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl nakshi-border">
                            <Image
                                src={getOptimizedImage(primaryItem.image)}
                                alt={primaryItem.title}
                                fill
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-10 -right-5 w-48 h-64 border-8 border-heritage-gold/10 hidden md:block -z-10"></div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="space-y-8 px-4"
                    >
                        <div className="space-y-4">
                            <span className="text-heritage-gold text-xs uppercase tracking-[0.3em] font-bold">
                                {primaryItem.product?.category?.name || primaryItem.category_name || "The Dhakai Collection"}
                            </span>
                            <h2 className="text-4xl md:text-6xl font-serif text-emerald-royal leading-tight">
                                {(primaryItem.product?.name || primaryItem.title).split(' ').map((word, i) => (
                                    <React.Fragment key={i}>
                                        {i === 2 ? <><br /><span className="italic heritage-gradient-text">{word}</span></> : ` ${word}`}
                                    </React.Fragment>
                                ))}
                            </h2>
                            <p className="text-gray-600 text-lg font-light leading-relaxed max-w-lg">
                                Each masterpiece in our Heritage Lookbook is a tribute to the legendary looms of Sonargaon and the artisanal legacy of the Bengal Subah.
                            </p>
                        </div>

                        {items.length > 1 && (
                            <div className="grid grid-cols-2 gap-6 pb-8 border-b border-heritage-gold/10">
                                {items.slice(1, 3).map((item, idx) => (
                                    <div key={item.id} className="space-y-2">
                                        <p className="font-serif text-3xl text-heritage-gold">0{idx + 1}</p>
                                        <p className="text-xs uppercase tracking-widest text-emerald-royal/60 font-bold">{item.product?.name || item.title}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link
                            href="/shop"
                            className="inline-block px-12 py-5 bg-emerald-royal text-white text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold hover:bg-heritage-gold transition-all duration-500 shadow-2xl gold-gradient-bg"
                        >
                            Enter The Boutique
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
