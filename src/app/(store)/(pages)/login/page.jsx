"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthForm } from "@/components/account/AuthForm";

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            {/* useSearchParams (for ?next=) needs a Suspense boundary */}
            <Suspense fallback={<div className="min-h-[70vh]" />}>
                <AuthForm mode="login" />
            </Suspense>
            <Footer />
        </main>
    );
}
