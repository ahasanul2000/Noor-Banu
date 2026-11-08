"use client";

import React from "react";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-muslin-cream relative overflow-hidden">
            {/* Global Jamdani Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02] jamdani-pattern pointer-events-none"></div>

            <Navbar />
            <SectionHeader title="Our Royal Story" subtitle="Dhakai Bhalobasha" />

            <section className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] relative rounded-lg overflow-hidden shadow-2xl border border-heritage-gold/20">
                            <Image
                                src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop"
                                alt="Noor Banu Dhakai Atelier"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-48 h-64 border-8 border-emerald-royal/5 -z-10 hidden md:block"></div>
                    </motion.div>

                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-5xl font-serif text-emerald-royal leading-tight">
                            A Legacy of Dhakai <br />
                            <span className="italic heritage-gradient-text">Artisanship</span>
                        </h2>
                        <div className="space-y-6 text-gray-600 font-light leading-relaxed text-lg text-justify">
                            <p>
                                Noor Banu is not just a shop. It is our way of showing the world the beautiful, hand-made love (Bhalobasha) of Bengal. Our story starts in the old streets of Dhaka, where weavers have made the best Muslin and Jamdani for hundreds of years.
                            </p>
                            <p>
                                Every dress you see is made by master weavers from Sonargaon and Rajshahi. We want to bring back the Nawabi style and give you something truly special that feels like royal heritage.
                            </p>
                        </div>
                        <div className="pt-8 grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-serif text-2xl text-heritage-gold mb-2">100+</h4>
                                <p className="text-xs uppercase tracking-widest text-emerald-royal/60">Master Weavers</p>
                            </div>
                            <div>
                                <h4 className="font-serif text-2xl text-heritage-gold mb-2">300+</h4>
                                <p className="text-xs uppercase tracking-widest text-emerald-royal/60">Years of Legacy</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-emerald-royal/5 py-24 px-4 md:px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {[
                        { title: "Nawabi Tradition", desc: "Keeping the old royal ways of Dhaka alive in every thread." },
                        { title: "Shera (Best) Quality", desc: "Everything is hand-made with care and real history." },
                        { title: "Artisan Love", desc: "Helping our local weavers stay strong for the next generation." }
                    ].map((value, i) => (
                        <div key={i} className="space-y-4">
                            <h3 className="font-serif text-2xl text-emerald-royal">{value.title}</h3>
                            <p className="text-gray-600 font-light leading-relaxed">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}
