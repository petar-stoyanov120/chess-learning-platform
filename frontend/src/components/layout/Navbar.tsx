'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/');
  }

  return (
    <nav className="bg-chess-dark text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">♟</span>
            <span className="text-chess-cream">ChessLearn</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/learn" className="hover:text-chess-cream transition-colors">Learn</Link>
            <Link href="/blog" className="hover:text-chess-cream transition-colors">Blog</Link>
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link href="/search" className="hover:text-chess-cream transition-colors" aria-label="Search">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/library" className="hover:text-chess-cream transition-colors text-sm">My Library</Link>
                    <Link href="/classrooms" className="hover:text-chess-cream transition-colors text-sm">Classrooms</Link>
                    <Link
                      href={user.role === 'admin' ? '/admin' : user.role === 'collaborator' ? '/collaborator' : '/dashboard'}
                      className="hover:text-chess-cream transition-colors text-sm"
                    >
                      Dashboard
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href="/profile">
                        <Avatar user={user} size="sm" />
                      </Link>
                      <span className="text-sm text-gray-300">@{user.username}</span>
                      <button
                        onClick={handleLogout}
                        className="bg-chess-gold text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/login" className="hover:text-chess-cream transition-colors text-sm">Log in</Link>
                    <Link href="/register" className="bg-chess-gold text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/learn" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Learn</Link>
            <Link href="/blog" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Blog</Link>
            <Link href="/search" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Search</Link>
            <button onClick={toggle} className="block px-2 py-2 text-gray-300 hover:text-white">
              {theme === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode'}
            </button>
            {user ? (
              <>
                <Link href="/library" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>My Library</Link>
                <Link href="/classrooms" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Classrooms</Link>
                <Link href="/profile" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Profile</Link>
                <Link href={user.role === 'admin' ? '/admin' : user.role === 'collaborator' ? '/collaborator' : '/dashboard'} className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="block px-2 py-2 text-chess-gold">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/register" className="block px-2 py-2 hover:text-chess-cream" onClick={() => setMenuOpen(false)}>Sign up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
