"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SEEN_KEY = "lc_preloaded";
// Long enough to read the logo, the name and the tagline in turn (it still shows only once per session).
const MIN_VISIBLE_MS = 3000;
const MAX_VISIBLE_MS = 3600;

export function Preloader() {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef(null);

    // Shown once per browser session, for about 3 seconds (logo → name → tagline), so first-time
    // visitors can read the brand without being held up on later pages. layout.jsx marks <html data-preloaded> before paint on later visits,
    // which hides the overlay via CSS so it doesn't flash.
    useEffect(() => {
        let seen = false;
        try {
            seen = sessionStorage.getItem(SEEN_KEY) === "1";
            sessionStorage.setItem(SEEN_KEY, "1");
        } catch { /* storage unavailable: just show it */ }
        if (seen) {
            // sessionStorage is only readable after mount.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            return;
        }
        setMounted(true);

        const start = Date.now();
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            // Keep it on screen briefly so the logo doesn't just blink.
            const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - start));
            setTimeout(() => {
                setProgress(100);
                setTimeout(() => setLoading(false), 350);
            }, wait);
        };

        // Fill the gold thread steadily over the ~3s the overlay is shown.
        const tick = setInterval(() => setProgress((p) => Math.min(90, p + 3)), 100);
        const maxTimer = setTimeout(finish, MAX_VISIBLE_MS);
        if (document.readyState === "complete") finish();
        else window.addEventListener("load", finish);

        return () => {
            clearInterval(tick);
            clearTimeout(maxTimer);
            window.removeEventListener("load", finish);
        };
    }, []);

    const title = "NOOR BANU";

    // Gold Dust Particles
    const particles = Array.from({ length: 20 });

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    key="preloader-overlay"
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        scale: 1.1,
                        filter: "blur(40px)",
                        pointerEvents: "none",
                        transition: { duration: 0.8, ease: [0.7, 0, 0.3, 1] }
                    }}
                    className="lc-preloader fixed inset-0 bg-[#080808] z-[99999] flex flex-col justify-center items-center overflow-hidden"
                >
                    {/* Cinematic Background Layers */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-radial-vignette opacity-40"></div>
                        <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-screen"></div>

                        {/* Drifting Gold Dust */}
                        {mounted && particles.map((_, i) => (
                            <motion.div
                                key={`dust-${i}`}
                                initial={{
                                    x: `${(i * 37) % 100}%`,
                                    y: `${(i * 53) % 100}%`,
                                    opacity: 0
                                }}
                                animate={{
                                    y: ["-10%", "110%"],
                                    x: ["-5%", "5%"],
                                    opacity: [0, 0.4, 0],
                                    scale: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 4 + (i % 5),
                                    repeat: Infinity,
                                    delay: (i % 10) * 0.08,
                                    ease: "linear"
                                }}
                                className="absolute w-[2px] h-[2px] bg-heritage-gold rounded-full blur-[1px]"
                            />
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-8" ref={containerRef}>
                        {/* Elite Logo Reveal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(20px)" }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-40 h-40 md:w-56 md:h-56 mb-16"
                        >
                            {/* Inner Aura */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 bg-heritage-gold/20 blur-[80px] rounded-full"
                            />

                            <Image
                                src="/img/logo.png"
                                alt="Noor Banu"
                                fill
                                className="object-contain drop-shadow-[0_0_30px_rgba(153,101,21,0.2)]"
                                priority
                            />
                        </motion.div>

                        {/* Archival Title Animation */}
                        <div className="relative overflow-hidden mb-6">
                            <motion.h1
                                initial={{ letterSpacing: "1.5em", opacity: 0, filter: "blur(10px)", x: "0.75em" }}
                                animate={{ letterSpacing: "0.6em", opacity: 1, filter: "blur(0px)", x: "0.3em" }}
                                transition={{ delay: 0.5, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                                className="font-serif text-3xl md:text-5xl text-heritage-gold font-medium tracking-[0.6em] whitespace-nowrap"
                            >
                                {title}
                            </motion.h1>
                        </div>

                        {/* Subtle Tagline */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.5, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.8 }}
                            className="flex items-center gap-4 mb-16"
                        >
                            <div className="w-8 h-[0.5px] bg-heritage-gold/30" />
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.8em] text-white/60 font-medium">
                                Heirlooms of Bengal
                            </p>
                            <div className="w-8 h-[0.5px] bg-heritage-gold/30" />
                        </motion.div>

                        {/* Perimeter Thread Loader */}
                        <div className="relative w-full h-[1px] bg-white/5 overflow-hidden">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: `${progress - 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-heritage-gold to-transparent opacity-80"
                            />
                            {/* Glow Tip */}
                            <motion.div
                                animate={{ left: `${progress}%` }}
                                className="absolute top-1/2 -translate-y-1/2 w-12 h-4 bg-heritage-gold/30 blur-md rounded-full"
                            />
                        </div>

                        {/* Descriptive Status */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.4, 0.2] }}
                            transition={{ delay: 1.8, duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                            className="mt-8 text-[8px] uppercase tracking-[0.6em] text-heritage-gold/50 font-bold"
                        >
                            Curating The Royal Collection
                        </motion.p>
                    </div>

                    {/* Elite Flash Effect on Mount */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.05, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-white pointer-events-none z-20"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
