"use client";

import React from "react";
import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export function Testimonials() {
    const [testimonials, setTestimonials] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useEffect(() => {
        const loadTestimonials = async () => {
            const data = await api.getTestimonials();
            if (data && data.length > 0) {
                setTestimonials(data);
            }
            setLoading(false);
        };
        loadTestimonials();
    }, []);

    if (loading || testimonials.length === 0) {
        return (
            <section className="py-20 md:py-32 bg-muslin-cream border-y border-heritage-gold/5 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                    <div className="flex flex-col items-center mb-10">
                        <Skeleton className="w-10 h-10 rounded-none mb-4 opacity-20" />
                        <Skeleton className="w-40 h-3" />
                    </div>
                    <div className="space-y-4 mb-12">
                        <Skeleton className="h-8 w-full max-w-2xl mx-auto" />
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                    </div>
                    <div className="flex items-center justify-center gap-5">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="text-left space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 md:py-32 bg-muslin-cream border-y border-heritage-gold/5 relative overflow-hidden">
            {/* Subtle Royal Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-heritage-gold/20 to-transparent"></div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
                <div className="mb-6 md:mb-10 flex flex-col items-center">
                    <Quote size={40} className="text-heritage-gold/40 fill-current mb-4" />
                    <span className="text-heritage-gold text-[10px] uppercase tracking-[0.4em] font-bold">Patrons of the Palace</span>
                </div>

                <div className="relative min-h-[300px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -10 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center justify-center w-full"
                        >
                            <p className="font-serif text-xl sm:text-2xl md:text-3xl text-emerald-royal italic leading-relaxed mb-12 px-4 md:px-0">
                                &ldquo;{testimonials[activeIndex].content}&rdquo;
                            </p>

                            <div className="flex items-center gap-5">
                                <div className="relative w-14 h-14 md:w-16 md:h-16">
                                    <div className="absolute inset-0 border border-heritage-gold/30 rounded-full scale-110"></div>
                                    <div className="relative w-full h-full rounded-full border-2 border-heritage-gold overflow-hidden shadow-2xl">
                                        <Image
                                            src={getOptimizedImage(testimonials[activeIndex].image, `https://i.pravatar.cc/150?u=${testimonials[activeIndex].name}`)}
                                            alt={testimonials[activeIndex].name}
                                            fill
                                            sizes="64px"
                                            loading="lazy"
                                            className="object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase tracking-[0.2em] text-emerald-royal">{testimonials[activeIndex].name}</p>
                                    <div className="text-heritage-gold flex gap-1 mt-1.5">
                                        {[...Array(testimonials[activeIndex].rating || 5)].map((_, i) => (
                                            <Star key={i} size={12} className="fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-heritage-gold/60 mt-2">{testimonials[activeIndex].role}</p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Carousel Indicators with Progress */}
                <div className="flex justify-center gap-4 mt-16">
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className="group relative h-1 w-12 bg-heritage-gold/20 rounded-full overflow-hidden transition-all"
                            aria-label={`Go to testimonial ${i + 1}`}
                        >
                            {i === activeIndex && (
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="absolute inset-0 bg-heritage-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                                    onAnimationComplete={() => {
                                        setActiveIndex((prev) => (prev + 1) % testimonials.length);
                                    }}
                                />
                            )}
                            <div className="absolute inset-0 bg-heritage-gold/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
