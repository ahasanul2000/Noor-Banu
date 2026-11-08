"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

export function BlogPreview() {
    const [blogs, setBlogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadBlogs = async () => {
            const data = await api.getBlogs();
            if (data) {
                setBlogs(data.slice(0, 3));
            }
            setLoading(false);
        };
        loadBlogs();
    }, []);

    if (loading) {
        return (
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-2xl space-y-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-12 w-3/4" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-6">
                                <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                                <div className="space-y-3">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-heritage-gold text-xs uppercase tracking-[0.4em] font-bold mb-4 block"
                        >
                            Royal Chronicles
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-serif text-emerald-royal leading-tight"
                        >
                            Stories from the <span className="italic">Lost Looms</span>
                        </motion.h2>
                    </div>
                    <Link
                        href="/blog"
                        className="group flex items-center gap-3 text-emerald-royal font-bold uppercase tracking-widest text-xs hover:text-heritage-gold transition-colors"
                    >
                        Explore All Stories
                        <div className="w-10 h-10 rounded-full border border-emerald-royal/10 flex items-center justify-center group-hover:border-heritage-gold transition-colors">
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {blogs.map((blog, idx) => (
                        <motion.article
                            key={blog.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <Link href={`/blog/${blog.slug}`} className="block overflow-hidden rounded-2xl aspect-[16/10] mb-6 relative royal-shadow">
                                <Image
                                    src={getOptimizedImage(blog.image)}
                                    alt={blog.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-emerald-royal/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur-sm text-emerald-royal text-[9px] uppercase font-bold px-3 py-1.5 tracking-widest rounded-full shadow-sm">
                                        {blog.category}
                                    </span>
                                </div>
                            </Link>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-emerald-royal/40 font-bold">
                                    <span>{blog.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-heritage-gold/30"></span>
                                    <span>{blog.author}</span>
                                </div>
                                <Link href={`/blog/${blog.slug}`}>
                                    <h3 className="font-serif text-2xl text-emerald-royal group-hover:text-heritage-gold transition-colors leading-snug">
                                        {blog.title}
                                    </h3>
                                </Link>
                                <p className="text-emerald-royal/60 text-sm leading-relaxed line-clamp-2 font-light">
                                    {blog.excerpt}
                                </p>
                                <Link
                                    href={`/blog/${blog.slug}`}
                                    className="inline-block text-[10px] uppercase tracking-widest font-bold text-heritage-gold border-b border-heritage-gold/20 pb-1 mt-4 hover:border-heritage-gold transition-all"
                                >
                                    Read The Story
                                </Link>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
