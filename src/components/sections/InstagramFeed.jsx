"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";

export function InstagramFeed() {
    const [posts, setPosts] = React.useState([]);

    React.useEffect(() => {
        const loadPosts = async () => {
            const data = await api.getInstagramPosts();
            if (data) setPosts(data);
        };
        loadPosts();
    }, []);

    if (posts.length === 0) return null;
    return (
        <section className="py-24 bg-muslin-cream border-t border-heritage-gold/5">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Instagram className="mx-auto text-heritage-gold mb-4" size={32} />
                        <h2 className="text-3xl md:text-4xl font-serif text-emerald-royal mb-2">Follow My Royal Story</h2>
                        <p className="text-emerald-royal/60 font-medium uppercase tracking-[0.2em] text-[10px] md:text-xs">Follow us for more Dhakai love @NoorBanuDhaka</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 px-2 md:px-0">
                    {posts.map((post, idx) => (
                        <motion.a
                            key={post.id}
                            href={post.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="relative aspect-square overflow-hidden group cursor-pointer rounded-xl nakshi-border block"
                        >
                            <Image
                                src={getOptimizedImage(post.image)}
                                alt={post.caption || `Noor Banu heritage fashion style ${idx + 1}`}
                                fill
                                loading="lazy"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-emerald-royal/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <Instagram size={24} className="text-white opacity-80" />
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
}
