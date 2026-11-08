"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";

const faqCategories = [
    {
        title: "Heritage & Craftsmanship",
        icon: "✨",
        questions: [
            { q: "How do I care for my Noor Banu silk pieces?", a: "We recommend professional dry cleaning only for all our silk and lace garments. Preserve the delicate Dhakai fibers by storing them in a cool, dry place away from direct sunlight, ideally wrapped in acid-free muslin cloth." },
            { q: "What makes Noor Banu Jamdani authentic?", a: "Every Noor Banu Jamdani is woven using the traditional 'discontinuous weft' technique on handlooms. We only work with master weavers in the heritage belts of Dhaka, ensuring every motif is a testament to hundred-year-old artistry." },
            { q: "Are your fabrics eco-friendly?", a: "We prioritize natural fibers and heritage dyes. Our commitment to sustainability is rooted in our slow-fashion philosophy—creating heirlooms that last for generations rather than fast-fashion trends." }
        ]
    },
    {
        title: "Royal Orders & Delivery",
        icon: "📦",
        questions: [
            { q: "Do you offer international shipping?", a: "Yes, we ship to most palaces worldwide. Delivery times range from 3-7 business days via our premium global couriers (DHL/FedEx). All international orders are tracked and insured for your peace of mind." },
            { q: "What is your return policy?", a: "We accept returns on all non-bespoke items within 14 days of delivery. The item must be in its original, unworn condition with all 'Royal Seal' tags attached. Return shipping is complimentary for our global patrons." },
            { q: "Can I track my royal package?", a: "Upon dispatch, you will receive a unique tracking number via email. You can follow your heritage piece as it journeys from our Dhaka archives to your residence." }
        ]
    },
    {
        title: "Bespoke Royal Service",
        icon: "👑",
        questions: [
            { q: "Can I request a bespoke design?", a: "Absolutely. Our master artisans are available for private consultations. Whether it's a specific color palette for a wedding or a custom motif, we specialize in weaving your personal story into fabric." },
            { q: "How long does a bespoke piece take?", a: "A custom Jamdani or Muslin piece is a work of art and can take anywhere from 4 to 12 weeks depending on the complexity of the design. We will provide regular updates from the looms during this process." },
            { q: "Do you offer private styling?", a: "Yes, our royal stylists are available for virtual or in-person consultations to help you curate a wardrobe that reflects your status and heritage." }
        ]
    }
];

function AccordionItem({ question, answer, isOpen, onClick }) {
    return (
        <div className="border-b border-heritage-gold/10 last:border-0">
            <button
                onClick={onClick}
                className="w-full py-6 flex items-center justify-between text-left group"
                aria-expanded={isOpen}
            >
                <span className={cn(
                    "font-serif text-lg md:text-xl transition-colors duration-300",
                    isOpen ? "text-heritage-gold" : "text-emerald-royal group-hover:text-heritage-gold"
                )}>
                    {question}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full border border-heritage-gold/20 flex items-center justify-center transition-all duration-500",
                    isOpen ? "bg-heritage-gold border-transparent rotate-180" : "bg-transparent group-hover:border-heritage-gold"
                )}>
                    <ChevronDown size={16} className={cn(
                        "transition-colors",
                        isOpen ? "text-white" : "text-heritage-gold"
                    )} />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="pb-8 text-emerald-royal/60 text-sm md:text-base leading-relaxed font-light max-w-2xl">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function FAQPage() {
    const [openIndex, setOpenIndex] = React.useState(null);

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
                        Knowledge Sanctuary
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-serif leading-tight"
                    >
                        Common <span className="heritage-gradient-text italic">Curiosities</span>
                    </motion.h1>
                </div>
            </section>

            {/* FAQ Sections */}
            <section className="py-24 max-w-4xl mx-auto px-4 md:px-6">
                <div className="space-y-20">
                    {faqCategories.map((category, catIdx) => (
                        <motion.div
                            key={catIdx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIdx * 0.1 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4 border-b border-heritage-gold/20 pb-4">
                                <span className="text-2xl">{category.icon}</span>
                                <h2 className="font-serif text-2xl md:text-3xl text-emerald-royal tracking-wide">
                                    {category.title}
                                </h2>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-4 md:p-8 royal-shadow border border-heritage-gold/5">
                                {category.questions.map((faq, qIdx) => {
                                    const uniqueIdx = `${catIdx}-${qIdx}`;
                                    return (
                                        <AccordionItem
                                            key={qIdx}
                                            question={faq.q}
                                            answer={faq.a}
                                            isOpen={openIndex === uniqueIdx}
                                            onClick={() => setOpenIndex(openIndex === uniqueIdx ? null : uniqueIdx)}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-emerald-royal text-white text-center relative overflow-hidden mx-4 md:mx-10 rounded-[4rem] mb-20 shadow-2xl">
                <div className="absolute inset-0 opacity-[0.03] jamdani-pattern pointer-events-none"></div>
                <div className="relative z-10 space-y-8 max-w-2xl mx-auto px-6">
                    <h2 className="text-3xl md:text-4xl font-serif leading-tight">Can't find the answer you seek?</h2>
                    <p className="text-muslin-cream/60 font-light">Our royal concierges are available 24/7 to assist you with any heritage inquiries.</p>
                    <Link
                        href="/contact"
                        className="inline-block bg-heritage-gold text-white px-12 py-5 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs hover:bg-white hover:text-emerald-royal transition-all duration-700 gold-gradient-bg shadow-xl"
                    >
                        Contact Royal Support
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}

// Add necessary imports at the top
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}
