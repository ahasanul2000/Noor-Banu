/** @type {import('next').NextConfig} */
const nextConfig = {
    // Lets a production build live next to a running `next dev` (e.g. NEXT_DIST_DIR=.next-prod).
    distDir: process.env.NEXT_DIST_DIR || ".next",
    reactCompiler: true,
    compress: true,
    poweredByHeader: false,
    // Prisma's driver adapter and pg must run as normal Node packages, not bundled.
    serverExternalPackages: ["@prisma/adapter-pg", "pg"],
    compiler: {
        // Keep console.error so server failures still show up in the Vercel logs.
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
    },
    images: {
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        minimumCacheTTL: 60,
        remotePatterns: [
            // Admin uploads in production (Vercel Blob).
            { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "www.mohifashion.com" },
            { protocol: "https", hostname: "randomuser.me" },
            { protocol: "https", hostname: "assets0.mirraw.com" },
            { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
            { protocol: "https", hostname: "cdn11.bigcommerce.com" },
            { protocol: "https", hostname: "storage.googleapis.com" },
            { protocol: "https", hostname: "viaindia.nl" },
            { protocol: "https", hostname: "medias.utsavfashion.com" },
            { protocol: "https", hostname: "images.vestiairecollective.com" },
            { protocol: "https", hostname: "www.ethnickart.com" },
            { protocol: "https", hostname: "i.pinimg.com" },
            { protocol: "https", hostname: "m.media-amazon.com" },
            { protocol: "https", hostname: "anvicouture.com" },
            { protocol: "https", hostname: "indiansilkhouse.com" },
            { protocol: "https", hostname: "www.indiansilkhouse.com" },
            { protocol: "https", hostname: "perfectdetails.com" },
            { protocol: "https", hostname: "clareswandesigns.com" },
            { protocol: "https", hostname: "masakalee.com" },
            { protocol: "https", hostname: "www.fashiongonerogue.com" },
            { protocol: "https", hostname: "miro.medium.com" },
            { protocol: "https", hostname: "picsum.photos" },
            { protocol: "https", hostname: "fastly.picsum.photos" },
            { protocol: "https", hostname: "i.pravatar.cc" },
        ],
    },
};

module.exports = nextConfig;
