"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components";
import { Calendar, User, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export default function BlogListing() {
    const [blogs, setBlogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadBlogs = async () => {
            const data = await api.getBlogs();
            if (data) {
                setBlogs(data);
            }
            setLoading(false);
        };
        loadBlogs();
    }, []);

    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-nav-lg pb-20 bg-emerald-royal text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] jamdani-pattern pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 text-center">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-heritage-gold text-xs uppercase tracking-[0.5em] font-bold mb-6 block"
                    >
                        The Royal Chronicles
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-serif leading-tight mb-8"
                    >
                        Stories of <span className="heritage-gradient-text italic">Bengal Heritage</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muslin-cream/60 max-w-2xl mx-auto text-lg font-light leading-relaxed"
                    >
                        Journey through the golden history of Dhakai weaving, the legacy of Muslin, and the art of Nawabi elegance.
                    </motion.p>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-24 max-w-7xl mx-auto px-4 md:px-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-6">
                                <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                                <div className="space-y-4 px-2">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : blogs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {blogs.map((blog, idx) => (
                            <motion.article
                                key={blog.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-heritage-gold/5 hover:royal-shadow transition-all duration-700"
                            >
                                <Link href={`/blog/${blog.slug}`} className="relative aspect-[16/10] overflow-hidden">
                                    <Image
                                        src={getOptimizedImage(blog.image)}
                                        alt={blog.title}
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-emerald-royal/90 backdrop-blur-sm text-white text-[9px] uppercase font-bold px-3 py-1.5 tracking-widest rounded-full">
                                            {blog.category}
                                        </span>
                                    </div>
                                </Link>

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-emerald-royal/40 font-bold mb-4">
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {blog.date}</span>
                                        <span className="flex items-center gap-1.5"><User size={12} /> {blog.author}</span>
                                    </div>
                                    <Link href={`/blog/${blog.slug}`}>
                                        <h2 className="font-serif text-2xl md:text-3xl text-emerald-royal group-hover:text-heritage-gold transition-colors leading-tight mb-4">
                                            {blog.title}
                                        </h2>
                                    </Link>
                                    <p className="text-emerald-royal/60 text-sm leading-relaxed font-light mb-8 flex-1">
                                        {blog.excerpt}
                                    </p>
                                    <Link
                                        href={`/blog/${blog.slug}`}
                                        className="flex items-center gap-3 text-heritage-gold text-[11px] uppercase tracking-[0.2em] font-bold group/link"
                                    >
                                        Read Full Chronicle
                                        <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 italic font-light">
                        The chronicles are currently empty.
                    </div>
                )}
            </section>

            <Footer />
        </main>
    );
}
