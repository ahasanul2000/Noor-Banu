import { blogs } from "@/data/blogs";

export default function sitemap() {
    const baseUrl = "https://noorbanu.com";

    const blogRoutes = blogs.map((blog) => ({
        url: `${baseUrl}/blog/${blog.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    const routes = [
        "",
        "/jewelry",
        "/dresses",
        "/perfumes",
        "/blog",
        "/shop",
        "/about",
        "/contact",
        "/track-order"
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.8,
    }));

    return [...routes, ...blogRoutes];
}
