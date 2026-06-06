import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-to-br from-chess-dark to-chess-accent">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-4">♟</div>
        <h1 className="text-3xl font-bold text-chess-dark dark:text-gray-100 mb-2">ChessLearn</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Club management platform for Bulgarian chess clubs.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="bg-chess-dark text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-chess-accent transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="border-2 border-chess-dark text-chess-dark dark:text-gray-100 dark:border-gray-600 px-6 py-3 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/classrooms/join"
            className="text-sm text-gray-400 hover:text-chess-dark dark:hover:text-gray-200 transition-colors mt-2"
          >
            Join a classroom with an invite code →
          </Link>
        </div>
      </div>
    </div>
  );
}
