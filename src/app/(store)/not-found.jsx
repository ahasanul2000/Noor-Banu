import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muslin-cream px-4">
            <div className="text-center max-w-md">
                <h1 className="text-9xl font-serif text-heritage-gold mb-4">404</h1>
                <h2 className="text-3xl font-serif text-emerald-royal mb-4">
                    Page Not Found
                </h2>
                <p className="text-emerald-royal/70 mb-8">
                    The royal page you're looking for seems to have wandered off to another palace.
                </p>
                <Link
                    href="/"
                    className="inline-block px-8 py-3 bg-emerald-royal text-white rounded-full hover:bg-heritage-gold transition-colors duration-300"
                >
                    Return to Palace
                </Link>
            </div>
        </div>
    );
}
