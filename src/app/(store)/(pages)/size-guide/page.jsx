"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function SizeGuidePage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <SectionHeader title="Perfect Proportion" subtitle="Size Guide" />
            <section className="py-20 max-w-4xl mx-auto px-4 md:px-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="py-4 text-xs uppercase tracking-widest font-bold text-gray-400">Size</th>
                                <th className="py-4 text-xs uppercase tracking-widest font-bold text-gray-400">Bust (in)</th>
                                <th className="py-4 text-xs uppercase tracking-widest font-bold text-gray-400">Waist (in)</th>
                                <th className="py-4 text-xs uppercase tracking-widest font-bold text-gray-400">Hips (in)</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-500 font-light hover:[&>tr]:bg-rose-50 [&>tr]:transition-colors">
                            <tr className="border-b border-gray-100 italic">
                                <td className="py-6">XS (Royal 0)</td>
                                <td className="py-6">32-33</td>
                                <td className="py-6">24-25</td>
                                <td className="py-6">34-35</td>
                            </tr>
                            <tr className="border-b border-gray-100 italic">
                                <td className="py-6">S (Royal 2-4)</td>
                                <td className="py-6">34-35</td>
                                <td className="py-6">26-27</td>
                                <td className="py-6">36-37</td>
                            </tr>
                            <tr className="border-b border-gray-100 italic">
                                <td className="py-6">M (Royal 6-8)</td>
                                <td className="py-6">36-37</td>
                                <td className="py-6">28-29</td>
                                <td className="py-6">38-39</td>
                            </tr>
                            <tr className="border-b border-gray-100 italic">
                                <td className="py-6">L (Royal 10-12)</td>
                                <td className="py-6">38-40</td>
                                <td className="py-6">30-32</td>
                                <td className="py-6">40-42</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            <Footer />
        </main>
    );
}
