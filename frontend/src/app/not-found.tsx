import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-chess-dark mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="bg-chess-dark text-white px-6 py-3 rounded-lg font-semibold hover:bg-chess-accent transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
