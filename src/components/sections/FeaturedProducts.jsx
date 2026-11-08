"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/product/ProductCard";

import { api } from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";

export function FeaturedProducts() {
    const [filter, setFilter] = useState("All");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    React.useEffect(() => {
        const loadProducts = async () => {
            const data = await api.getProducts();
            if (Array.isArray(data)) {
                // Prefer pieces flagged as featured in the admin panel; fall back to everything
                const featured = data.filter((p) => p.is_featured);
                setProducts(featured.length > 0 ? featured : data);
            }
            setLoading(false);
        };
        loadProducts();
    }, []);

    const categoryName = (p) => p.category?.name || p.category;
    // Tabs come from the categories actually present (up to three)
    const tabs = ["All", ...Array.from(new Set(products.map(categoryName).filter(Boolean))).slice(0, 3)];

    const filteredProducts =
        filter === "All"
            ? products
            : products.filter((p) => categoryName(p) === filter);

    const visibleProducts = isExpanded ? filteredProducts : filteredProducts.slice(0, 4);

    return (
        <section id="featured" className="py-16 md:py-24 bg-muslin-cream">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                    >
                        <span className="text-heritage-gold text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
                            Our Best Styles
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif mt-2 md:mt-3 text-emerald-royal text-center md:text-left">
                            Special For You
                        </h2>
                    </motion.div>
                    {/* Filter Buttons */}
                    <div className="flex space-x-4 md:space-x-8 mt-8 md:mt-0 overflow-x-auto pb-4 md:pb-0 w-full md:w-auto justify-center md:justify-end no-scrollbar">
                        {tabs.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => { setFilter(cat); setIsExpanded(false); }}
                                className={`text-[10px] md:text-xs uppercase tracking-widest border-b-2 transition-colors pb-2 whitespace-nowrap ${filter === cat
                                    ? "border-heritage-gold text-emerald-royal font-bold"
                                    : "border-transparent text-emerald-royal/40 hover:text-emerald-royal"
                                    }`}
                                aria-pressed={filter === cat}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid - Optimized for Mobile */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-0">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : visibleProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-0">
                        {visibleProducts.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index}
                                priority={index < 2}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-400 italic font-light">
                        The treasure chamber is empty for this category.
                    </div>
                )}

                {!isExpanded && !loading && filteredProducts.length > 4 && (
                    <div className="text-center mt-12 md:mt-16">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full md:w-auto px-10 py-4 bg-emerald-royal text-white uppercase tracking-widest text-[10px] md:text-xs hover:bg-heritage-gold transition-all font-bold shadow-xl"
                        >
                            See Every Royal Style
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
