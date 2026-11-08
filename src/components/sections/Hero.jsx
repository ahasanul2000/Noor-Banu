"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import { getOptimizedImage } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

export function Hero() {
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSlides = async () => {
            const data = await api.getHeroSlides();
            if (data && data.length > 0) {
                // Map API data to UI structure, providing fallbacks for highlight/description if needed
                const mappedSlides = data.map(slide => ({
                    ...slide,
                    highlight: slide.highlight || slide.title.split(' ')[0], // Simple fallback for highlight
                    description: slide.subtitle, // API 'subtitle' maps to UI 'description'
                    topRated: "Bespoke Collection" // Static for now or add to API
                }));
                setSlides(mappedSlides);
            }
            setLoading(false);
        };
        loadSlides();
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 10000);
        return () => clearInterval(timer);
    }, [slides]);

    if (loading) return (
        <section className="relative min-h-[100dvh] flex items-center pt-24 md:pt-32 pb-12 overflow-hidden bg-muslin-cream">
            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                    <div className="order-2 md:order-1 space-y-6">
                        <Skeleton className="h-6 w-32 rounded-full" />
                        <Skeleton className="h-20 w-3/4" />
                        <Skeleton className="h-20 w-1/2" />
                        <Skeleton className="h-16 w-full max-w-md" />
                        <div className="flex gap-4 pt-4">
                            <Skeleton className="h-14 w-40" />
                            <Skeleton className="h-14 w-40" />
                        </div>
                    </div>
                    <div className="order-1 md:order-2 flex justify-center">
                        <Skeleton className="w-full max-w-[380px] aspect-[3/4] rounded-t-[10rem] rounded-b-[2rem]" />
                    </div>
                </div>
            </div>
        </section>
    );

    if (slides.length === 0) return null;

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section
            id="home"
            className="relative min-h-[100dvh] flex items-center pt-24 md:pt-32 pb-12 overflow-hidden bg-gradient-to-br from-emerald-royal/5 via-muslin-cream to-heritage-gold/5"
        >
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-heritage-gold/5 md:rounded-bl-[100px] -z-10"></div>
            <div className="absolute bottom-20 left-10 w-48 md:w-64 h-48 md:h-64 bg-emerald-royal/5 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
                    >
                        {/* Text Content */}
                        <div className="order-2 md:order-1 space-y-4 md:space-y-6 text-center md:text-left">
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-heritage-gold uppercase tracking-[0.2em] text-[10px] md:text-sm font-bold bg-heritage-gold/10 px-4 py-1 rounded-full inline-block mb-2"
                            >
                                {slides[currentSlide].subtitle}
                            </motion.span>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl sm:text-5xl md:text-7xl font-serif text-luxury-black leading-tight"
                            >
                                {slides[currentSlide].title.split(slides[currentSlide].highlight)[0]}
                                <span className="italic heritage-gradient-text">{slides[currentSlide].highlight}</span>
                                {slides[currentSlide].title.split(slides[currentSlide].highlight)[1]}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-600 text-sm md:text-lg md:w-3/4 font-light leading-relaxed mb-4 md:mb-0"
                            >
                                {slides[currentSlide].description}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-4 px-8 md:px-0"
                            >
                                <Link
                                    href={slides[currentSlide].button_link || "/shop"}
                                    className="px-8 py-3 md:py-4 bg-emerald-royal text-white uppercase tracking-widest text-[10px] md:text-xs font-bold hover:bg-heritage-gold transition-colors duration-300 shadow-xl"
                                >
                                    {slides[currentSlide].button_text || "Shop My Boutique"}
                                </Link>
                                <Link
                                    href="/about"
                                    className="px-8 py-3 md:py-4 border border-emerald-royal text-emerald-royal uppercase tracking-widest text-[10px] md:text-xs font-bold hover:bg-emerald-royal hover:text-white transition-colors duration-300"
                                >
                                    My Royal Story
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.7 }}
                                transition={{ delay: 0.6 }}
                                className="hidden md:flex items-center gap-8 pt-8"
                            >
                                <div>
                                    <p className="font-serif text-2xl">500+</p>
                                    <p className="text-xs uppercase tracking-wider">Royal Items</p>
                                </div>
                                <div className="w-px h-8 bg-gray-300"></div>
                                <div>
                                    <p className="font-serif text-2xl">24k</p>
                                    <p className="text-xs uppercase tracking-wider">Happy Hearts</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Hero Image */}
                        <div className="order-1 md:order-2 relative flex justify-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ duration: 1 }}
                                className="relative group w-full max-w-[180px] sm:max-w-[240px] md:max-w-[380px]"
                            >
                                <div className="relative z-10 w-full aspect-[3/4] rounded-t-[10rem] rounded-b-[2rem] overflow-hidden shadow-2xl border-4 border-white animate-float">
                                    <Image
                                        src={getOptimizedImage(slides[currentSlide].image)}
                                        alt={slides[currentSlide].title}
                                        fill
                                        className="object-cover"
                                        priority={currentSlide === 0}
                                        fetchPriority={currentSlide === 0 ? "high" : "low"}
                                        quality={85}
                                        loading={currentSlide === 0 ? "eager" : "lazy"}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-royal/40 to-transparent"></div>
                                </div>

                                {/* Floating Top Rated Badge */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: [0, -10, 0], opacity: 1 }}
                                    transition={{
                                        y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                                        opacity: { duration: 0.5 },
                                    }}
                                    className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-white p-2 md:p-4 shadow-xl rounded-lg z-20 max-w-[100px] md:max-w-[150px]"
                                >
                                    <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                        <Star size={8} className="text-gold-accent fill-gold-accent" />
                                        <span className="text-[8px] md:text-xs font-bold">Top Rated</span>
                                    </div>
                                    <p className="font-serif text-[10px] md:text-sm">{slides[currentSlide].topRated}</p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Slider Navigation Controls - Hidden on mobile */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 hidden md:flex justify-between px-2 md:-mx-12 pointer-events-none opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={prevSlide}
                        className="p-2 md:p-3 rounded-full bg-white/50 hover:bg-emerald-royal hover:text-white text-emerald-royal transition-all shadow-md pointer-events-auto backdrop-blur-sm border border-emerald-royal/20"
                        aria-label="Previous Slide"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="p-2 md:p-3 rounded-full bg-white/50 hover:bg-emerald-royal hover:text-white text-emerald-royal transition-all shadow-md pointer-events-auto backdrop-blur-sm border border-emerald-royal/20"
                        aria-label="Next Slide"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Slider Pagination Dots */}
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-1 h-1 md:w-3 md:h-3 rounded-full transition-all duration-300 ${index === currentSlide
                                ? "bg-emerald-royal w-3 md:w-8"
                                : "bg-emerald-royal/20 hover:bg-emerald-royal/50"
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === currentSlide ? "true" : "false"}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
