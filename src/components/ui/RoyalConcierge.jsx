"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

export function RoyalConcierge() {
    const [settings, setSettings] = useState({
        concierge_phone: "+8801700000000",
        concierge_whatsapp: "8801700000000"
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const data = await api.getSettings();
                if (data) {
                    setSettings({
                        concierge_phone: data.concierge_phone || "+8801700000000",
                        concierge_whatsapp: data.concierge_whatsapp || "8801700000000"
                    });
                }
            } catch (error) {
                console.error("Failed to load concierge settings:", error);
            }
        }
        loadSettings();
    }, []);

    return (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[80] flex flex-col gap-4">
            {/* Calling Support Bubble */}
            <motion.a
                href={`tel:${settings.concierge_phone}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 3, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-12 h-12 md:w-14 md:h-14 bg-emerald-royal flex items-center justify-center rounded-full shadow-[0_15px_35px_rgba(6,78,59,0.3)] border border-white/10 backdrop-blur-md"
                title="Call Concierge"
            >
                {/* Glow Aura */}
                <div className="absolute inset-0 bg-emerald-royal/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <i className="fas fa-phone-alt text-white text-lg md:text-xl relative z-10" />
            </motion.a>

            {/* Chat/WhatsApp Bubble */}
            <motion.a
                href={`https://wa.me/${settings.concierge_whatsapp.replace(/\+/g, '')}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 3.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-12 h-12 md:w-14 md:h-14 bg-heritage-gold flex items-center justify-center rounded-full shadow-[0_15px_35px_rgba(153,101,21,0.3)] border border-white/10 backdrop-blur-md"
                title="Chat with Royal Concierge"
            >
                {/* Glow Aura */}
                <div className="absolute inset-0 bg-heritage-gold/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <i className="fab fa-whatsapp text-white text-xl md:text-2xl relative z-10" />
            </motion.a>
        </div>
    );
}
