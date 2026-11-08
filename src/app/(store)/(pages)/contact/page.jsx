"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <SectionHeader title="Talk To My Team" subtitle="We are here for you in Dhaka" />

            <section className="py-20 md:py-32 px-4 md:px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-5xl font-serif text-emerald-royal leading-tight">
                                Message my <br />
                                <span className="italic heritage-gradient-text">Nawabi Team</span>
                            </h2>
                            <p className="text-gray-600 font-light leading-relaxed text-lg max-w-md">
                                If you want a special dress or have a question, just send us a message. We love to help our royal family.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-start gap-6 group">
                                <div className="w-12 h-12 bg-emerald-royal/10 rounded-full flex items-center justify-center text-emerald-royal flex-shrink-0 group-hover:bg-emerald-royal group-hover:text-white transition-all duration-300">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h4 className="font-serif text-xl mb-1 text-luxury-black">Our Atelier</h4>
                                    <p className="text-emerald-royal/60 font-medium">Gulshan-2, Dhaka, Bangladesh</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-6 group">
                                <div className="w-12 h-12 bg-emerald-royal/10 rounded-full flex items-center justify-center text-emerald-royal flex-shrink-0 group-hover:bg-emerald-royal group-hover:text-white transition-all duration-300">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h4 className="font-serif text-xl mb-1 text-luxury-black">Direct Line</h4>
                                    <p className="text-emerald-royal/60 font-medium">+880 1234 567890</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-6 group">
                                <div className="w-12 h-12 bg-emerald-royal/10 rounded-full flex items-center justify-center text-emerald-royal flex-shrink-0 group-hover:bg-emerald-royal group-hover:text-white transition-all duration-300">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h4 className="font-serif text-xl mb-1 text-luxury-black">Royal Inquiries</h4>
                                    <p className="text-emerald-royal/60 font-medium">heritage@noorbanu.com</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-white p-6 md:p-12 rounded-2xl border border-heritage-gold/20 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-royal via-heritage-gold to-emerald-royal"></div>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/40">Your Full Name</label>
                                    <input type="text" className="w-full bg-muslin-cream/30 border border-heritage-gold/10 px-4 py-3 outline-none focus:border-heritage-gold transition-colors font-medium text-emerald-royal" placeholder="Enter your name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/40">Your Email</label>
                                    <input type="email" className="w-full bg-muslin-cream/30 border border-heritage-gold/10 px-4 py-3 outline-none focus:border-heritage-gold transition-colors font-medium text-emerald-royal" placeholder="email@heritage.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/40">What do you need?</label>
                                <select className="w-full bg-muslin-cream/30 border border-heritage-gold/10 px-4 py-3 outline-none focus:border-heritage-gold transition-colors appearance-none cursor-pointer font-medium text-emerald-royal">
                                    <option>I want a custom Jamdani</option>
                                    <option>Tell me about Muslin dresses</option>
                                    <option>Ask about Jewelry</option>
                                    <option>Other Royal help</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-emerald-royal/40">Your Message</label>
                                <textarea rows="4" className="w-full bg-muslin-cream/30 border border-heritage-gold/10 px-4 py-3 outline-none focus:border-heritage-gold transition-colors resize-none font-medium text-emerald-royal" placeholder="Write to us here..."></textarea>
                            </div>
                            <button className="w-full py-5 bg-emerald-royal text-white text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold hover:bg-heritage-gold transition-all duration-500 shadow-xl gold-gradient-bg">
                                Send My Message
                            </button>
                        </form>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
