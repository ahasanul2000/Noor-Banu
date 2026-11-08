"use client";

import React from "react";
import { api } from "@/lib/api";
import { ProductCard } from "./ProductCard";
import { motion } from "framer-motion";

/**
 * Pieces related to `product`. Pass `products` when they were fetched on the server;
 * otherwise they are loaded from the API on the client.
 */
export function RelatedProducts({ product, products }) {
    const productId = product?.id;
    const [fetched, setFetched] = React.useState(null);

    React.useEffect(() => {
        if (products !== undefined || !productId) return;
        let cancelled = false;
        api.getRelatedProducts(productId).then((data) => {
            if (!cancelled) setFetched(data || []);
        });
        return () => {
            cancelled = true;
        };
    }, [productId, products]);

    const related = (products ?? fetched ?? [])
        .filter((p) => p.id !== productId)
        .slice(0, 4);

    if (related.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-muslin-cream border-t border-heritage-gold/5">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="mb-10 md:mb-12 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-heritage-gold text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-bold">
                            Heirlooms You May Treasure
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif mt-2 md:mt-3 text-emerald-royal">
                            Heritage Pairings
                        </h2>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {related.map((item, index) => (
                        <ProductCard key={item.id} product={item} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
