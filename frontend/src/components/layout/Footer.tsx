import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-chess-dark text-gray-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span className="text-2xl">♟</span>
              <span>ChessLearn</span>
            </div>
            <p className="text-sm">Learn chess through structured lessons, from beginner to advanced.</p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Learn</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/learn/openings/beginner" className="hover:text-white transition-colors">Openings</Link></li>
              <li><Link href="/learn/concepts/beginner" className="hover:text-white transition-colors">Concepts</Link></li>
              <li><Link href="/learn/endgames/beginner" className="hover:text-white transition-colors">Endgames</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">More</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Create Account</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-center">
          &copy; {new Date().getFullYear()} ChessLearn. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
