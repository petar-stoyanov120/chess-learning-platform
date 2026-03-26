'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LessonSummary, Playlist, PaginatedResponse } from '@/lib/types';
import LessonCard from '@/components/lessons/LessonCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProgressEntry {
  lessonId: number;
  completedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  openings: 'bg-blue-100 text-blue-700 border-blue-200',
  concepts: 'bg-purple-100 text-purple-700 border-purple-200',
  endgames: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function UserDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<LessonSummary[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [lastLesson, setLastLesson] = useState<{ title: string; href: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'user') {
      router.replace(user.role === 'admin' ? '/admin' : '/collaborator');
    }
  }, [user, isLoading, router]);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [b, pl, pr] = await Promise.allSettled([
        api.get<PaginatedResponse<LessonSummary>>('/bookmarks?limit=6'),
        api.get<{ data: Playlist[] }>('/playlists'),
        api.get<{ data: ProgressEntry[] }>('/lessons/my/progress'),
      ]);
      if (b.status === 'fulfilled') setBookmarks(b.value.data);
      if (pl.status === 'fulfilled') setPlaylists(pl.value.data);
      if (pr.status === 'fulfilled') setProgress(pr.value.data);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  useEffect(() => {
    const stored = localStorage.getItem('chess_last_lesson');
    if (stored) {
      try {
        setLastLesson(JSON.parse(stored) as { title: string; href: string });
      } catch {
        // ignore
      }
    }
  }, []);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  const completedCount = progress.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-1">My Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome back, @{user.username}</p>

      {/* Continue Learning */}
      {lastLesson && (
        <Link
          href={lastLesson.href}
          className="block bg-chess-dark text-white rounded-xl p-5 mb-6 hover:bg-chess-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">▶</span>
            <div>
              <p className="text-sm text-gray-300">Continue where you left off</p>
              <p className="font-semibold text-white">{lastLesson.title}</p>
            </div>
            <span className="ml-auto text-gray-300">→</span>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-5">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-700">{completedCount}</div>
          <div className="text-sm text-green-600">Lessons completed</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-5">
          <div className="text-3xl mb-1">🔖</div>
          <div className="text-2xl font-bold text-amber-700">{bookmarks.length}</div>
          <div className="text-sm text-amber-600">Bookmarked lessons</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <div className="text-3xl mb-1">🎵</div>
          <div className="text-2xl font-bold text-purple-700">{playlists.length}</div>
          <div className="text-sm text-purple-600">Playlists</div>
        </div>
      </div>

      {dataLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <>
          {/* Bookmarked Lessons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Bookmarked Lessons</h2>
              <Link href="/library" className="text-sm text-chess-gold hover:underline">View all →</Link>
            </div>
            {bookmarks.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">🔖</div>
                <p>No bookmarks yet. <Link href="/learn" className="text-chess-gold hover:underline">Browse lessons</Link></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </div>

          {/* Playlists */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Playlists</h2>
              <Link href="/library?tab=playlists" className="text-sm text-chess-gold hover:underline">View all →</Link>
            </div>
            {playlists.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">🎵</div>
                <p>No playlists yet. Use the + button on any lesson to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.slice(0, 6).map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/library/playlists/${pl.id}`}
                    className="card p-5 hover:shadow-md transition-shadow block"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1 hover:text-chess-gold transition-colors">{pl.name}</h3>
                    {pl.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{pl.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {pl._count?.lessons ?? 0} lesson{(pl._count?.lessons ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['openings', 'concepts', 'endgames'].map((cat) => (
                <Link
                  key={cat}
                  href={`/learn/${cat}`}
                  className={`border rounded-xl p-4 text-center capitalize font-medium hover:opacity-80 transition-opacity ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
