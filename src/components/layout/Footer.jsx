"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, MapPin, Phone, Mail, MessageCircle } from "lucide-react";

import { useStore } from "@/context/StoreContext";

export function Footer() {
    // Settings are loaded once by the StoreProvider (may be {} for a moment).
    const { settings = {} } = useStore();

    const socialLinks = {
        instagram: settings.instagram_url || "#",
        facebook: settings.facebook_link || settings.facebook_url || "#",
    };

    const contactInfo = {
        address: settings.contact_address || settings.site_address || "Gulshan-2, Dhaka, Bangladesh",
        phone: settings.contact_phone || settings.site_phone || "+880 1234 567890",
        email: settings.contact_email || settings.site_email || "legacy@noorbanu.com",
        whatsapp: settings.whatsapp_number || "",
    };
    const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, "")}`;
    return (
        <footer className="bg-emerald-royal text-white pt-20 md:pt-32 pb-12 relative overflow-hidden border-t-2 border-heritage-gold/20">
            {/* Subtle Jamdani Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] jamdani-pattern pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-20 mb-20 text-center sm:text-left relative z-10">
                {/* Brand */}
                <div className="col-span-1 flex flex-col items-center sm:items-start">
                    <div className="relative h-[80px] w-[140px] md:h-[100px] md:w-[150px] mb-8">
                        <Image
                            src="/img/logo.png"
                            alt="Noor Banu Dhaka"
                            fill
                            loading="lazy"
                            sizes="(max-width: 768px) 140px, 150px"
                            className="object-contain"
                        />
                    </div>
                    <p className="text-muslin-cream/60 text-sm leading-relaxed mb-8 max-w-xs font-light">
                        Bringing back the best of Dhaka heritage. We make beautiful clothes for the modern monarch. Made in Dhaka, delivered to your home with love.
                    </p>
                    <div className="flex space-x-6">
                        <a
                            href={socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-heritage-gold transition-all duration-500 border border-white/10 hover:border-transparent group shadow-2xl"
                            aria-label="Follow Noor Banu on Instagram"
                        >
                            <Instagram size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                        <a
                            href={socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-heritage-gold transition-all duration-500 border border-white/10 hover:border-transparent group shadow-2xl"
                            aria-label="Follow Noor Banu on Facebook"
                        >
                            <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    </div>
                </div>

                {/* Links */}
                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="font-serif text-xl mb-8 text-heritage-gold tracking-wide">Royal Boutique</h4>
                    <ul className="space-y-5 text-muslin-cream/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
                        <li>
                            <Link href="/shop" className="hover:text-heritage-gold transition-colors">
                                New Collections
                            </Link>
                        </li>
                        <li>
                            <Link href="/shop?category=jamdani" className="hover:text-heritage-gold transition-colors">
                                Monarch Jamdani
                            </Link>
                        </li>
                        <li>
                            <Link href="/shop?category=muslin" className="hover:text-heritage-gold transition-colors">
                                Imperial Muslin
                            </Link>
                        </li>
                        <li>
                            <Link href="/shop?category=silk" className="hover:text-heritage-gold transition-colors">
                                Rajshahi Silk
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Help */}
                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="font-serif text-xl mb-8 text-heritage-gold tracking-wide">Talk To Us</h4>
                    <ul className="space-y-5 text-muslin-cream/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
                        <li>
                            <Link href="/contact" className="hover:text-heritage-gold transition-colors">
                                Message Us
                            </Link>
                        </li>
                        <li>
                            <Link href="/track-order" className="hover:text-heritage-gold transition-colors">
                                Track your order
                            </Link>
                        </li>
                        <li>
                            <Link href="/shipping-returns" className="hover:text-heritage-gold transition-colors">
                                Delivery Info
                            </Link>
                        </li>
                        <li>
                            <Link href="/size-guide" className="hover:text-heritage-gold transition-colors">
                                Size Helper
                            </Link>
                        </li>
                        <li>
                            <Link href="/faq" className="hover:text-heritage-gold transition-colors">
                                Questions?
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="font-serif text-xl mb-8 text-heritage-gold tracking-wide">Find Us</h4>
                    <ul className="space-y-6 text-muslin-cream/60 text-sm font-light">
                        <li className="flex items-start justify-center sm:justify-start gap-5">
                            <MapPin size={22} className="text-heritage-gold flex-shrink-0" />
                            <span>{contactInfo.address}</span>
                        </li>
                        <li className="flex items-center justify-center sm:justify-start gap-5">
                            <Phone size={22} className="text-heritage-gold flex-shrink-0" />
                            <a href={telHref(contactInfo.phone)} className="hover:text-heritage-gold transition-colors">{contactInfo.phone}</a>
                        </li>
                        {contactInfo.whatsapp && (
                            <li className="flex items-center justify-center sm:justify-start gap-5">
                                <MessageCircle size={22} className="text-heritage-gold flex-shrink-0" />
                                <a
                                    href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-heritage-gold transition-colors"
                                >
                                    WhatsApp {contactInfo.whatsapp}
                                </a>
                            </li>
                        )}
                        <li className="flex items-center justify-center sm:justify-start gap-5">
                            <Mail size={22} className="text-heritage-gold flex-shrink-0" />
                            <a href={`mailto:${contactInfo.email}`} className="hover:text-heritage-gold transition-colors break-all">{contactInfo.email}</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-white/5 pt-12 text-center px-4 relative z-10">
                <p className="text-muslin-cream/30 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold leading-loose">
                    &copy; {new Date().getFullYear()} Noor Banu Palace • Dhaka. Crafted for the Nawabi Spirit.
                </p>
            </div>
        </footer>
    );
}
