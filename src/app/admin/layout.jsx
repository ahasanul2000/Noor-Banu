import { Playfair_Display, Lato } from "next/font/google";
import "../globals.css";
import "./admin.css";

// The admin panel has its own root layout: none of the storefront's preloader, custom cursor
// or chat widget, and it is never indexed by search engines.
const playfair = Playfair_Display({ variable: "--font-serif", subsets: ["latin"], display: "swap" });
const lato = Lato({ variable: "--font-sans", subsets: ["latin"], weight: ["300", "400", "700"], display: "swap" });

export const metadata = {
    title: { default: "Noor Banu Admin", template: "%s · Noor Banu Admin" },
    robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${playfair.variable} ${lato.variable} font-sans antialiased bg-stone-100 text-stone-800`}>
                {children}
            </body>
        </html>
    );
}
