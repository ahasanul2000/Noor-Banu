import Skeleton from "@/components/ui/Skeleton";
import { Navbar } from "@/components/layout/Navbar";

// Mirrors the product page layout (gallery left, details right) so the switch feels seamless.
export default function ProductLoading() {
    return (
        <main className="min-h-screen bg-muslin-cream">
            <Navbar />
            <section className="pt-nav pb-16 md:pb-24">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 lg:gap-14 items-start">
                        <div className="space-y-4 w-full mx-auto max-w-xl lg:max-w-[min(100%,calc((100vh-var(--nav-h)-10rem)*3/4))]">
                            <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                            <div className="flex gap-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="w-16 md:w-20 aspect-[3/4] rounded-xl" />
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6 pt-2">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-8 w-40" />
                            <Skeleton className="h-4 w-32" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full max-w-xl" />
                                <Skeleton className="h-4 w-5/6 max-w-xl" />
                            </div>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-12 w-12 rounded-md" />
                                ))}
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Skeleton className="h-14 flex-1" />
                                <Skeleton className="h-14 flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
