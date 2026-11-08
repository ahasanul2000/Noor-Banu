import { Playfair_Display, Lato } from "next/font/google";
import "../globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { AuthProvider } from "@/context/AuthContext";
import { Preloader } from "@/components/layout/Preloader";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { RoyalConcierge } from "@/components/ui/RoyalConcierge";

const playfair = Playfair_Display({
    variable: "--font-serif",
    subsets: ["latin"],
    display: "swap",
    // Playfair Display is a variable font, so we don't need strict weights unless necessary
    fallback: ['Georgia', 'serif'],
});

const lato = Lato({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["300", "400", "700"],
    display: "swap",
    fallback: ['Arial', 'sans-serif'],
});

export const metadata = {
    title: {
        default: "Noor Banu | Heirlooms of Bengal",
        template: "%s | Noor Banu"
    },
    description: "Discover the lost grandeur of the Mughal looms. Dhaka's finest heritage fashion, reimagined for the modern monarch.",
    keywords: ["Noor Banu", "Heritage Fashion", "Dhakai Jamdani", "Muslin", "Rajshahi Silk", "Nakshi Kantha", "Luxury Fashion Bangladesh"],
    authors: [{ name: "Noor Banu Palace" }],
    creator: "Noor Banu Palace",
    publisher: "Noor Banu Palace",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://noorbanu.com'),
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: "Noor Banu | Heirlooms of Bengal",
        description: "Discover the lost grandeur of the Mughal looms. Reimagined for the modern monarch.",
        url: 'https://noorbanu.com',
        siteName: 'Noor Banu',
        images: [
            {
                url: '/brand-icon.png',
                width: 800,
                height: 800,
                alt: 'Noor Banu Heritage Logo',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Noor Banu | Heirlooms of Bengal',
        description: "Discover the lost grandeur of the Mughal looms.",
        images: ['/brand-icon.png'],
    },
    icons: {
        icon: "/brand-icon.png",
        apple: "/brand-icon.png",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    // Resource Hinting for Core Vitals
    other: {
        'preconnect': [
            'https://assets0.mirraw.com',
            'https://cdn11.bigcommerce.com',
            'https://www.mohifashion.com',
            'https://encrypted-tbn0.gstatic.com',
            'https://storage.googleapis.com'
        ],
        'dns-prefetch': [
            'https://assets0.mirraw.com',
            'https://cdn11.bigcommerce.com',
            'https://www.mohifashion.com',
            'https://encrypted-tbn0.gstatic.com',
            'https://storage.googleapis.com'
        ]
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="scroll-smooth" suppressHydrationWarning>
            <head>
                {/* Before first paint: skip the preloader if it already ran this session (see Preloader.jsx). */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: "try{if(sessionStorage.getItem('lc_preloaded')==='1')document.documentElement.setAttribute('data-preloaded','')}catch(e){}",
                    }}
                />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            </head>
            <body
                suppressHydrationWarning={true}
                className={`${playfair.variable} ${lato.variable} font-sans antialiased bg-muslin-cream text-emerald-royal selection:bg-heritage-gold/30 selection:text-emerald-royal overflow-x-hidden cursor-none`}
            >
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            "name": "Noor Banu",
                            "url": "https://noorbanu.com",
                            "logo": "https://noorbanu.com/brand-icon.png",
                            "description": "Dhaka's finest heritage fashion, reimagined for the modern monarch.",
                            "address": {
                                "@type": "PostalAddress",
                                "addressLocality": "Dhaka",
                                "addressCountry": "BD"
                            },
                            "sameAs": [
                                "https://instagram.com/NoorBanuDhaka"
                            ]
                        })
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            "name": "Noor Banu",
                            "url": "https://noorbanu.com",
                            "potentialAction": {
                                "@type": "SearchAction",
                                "target": "https://noorbanu.com/shop?search={search_term_string}",
                                "query-input": "required name=search_term_string"
                            }
                        })
                    }}
                />
                <AuthProvider>
                    <StoreProvider>
                        <Preloader />
                        <CustomCursor />
                        <RoyalConcierge />
                        {children}
                    </StoreProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
