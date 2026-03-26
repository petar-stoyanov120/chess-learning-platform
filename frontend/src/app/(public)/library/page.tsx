'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { LessonSummary } from '@/lib/types';
import LessonCard from '@/components/lessons/LessonCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Pagination from '@/components/ui/Pagination';

interface Playlist {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { lessons: number };
}

type Tab = 'bookmarks' | 'playlists';

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('bookmarks');
  const [bookmarks, setBookmarks] = useState<LessonSummary[]>([]);
  const [bookmarksMeta, setBookmarksMeta] = useState({ total: 0, page: 1, limit: 12, totalPages: 0, hasNext: false, hasPrev: false });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    if (tab === 'bookmarks') {
      api.get<{ data: LessonSummary[]; meta: typeof bookmarksMeta }>(`/bookmarks?page=${page}&limit=12`)
        .then((res) => {
          setBookmarks(res.data);
          setBookmarksMeta(res.meta);
        })
        .catch(() => {})
        .finally(() => setLoadingData(false));
    } else {
      api.get<{ data: Playlist[] }>('/playlists')
        .then((res) => setPlaylists(res.data))
        .catch(() => {})
        .finally(() => setLoadingData(false));
    }
  }, [user, tab, page]);

  async function handleDeletePlaylist(id: number) {
    try {
      await api.delete(`/playlists/${id}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      toast.success('Playlist deleted');
    } catch {
      toast.error('Failed to delete playlist');
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-chess-dark mb-6">My Library</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b">
        {(['bookmarks', 'playlists'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t ? 'border-chess-gold text-chess-gold' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : tab === 'bookmarks' ? (
        bookmarks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔖</div>
            <p className="text-lg mb-4">No bookmarks yet</p>
            <Link href="/learn" className="text-chess-gold hover:underline">Browse lessons to bookmark</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
            <Pagination meta={bookmarksMeta} />
          </>
        )
      ) : (
        playlists.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-lg mb-4">No playlists yet</p>
            <p className="text-sm">Use the + button on any lesson to create your first playlist</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((pl) => (
              <div key={pl.id} className="card p-5 hover:shadow-md transition-shadow">
                <Link href={`/library/playlists/${pl.id}`}>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 hover:text-chess-gold transition-colors">
                    {pl.name}
                  </h3>
                </Link>
                {pl.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{pl.description}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
                  <span>{pl._count.lessons} lesson{pl._count.lessons !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => handleDeletePlaylist(pl.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
