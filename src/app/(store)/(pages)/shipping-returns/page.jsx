"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ShippingPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <SectionHeader title="Global Sovereignty" subtitle="Shipping & Returns" />
            <section className="py-20 max-w-3xl mx-auto px-4 md:px-6 space-y-12">
                <div className="space-y-6">
                    <h2 className="font-serif text-3xl">Shipping Policy</h2>
                    <p className="text-gray-500 font-light leading-relaxed">
                        Every Noor Banu order is treated with the utmost care and respect. We offer complimentary express shipping on all orders over $500. For all other orders, a flat-rate premium shipping fee applies based on your location.
                    </p>
                    <ul className="list-disc list-inside text-gray-500 font-light space-y-2">
                        <li>Domestic (France): 1-2 Business Days</li>
                        <li>European Union: 2-4 Business Days</li>
                        <li>International: 3-7 Business Days</li>
                    </ul>
                </div>
                <div className="space-y-6">
                    <h2 className="font-serif text-3xl">Returns & Exchanges</h2>
                    <p className="text-gray-500 font-light leading-relaxed">
                        If your purchase does not meet your expectations, you may return it within 14 days of receipt. Please ensure items are in their original condition. Bespoke and intimate apparel items are final sale.
                    </p>
                </div>
            </section>
            <Footer />
        </main>
    );
}
