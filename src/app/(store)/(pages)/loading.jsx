import Skeleton from "@/components/ui/Skeleton";
import { Navbar } from "@/components/layout/Navbar";

export default function Loading() {
    // Keep the navbar on screen while a page loads so navigation doesn't flash a blank header.
    return (
        <div className="min-h-screen bg-muslin-cream pt-nav">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-4 w-32 mx-auto" />
                        <Skeleton className="h-12 w-64 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
