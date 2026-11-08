"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { blogs } from "@/data/blogs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Calendar, User, Clock, ChevronLeft, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export default function BlogPost() {
    const { slug } = useParams();
    const [blog, setBlog] = React.useState(null);
    const [relatedBlogs, setRelatedBlogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadBlog = async () => {
            if (!slug) return;
            const data = await api.getBlog(slug);
            if (data) {
                setBlog(data);
                // Fetch latest blogs for "Related"
                const allBlogs = await api.getBlogs();
                if (allBlogs) {
                    setRelatedBlogs(allBlogs.filter(b => b.slug !== slug).slice(0, 2));
                }
            }
            setLoading(false);
        };
        loadBlog();
    }, [slug]);

    if (loading) return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <article className="pt-nav-lg pb-24">
                <div className="max-w-4xl mx-auto px-4 md:px-6">
                    <Skeleton className="h-4 w-32 mb-12" />
                    <div className="space-y-6 mb-12">
                        <Skeleton className="h-4 w-64" />
                        <Skeleton className="h-16 w-3/4" />
                        <div className="flex gap-3 pt-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-32" />
                                <Skeleton className="h-2 w-20" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="aspect-[21/9] w-full rounded-3xl mb-16" />
                    <div className="space-y-8">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                </div>
            </article>
            <Footer />
        </main>
    );

    if (!blog) return <div className="min-h-screen flex items-center justify-center font-serif text-2xl bg-muslin-cream">Story not found in the archives...</div>;

    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />

            {/* Article Header */}
            <article className="pt-nav-lg pb-24">
                <div className="max-w-4xl mx-auto px-4 md:px-6">
                    <Link
                        href="/blog"
                        className="flex items-center gap-2 text-heritage-gold text-[10px] uppercase tracking-widest font-bold mb-12 hover:gap-3 transition-all"
                    >
                        <ChevronLeft size={14} /> Back to Chronicles
                    </Link>

                    <div className="space-y-6 mb-12">
                        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-heritage-gold font-bold">
                            <span className="bg-heritage-gold/10 px-3 py-1 rounded-full">{blog.category}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {blog.date}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> 6 Min Read</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif text-emerald-royal leading-tight">
                            {blog.title}
                        </h1>
                        <div className="flex items-center gap-3 pt-4 border-t border-heritage-gold/10">
                            <div className="w-10 h-10 rounded-full bg-emerald-royal/10 flex items-center justify-center text-emerald-royal font-serif text-lg">
                                {blog.author ? blog.author.charAt(0) : 'L'}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-emerald-royal font-bold">{blog.author || 'Nawabi Author'}</p>
                                <p className="text-[9px] text-emerald-royal/40 uppercase tracking-widest">Palace Historian</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-[21/9] rounded-3xl overflow-hidden mb-16 royal-shadow font-cursive">
                        <Image
                            src={getOptimizedImage(blog.image)}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Content */}
                    <div className="prose prose-luxury max-w-none">
                        <div
                            className="font-serif text-lg md:text-xl text-emerald-royal/80 leading-relaxed space-y-8 first-letter:text-5xl first-letter:font-serif first-letter:text-heritage-gold first-letter:mr-3 first-letter:float-left"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />
                    </div>
                </div>
            </article>

            {/* Related Stories */}
            <section className="py-24 bg-white border-t border-heritage-gold/10">
                <div className="max-w-6xl mx-auto px-4 md:px-6">
                    <h2 className="text-3xl font-serif text-emerald-royal text-center mb-16 underline decoration-heritage-gold/20 underline-offset-8">
                        Continue Your Journey
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {relatedBlogs.map((story) => (
                            <Link key={story.id} href={`/blog/${story.slug}`} className="group flex flex-col md:flex-row gap-8 items-center">
                                <div className="relative w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0">
                                    <Image src={getOptimizedImage(story.image)} alt={story.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>
                                <div className="space-y-3">
                                    <span className="text-heritage-gold text-[9px] uppercase font-bold tracking-widest">{story.category}</span>
                                    <h3 className="text-xl font-serif text-emerald-royal group-hover:text-heritage-gold transition-colors leading-tight">
                                        {story.title}
                                    </h3>
                                    <p className="text-emerald-royal/60 text-xs font-light line-clamp-2">{story.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />

            <style jsx global>{`
                .prose-luxury p {
                    margin-bottom: 2rem;
                }
                .prose-luxury p:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </main>
    );
}
