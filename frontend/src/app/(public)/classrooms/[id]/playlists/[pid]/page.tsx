'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ClassroomPlaylist, ClassroomPlaylistLesson } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

export default function ClassroomPlaylistPage({ params }: { params: { id: string; pid: string } }) {
  const classroomId = parseInt(params.id);
  const playlistId = parseInt(params.pid);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<(ClassroomPlaylist & { lessons: ClassroomPlaylistLesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ClassroomPlaylist & { lessons: ClassroomPlaylistLesson[] } }>(
        `/classrooms/${classroomId}/playlists/${playlistId}`
      );
      setPlaylist(res.data);
    } catch {
      router.replace(`/classrooms/${classroomId}`);
    } finally {
      setLoading(false);
    }
  }, [classroomId, playlistId, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || isLoading || !playlist) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const lessons = playlist.lessons ?? [];
  const completedCount = lessons.filter((l) => l.completed).length;
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/classrooms" className="hover:text-gray-600">Classrooms</Link>
        <span>›</span>
        <Link href={`/classrooms/${classroomId}`} className="hover:text-gray-600">Classroom</Link>
        <span>›</span>
        <span className="text-gray-700">{playlist.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-chess-dark">{playlist.name}</h1>
        {playlist.description && (
          <p className="text-gray-500 text-sm mt-1">{playlist.description}</p>
        )}

        {/* Progress bar */}
        {lessons.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Your Progress</span>
              <span className="font-medium">{completedCount}/{lessons.length} lessons</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : 'bg-chess-gold'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {percent === 100 && (
              <p className="text-sm text-green-600 font-medium mt-2">🎉 Playlist complete!</p>
            )}
          </div>
        )}
      </div>

      {/* Teacher intro note */}
      {playlist.teacherIntro && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5">📝 From Your Teacher</p>
          <p className="text-sm text-amber-900 whitespace-pre-line">{playlist.teacherIntro}</p>
        </div>
      )}

      {/* Lessons */}
      {lessons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-3xl mb-2">📖</p>
          <p className="text-sm">No lessons have been added to this playlist yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            <div
              key={lesson.id}
              className={`bg-white border rounded-xl p-4 transition-shadow hover:shadow-sm ${
                lesson.completed ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  lesson.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {lesson.completed ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/learn/${lesson.category.slug}/${lesson.level.name}/${lesson.slug}`}
                        className="font-medium text-gray-900 hover:text-chess-gold transition-colors"
                      >
                        {lesson.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>
                          {lesson.level.name}
                        </Badge>
                        <span className="text-xs text-gray-400">{lesson.category.name}</span>
                        {lesson.readingTime && (
                          <span className="text-xs text-gray-400">{lesson.readingTime} min</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/learn/${lesson.category.slug}/${lesson.level.name}/${lesson.slug}`}
                      className={`text-sm font-medium shrink-0 ${
                        lesson.completed ? 'text-green-600' : 'text-chess-dark hover:text-chess-gold'
                      } transition-colors`}
                    >
                      {lesson.completed ? 'Review →' : 'Start →'}
                    </Link>
                  </div>
                  {lesson.excerpt && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{lesson.excerpt}</p>
                  )}
                  {/* Teacher note */}
                  {lesson.teacherNote && (
                    <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-700">
                        <span className="font-semibold">Teacher note:</span> {lesson.teacherNote}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
