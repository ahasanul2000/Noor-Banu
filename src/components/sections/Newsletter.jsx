"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function Newsletter() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState({ type: null, message: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: null, message: "" });

        try {
            const data = await api.subscribe(email);
            if (data) {
                setStatus({ type: "success", message: data.message });
                setEmail("");
            } else {
                setStatus({ type: "error", message: "The palace gates are temporarily unreachable." });
            }
        } catch (error) {
            setStatus({ type: "error", message: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-20 md:py-32 bg-emerald-royal relative overflow-hidden">
            {/* Subtle Jamdani Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] jamdani-pattern pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-px bg-heritage-gold/30 mx-auto mb-6"></div>
                        <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">Join My <span className="heritage-gradient-text italic">Royal Circle</span></h2>
                        <p className="text-muslin-cream/70 text-base md:text-lg font-light max-w-2xl mx-auto">Be honored with the first sightings of our new heritage collections and exclusive invitations.</p>
                    </div>

                    <form className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto group/form shadow-2xl royal-shadow" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Your royal email..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-white/5 border border-heritage-gold/20 px-8 py-5 outline-none focus:border-heritage-gold transition-all rounded-none text-white placeholder:text-muslin-cream/20 text-sm md:text-base backdrop-blur-md disabled:opacity-50"
                            required
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-heritage-gold text-white px-10 py-5 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs hover:bg-white hover:text-emerald-royal transition-all duration-700 rounded-none gold-gradient-bg disabled:opacity-70 flex items-center justify-center min-w-[180px]"
                        >
                            {submitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : "Accept Invitation"}
                        </button>
                    </form>
                    {status.message && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs uppercase tracking-widest font-bold ${status.type === "success" ? "text-heritage-gold" : "text-rose-400"}`}
                        >
                            {status.message}
                        </motion.p>
                    )}
                    <p className="text-[10px] uppercase tracking-widest text-muslin-cream/40 px-4">Experience the legacy. Unsubscribe at any time.</p>
                </motion.div>
            </div>
        </section>
    );
}
