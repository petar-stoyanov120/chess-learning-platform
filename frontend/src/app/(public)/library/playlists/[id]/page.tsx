'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { LessonSummary } from '@/lib/types';
import LessonCard from '@/components/lessons/LessonCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlaylistDetail {
  id: number;
  name: string;
  description: string | null;
  lessons: LessonSummary[];
}

export default function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.get<{ data: PlaylistDetail }>(`/playlists/${params.id}`)
        .then((res) => setPlaylist(res.data))
        .catch(() => router.push('/library'))
        .finally(() => setLoading(false));
    }
  }, [user, isLoading, router, params.id]);

  async function handleRemove(lessonId: number) {
    try {
      await api.delete(`/playlists/${params.id}/lessons/${lessonId}`);
      setPlaylist((prev) => prev ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== lessonId) } : prev);
      toast.success('Lesson removed from playlist');
    } catch {
      toast.error('Failed to remove lesson');
    }
  }

  if (loading || !playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: 'Library', href: '/library' },
        { label: playlist.name },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-chess-dark">{playlist.name}</h1>
        {playlist.description && <p className="text-gray-500 mt-2">{playlist.description}</p>}
        <p className="text-sm text-gray-400 mt-1">{playlist.lessons.length} lesson{playlist.lessons.length !== 1 ? 's' : ''}</p>
      </div>

      {playlist.lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg mb-4">This playlist is empty</p>
          <Link href="/learn" className="text-chess-gold hover:underline">Browse lessons to add</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlist.lessons.map((lesson) => (
            <div key={lesson.id} className="relative">
              <LessonCard lesson={lesson} />
              <button
                onClick={() => handleRemove(lesson.id)}
                className="absolute top-2 left-2 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-600"
                title="Remove from playlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
