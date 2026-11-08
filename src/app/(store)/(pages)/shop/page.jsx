"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductCard } from "@/components/product/ProductCard";
import { WishlistModal } from "@/components/ui/WishlistModal";
import { Toast } from "@/components/ui/Toast";

import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import Skeleton from "@/components/ui/Skeleton";

const PER_PAGE = 12;
const FILTER_KEYS = ["category", "search", "sort", "min_price", "max_price", "on_sale"];
const SORT_OPTIONS = [
    { value: "", label: "Featured" },
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
];

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/** Page numbers with gaps, e.g. [1, "…", 4, 5, 6, "…", 12] */
function pageWindow(current, last) {
    const pages = [];
    for (let p = 1; p <= last; p++) {
        if (p === 1 || p === last || Math.abs(p - current) <= 1) {
            pages.push(p);
        } else if (pages[pages.length - 1] !== "…") {
            pages.push("…");
        }
    }
    return pages;
}

const labelClass = "block text-[10px] uppercase tracking-[0.3em] font-bold text-heritage-gold mb-4";
const inputClass = "w-full bg-white border border-heritage-gold/20 px-4 py-3 text-sm text-emerald-royal outline-none focus:border-heritage-gold transition-colors rounded-lg";

/**
 * Search, categories, price range and the sale toggle. Text inputs are uncontrolled and
 * re-mount (via `key`) whenever the URL changes, so "Clear filters" resets them.
 */
function FilterPanel({ filters, categories, onChange }) {
    // Rendered twice (sidebar + mobile panel), so ids must be unique per instance
    const id = React.useId();

    const submitSearch = (e) => {
        e.preventDefault();
        onChange({ search: new FormData(e.currentTarget).get("search")?.toString().trim() });
    };

    const submitPrice = (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        onChange({
            min_price: data.get("min_price")?.toString().trim(),
            max_price: data.get("max_price")?.toString().trim(),
        });
    };

    return (
        <div className="space-y-10">
            {/* Search */}
            <form onSubmit={submitSearch} key={`search-${filters.search}`} role="search">
                <label htmlFor={`${id}-search`} className={labelClass}>Search</label>
                <div className="relative">
                    <input
                        id={`${id}-search`}
                        name="search"
                        type="search"
                        defaultValue={filters.search}
                        placeholder="Saree, kurti, lehenga…"
                        className={cn(inputClass, "pr-11")}
                    />
                    <button
                        type="submit"
                        aria-label="Search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-royal/50 hover:text-heritage-gold transition-colors"
                    >
                        <Search size={18} />
                    </button>
                </div>
            </form>

            {/* Categories */}
            <div>
                <span className={labelClass}>Collections</span>
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => onChange({ category: "" })}
                            className={cn(
                                "w-full flex justify-between items-center py-2 text-sm transition-colors text-left",
                                !filters.category ? "text-emerald-royal font-bold" : "text-emerald-royal/50 hover:text-emerald-royal"
                            )}
                        >
                            All pieces
                        </button>
                    </li>
                    {categories.map((cat) => (
                        <li key={cat.slug}>
                            <button
                                onClick={() => onChange({ category: cat.slug })}
                                aria-pressed={filters.category === cat.slug}
                                className={cn(
                                    "w-full flex justify-between items-center py-2 text-sm transition-colors text-left",
                                    filters.category === cat.slug ? "text-emerald-royal font-bold" : "text-emerald-royal/50 hover:text-emerald-royal"
                                )}
                            >
                                <span>{cat.name}</span>
                                <span className="text-[10px] text-heritage-gold/70 font-bold">{cat.products_count ?? ""}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Price range */}
            <form onSubmit={submitPrice} key={`price-${filters.min_price}-${filters.max_price}`}>
                <span className={labelClass}>Price (৳)</span>
                <div className="flex items-center gap-2">
                    <input
                        name="min_price"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        defaultValue={filters.min_price}
                        placeholder="Min"
                        aria-label="Minimum price"
                        className={inputClass}
                    />
                    <span className="text-emerald-royal/30">–</span>
                    <input
                        name="max_price"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        defaultValue={filters.max_price}
                        placeholder="Max"
                        aria-label="Maximum price"
                        className={inputClass}
                    />
                </div>
                <button
                    type="submit"
                    className="mt-3 w-full border border-emerald-royal text-emerald-royal py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-emerald-royal hover:text-white transition-colors rounded-lg"
                >
                    Apply price
                </button>
            </form>

            {/* On sale */}
            <div className="flex items-center justify-between gap-4">
                <span id={`${id}-sale`} className="text-[10px] uppercase tracking-[0.3em] font-bold text-heritage-gold">On sale only</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={filters.on_sale}
                    aria-labelledby={`${id}-sale`}
                    onClick={() => onChange({ on_sale: filters.on_sale ? "" : "1" })}
                    className={cn(
                        "relative w-12 h-6 rounded-full transition-colors",
                        filters.on_sale ? "bg-emerald-royal" : "bg-heritage-gold/20"
                    )}
                >
                    <span
                        className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                            filters.on_sale && "translate-x-6"
                        )}
                    />
                </button>
            </div>
        </div>
    );
}

function ShopCatalogue() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const resultsRef = React.useRef(null);

    const filters = {
        category: searchParams.get("category") || "",
        search: searchParams.get("search") || "",
        sort: searchParams.get("sort") || "",
        min_price: searchParams.get("min_price") || "",
        max_price: searchParams.get("max_price") || "",
        on_sale: searchParams.get("on_sale") === "1",
    };
    const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
    const queryKey = searchParams.toString();

    const [categories, setCategories] = React.useState([]);
    const [result, setResult] = React.useState({ key: null, products: [], meta: null });
    const [filtersOpen, setFiltersOpen] = React.useState(false);

    React.useEffect(() => {
        api.getCategories().then((data) => setCategories(Array.isArray(data) ? data : []));
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        const params = Object.fromEntries(new URLSearchParams(queryKey));
        api.searchProducts({ ...params, per_page: PER_PAGE }).then((res) => {
            if (cancelled) return;
            setResult({
                key: queryKey,
                products: Array.isArray(res?.data) ? res.data : [],
                meta: res?.meta || null,
            });
        });
        return () => {
            cancelled = true;
        };
    }, [queryKey]);

    const loading = result.key !== queryKey;
    const { products, meta } = result;
    const total = meta?.total ?? products.length;
    const lastPage = meta?.last_page ?? 1;

    /** Merge changes into the URL; any filter change sends the shopper back to page 1. */
    const updateParams = (changes, { resetPage = true } = {}) => {
        const next = new URLSearchParams(searchParams.toString());
        Object.entries(changes).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "" || value === false) next.delete(key);
            else next.set(key, String(value));
        });
        if (resetPage) next.delete("page");
        const qs = next.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    const goToPage = (p) => {
        updateParams({ page: p > 1 ? p : "" }, { resetPage: false });
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const clearFilters = () => router.push(pathname, { scroll: false });

    const activeCategory = categories.find((c) => c.slug === filters.category);
    const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

    // Removable chips for each active filter
    const chips = [
        filters.category && { key: "category", label: activeCategory?.name || filters.category },
        filters.search && { key: "search", label: `“${filters.search}”` },
        filters.min_price && { key: "min_price", label: `From ${formatPrice(filters.min_price)}` },
        filters.max_price && { key: "max_price", label: `Up to ${formatPrice(filters.max_price)}` },
        filters.on_sale && { key: "on_sale", label: "On sale" },
    ].filter(Boolean);

    const title = activeCategory?.name || (filters.search ? "Search Results" : "The Royal Boutique");
    const subtitle = filters.search ? `Results for “${filters.search}”` : "Heirlooms of Mother Bengal";

    return (
        <>
            <SectionHeader title={title} subtitle={subtitle} />

            <section ref={resultsRef} className="pt-8 pb-12 md:pt-10 md:pb-20 max-w-7xl mx-auto px-4 md:px-6 scroll-mt-[calc(var(--nav-h)+1rem)]">
                {/* Mobile category chips */}
                {categories.length > 0 && (
                    <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4">
                        {[{ slug: "", name: "All" }, ...categories].map((cat) => (
                            <button
                                key={cat.slug || "all"}
                                onClick={() => updateParams({ category: cat.slug })}
                                className={cn(
                                    "flex-shrink-0 px-5 py-2 rounded-full border text-[10px] uppercase tracking-widest font-bold transition-colors",
                                    filters.category === cat.slug
                                        ? "bg-emerald-royal border-emerald-royal text-white"
                                        : "bg-white border-heritage-gold/20 text-emerald-royal"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-28">
                            <FilterPanel filters={filters} categories={categories} onChange={updateParams} />
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-10 text-[10px] uppercase tracking-widest font-bold text-deep-maroon hover:text-heritage-gold transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </aside>

                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <p className="text-gray-500 font-light italic" aria-live="polite">
                                {loading
                                    ? "Gathering heirlooms…"
                                    : `${total} heritage ${total === 1 ? "piece" : "pieces"}`}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFiltersOpen((open) => !open)}
                                    aria-expanded={filtersOpen}
                                    aria-controls="mobile-filters"
                                    className="lg:hidden flex items-center gap-2 bg-white border border-heritage-gold/20 px-4 py-2 text-xs uppercase tracking-widest text-emerald-royal hover:border-heritage-gold transition-colors"
                                >
                                    <SlidersHorizontal size={14} />
                                    Filters{chips.length > 0 && ` (${chips.length})`}
                                </button>
                                <select
                                    value={filters.sort}
                                    onChange={(e) => updateParams({ sort: e.target.value })}
                                    aria-label="Sort products"
                                    className="flex-1 sm:flex-none bg-white border border-heritage-gold/20 px-4 md:px-6 py-2 text-xs uppercase tracking-widest outline-none cursor-none md:cursor-pointer hover:border-heritage-gold transition-colors text-emerald-royal"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.value ? opt.label : "Sort: Featured"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Mobile filter panel */}
                        <AnimatePresence initial={false}>
                            {filtersOpen && (
                                <motion.div
                                    id="mobile-filters"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="lg:hidden overflow-hidden"
                                >
                                    <div className="bg-white/70 border border-heritage-gold/10 rounded-2xl p-6 mb-8">
                                        <FilterPanel filters={filters} categories={categories} onChange={updateParams} />
                                        <div className="flex gap-3 mt-8">
                                            {hasFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="flex-1 border border-deep-maroon/30 text-deep-maroon py-3 text-[10px] uppercase tracking-widest font-bold rounded-lg"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setFiltersOpen(false)}
                                                className="flex-1 bg-emerald-royal text-white py-3 text-[10px] uppercase tracking-widest font-bold rounded-lg"
                                            >
                                                Show {loading ? "" : total} results
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Active filter chips */}
                        {chips.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-8">
                                {chips.map((chip) => (
                                    <button
                                        key={chip.key}
                                        onClick={() => updateParams({ [chip.key]: "" })}
                                        className="flex items-center gap-2 bg-emerald-royal/5 border border-emerald-royal/10 text-emerald-royal px-3 py-1.5 rounded-full text-xs hover:bg-emerald-royal/10 transition-colors"
                                        aria-label={`Remove filter ${chip.label}`}
                                    >
                                        {chip.label}
                                        <X size={12} />
                                    </button>
                                ))}
                                <button
                                    onClick={clearFilters}
                                    className="text-[10px] uppercase tracking-widest font-bold text-deep-maroon hover:text-heritage-gold transition-colors ml-2"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {/* Results */}
                        {loading ? (
                            <ProductGridSkeleton />
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 px-6 bg-white/60 rounded-2xl border border-heritage-gold/10">
                                <p className="font-serif text-2xl text-emerald-royal mb-3">No pieces found</p>
                                <p className="text-gray-500 font-light mb-8">
                                    Try a different search or loosen your filters to discover more heirlooms.
                                </p>
                                {hasFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-8 py-3 bg-emerald-royal text-white uppercase tracking-widest text-xs font-bold hover:bg-heritage-gold transition-colors shadow-lg"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} index={index} priority={index < 3} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && lastPage > 1 && (
                            <nav className="flex items-center justify-center gap-2 mt-16" aria-label="Pagination">
                                <button
                                    onClick={() => goToPage(page - 1)}
                                    disabled={page <= 1}
                                    aria-label="Previous page"
                                    className="w-10 h-10 rounded-full border border-heritage-gold/20 flex items-center justify-center text-emerald-royal bg-white hover:bg-emerald-royal hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                {pageWindow(page, lastPage).map((p, i) =>
                                    p === "…" ? (
                                        <span key={`gap-${i}`} className="w-6 text-center text-emerald-royal/40">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p)}
                                            aria-current={p === page ? "page" : undefined}
                                            className={cn(
                                                "w-10 h-10 rounded-full text-xs font-bold transition-colors",
                                                p === page
                                                    ? "bg-emerald-royal text-white shadow-lg"
                                                    : "text-emerald-royal hover:bg-heritage-gold/10"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => goToPage(page + 1)}
                                    disabled={page >= lastPage}
                                    aria-label="Next page"
                                    className="w-10 h-10 rounded-full border border-heritage-gold/20 flex items-center justify-center text-emerald-royal bg-white hover:bg-emerald-royal hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </nav>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}

export default function ShopPage() {
    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <Suspense
                fallback={
                    <>
                        <SectionHeader title="The Royal Boutique" subtitle="Heirlooms of Mother Bengal" />
                        <section className="pt-8 pb-12 md:pt-10 md:pb-20 max-w-7xl mx-auto px-4 md:px-6">
                            <ProductGridSkeleton />
                        </section>
                    </>
                }
            >
                <ShopCatalogue />
            </Suspense>
            <Footer />
            <WishlistModal />
            <Toast />
        </main>
    );
}
