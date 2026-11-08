import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};

const Skeleton = ({ className, variant = "default", ...props }) => {
    const variants = {
        default: "bg-neutral-200/50 dark:bg-neutral-800/50 animate-luxury-shimmer",
        gold: "bg-heritage-gold/5 animate-gold-shimmer",
        ivory: "bg-muslin-cream animate-luxury-shimmer",
        dark: "bg-luxury-black/60 animate-luxury-shimmer",
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg group",
                variants[variant] || variants.default,
                className
            )}
            {...props}
        >
            {/* 1. Texture Layer (Silk/Grain) */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-noise pointer-events-none" />

            {/* 2. Glassmorphism Depth Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none" />

            {/* 3. Royal Shimmering Border (Rim) */}
            <div className="absolute inset-0 rounded-lg royal-border-shimmer pointer-events-none" />

            {/* 4. Subtle Gloss Sweep Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none transition-opacity group-hover:opacity-60" />
        </div>
    );
};

export default Skeleton;
