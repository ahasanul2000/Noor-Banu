"use client";

import React from "react";
import { Gem, Crown, ShieldHalf, Truck } from "lucide-react";
import { motion } from "framer-motion";

import { api } from "@/lib/api";

const ICON_MAP = {
    gem: Gem,
    crown: Crown,
    shield: ShieldHalf,
    truck: Truck,
};

export function Features() {
    const [features, setFeatures] = React.useState([]);

    React.useEffect(() => {
        const loadFeatures = async () => {
            const data = await api.getFeatures();
            if (data) setFeatures(data);
        };
        loadFeatures();
    }, []);

    if (features.length === 0) return null;
    return (
        <section id="about" className="py-20 md:py-32 bg-emerald-royal text-white relative overflow-hidden">
            {/* Subtle Jamdani Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.05] jamdani-pattern pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 text-center">
                    {features.map((feature, index) => {
                        const IconComponent = ICON_MAP[feature.icon] || Gem;
                        return (
                            <motion.div
                                key={feature.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="space-y-5 md:space-y-6 group"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center group-hover:bg-heritage-gold transition-all duration-500 border border-white/10 group-hover:border-transparent group-hover:shadow-2xl">
                                    <IconComponent size={32} className="text-heritage-gold group-hover:text-white transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-serif text-xl md:text-2xl tracking-wide">{feature.title}</h3>
                                    <p className="text-muslin-cream/60 text-xs md:text-sm leading-relaxed px-2 md:px-0 font-light">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
