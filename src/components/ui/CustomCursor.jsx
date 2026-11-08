"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { stiffness: 600, damping: 30, mass: 0.4 };
    const springX = useSpring(cursorX, springConfig);
    const springY = useSpring(cursorY, springConfig);

    const outerSpringConfig = { stiffness: 120, damping: 18, mass: 0.6 };
    const outerSpringX = useSpring(cursorX, outerSpringConfig);
    const outerSpringY = useSpring(cursorY, outerSpringConfig);

    const glowSpringConfig = { stiffness: 80, damping: 20, mass: 1.2 };
    const glowSpringX = useSpring(cursorX, glowSpringConfig);
    const glowSpringY = useSpring(cursorY, glowSpringConfig);

    const [isHovering, setIsHovering] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        // Detect touch device
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
        const updateMousePosition = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseLeave = () => setIsVisible(false);

        // Track hovering over interactive elements
        const handleMouseOver = (e) => {
            const target = e.target;
            const isInteractive =
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.closest("a") ||
                target.closest("button") ||
                target.style.cursor === "pointer" ||
                window.getComputedStyle(target).cursor === "pointer";

            setIsHovering(isInteractive);
        };

        window.addEventListener("mousemove", updateMousePosition);
        document.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
            document.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    // Don't render on touch devices or when not visible
    if (isTouchDevice || !isVisible) return null;

    return (
        <>
            {/* Trailing glow effect */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9997]"
                style={{
                    x: glowSpringX,
                    y: glowSpringY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 2 : 1,
                    opacity: isHovering ? 0.3 : 0.15,
                }}
            >
                <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-heritage-gold/40 to-emerald-royal/20 blur-xl" />
            </motion.div>

            {/* Main cursor dot */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999]"
                style={{
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 0 : 1,
                }}
            >
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-heritage-gold shadow-lg" />
            </motion.div>

            {/* Outer ring with gradient */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9998]"
                style={{
                    x: outerSpringX,
                    y: outerSpringY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
                animate={{
                    scale: isHovering ? 1.8 : 1,
                    rotate: isHovering ? 90 : 0,
                }}
            >
                <div
                    className={`w-12 h-12 rounded-full border-2 transition-all duration-500 ${isHovering
                        ? "border-heritage-gold bg-gradient-to-br from-heritage-gold/20 to-emerald-royal/10 shadow-xl shadow-heritage-gold/20"
                        : "border-heritage-gold/50 bg-transparent"
                        }`}
                    style={{
                        background: isHovering
                            ? "radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(0,71,58,0.05) 100%)"
                            : "transparent",
                    }}
                />
            </motion.div>

            {/* Inner pulse ring on hover */}
            {isHovering && (
                <motion.div
                    className="fixed top-0 left-0 pointer-events-none z-[9997]"
                    initial={{ scale: 0.5, opacity: 0 }}
                    style={{
                        x: cursorX,
                        y: cursorY,
                        translateX: "-50%",
                        translateY: "-50%",
                    }}
                    animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.6, 0.2, 0.6],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div className="w-8 h-8 rounded-full border border-heritage-gold/40" />
                </motion.div>
            )}
        </>
    );
}
