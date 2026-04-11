'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Classroom, ClassroomPlaylist, ClassroomPuzzle, ClassroomLesson, LocationNotice } from '@/lib/types';
import PlaylistCard from '@/components/classrooms/PlaylistCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/lib/toast';

interface ProgressEntry {
  lessonId: number;
  completedAt: string;
}

type Tab = 'playlists' | 'lessons' | 'puzzles';

export default function ClassroomDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [playlists, setPlaylists] = useState<ClassroomPlaylist[]>([]);
  const [puzzles, setPuzzles] = useState<ClassroomPuzzle[]>([]);
  const [lessons, setLessons] = useState<ClassroomLesson[]>([]);
  const [progress, setProgress] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('playlists');
  const [locationNotices, setLocationNotices] = useState<LocationNotice[]>([]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [classroomRes, progressRes] = await Promise.allSettled([
        api.get<{ data: Classroom & { playlists: ClassroomPlaylist[] } }>(`/classrooms/${id}`),
        api.get<{ data: ProgressEntry[] }>('/lessons/my/progress'),
      ]);
      if (classroomRes.status === 'fulfilled') {
        const cr = classroomRes.value.data;
        setClassroom(cr);
        setPlaylists(cr.playlists ?? []);
        // Load location notices if classroom belongs to a location
        if (cr.locationId) {
          api.get<{ data: LocationNotice[] }>(`/locations/${cr.locationId}/notices`)
            .then((r) => setLocationNotices(Array.isArray(r.data) ? r.data.filter((n) => n.status === 'published' || n.status === 'approved') : []))
            .catch(() => {});
        }
      } else {
        router.replace('/classrooms');
      }
      if (progressRes.status === 'fulfilled') {
        setProgress(new Set(progressRes.value.data.map((p) => p.lessonId)));
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const loadPuzzles = useCallback(async () => {
    try {
      const res = await api.get<ClassroomPuzzle[]>(`/classrooms/${id}/puzzles`);
      setPuzzles(res.data ?? []);
    } catch {
      // no-op
    }
  }, [id]);

  const loadLessons = useCallback(async () => {
    try {
      const res = await api.get<ClassroomLesson[]>(`/classrooms/${id}/classroom-lessons`);
      setLessons(res.data ?? []);
    } catch {
      // no-op
    }
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  useEffect(() => {
    if (user && tab === 'puzzles') loadPuzzles();
    if (user && tab === 'lessons') loadLessons();
  }, [user, tab, loadPuzzles, loadLessons]);

  async function handleLeave() {
    if (!confirm('Leave this classroom? You will need a new invite code to rejoin.')) return;
    try {
      await api.post(`/classrooms/${id}/leave`, {});
      showToast('You have left the classroom.', 'success');
      router.push('/classrooms');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to leave', 'error');
    }
  }

  if (loading || isLoading || !classroom) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const isOwner = classroom.isOwner || classroom.ownerId === user?.id;
  const now = new Date();

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'playlists', label: 'Playlists', icon: '📋' },
    { key: 'lessons', label: 'Lessons', icon: '📖' },
    { key: 'puzzles', label: 'Puzzles', icon: '♟️' },
  ];

  // Compute overall stats
  const totalPlaylistLessons = playlists.reduce((s, p) => s + (p._count?.lessons ?? 0), 0);
  const totalDone = playlists.reduce((s, p) => {
    const lessons = (p as ClassroomPlaylist & { lessons?: { lessonId?: number }[] }).lessons ?? [];
    return s + lessons.filter((l) => l.lessonId && progress.has(l.lessonId)).length;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <Link href="/classrooms" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← My Classrooms</Link>
          <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100 mt-1">{classroom.name}</h1>
          {classroom.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{classroom.description}</p>
          )}
          {classroom.owner && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Teacher: <span className="font-medium">{classroom.owner.displayName || classroom.owner.username}</span>
            </p>
          )}
          {/* Overall progress summary */}
          {!isOwner && totalPlaylistLessons > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 max-w-xs">
                <div className="h-1.5 progress-bar">
                  <div
                    className="h-full progress-fill"
                    style={{ width: `${(totalDone / totalPlaylistLessons) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                {totalDone} / {totalPlaylistLessons} lessons done
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {isOwner ? (
            <Link
              href={`/collaborator/classrooms/${id}`}
              className="text-sm border border-chess-dark dark:border-gray-600 text-chess-dark dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Manage →
            </Link>
          ) : (
            <button
              onClick={handleLeave}
              className="text-sm text-red-500 hover:text-red-700 transition-colors px-3 py-1.5"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Location Board */}
      {locationNotices.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-1.5">
            📌 Location Board
            {classroom.location && (
              <span className="font-normal text-amber-600 dark:text-amber-400">— {classroom.location.name}</span>
            )}
          </h2>
          <div className="space-y-3">
            {locationNotices.slice(0, 3).map((notice) => (
              <div key={notice.id} className="bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notice.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{notice.content}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {notice.author && (notice.author.displayName || notice.author.username)} · {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {locationNotices.length > 3 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                +{locationNotices.length - 3} more notices on the location board
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-chess-dark dark:border-gray-300 text-chess-dark dark:text-gray-100'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Playlists tab */}
      {tab === 'playlists' && (
        <section>
          {playlists.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No playlists have been added to this classroom yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Check back later or ask your teacher.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playlists.map((p) => {
                const total = p._count?.lessons ?? 0;
                const playlistLessons = (p as ClassroomPlaylist & { lessons?: { lessonId?: number }[] }).lessons ?? [];
                const done = playlistLessons.filter((l) => l.lessonId && progress.has(l.lessonId)).length;
                return (
                  <Link
                    key={p.id}
                    href={`/classrooms/${id}/playlists/${p.id}`}
                    className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-chess-gold transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-chess-gold transition-colors">{p.name}</h3>
                      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                        {!isOwner && total > 0 ? `${done} / ${total}` : `${total} lesson${total !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{p.description}</p>
                    )}
                    {!isOwner && total > 0 && (
                      <div className="h-1.5 progress-bar">
                        <div
                          className="h-full progress-fill"
                          style={{ width: `${(done / total) * 100}%` }}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Lessons tab */}
      {tab === 'lessons' && (
        <section>
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">📖</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No lessons have been posted yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Your teacher will add lessons here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/classrooms/${id}/lessons/${lesson.id}`}
                  className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-chess-accent dark:hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{lesson.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {lesson._count?.puzzles
                          ? `${lesson._count.puzzles} puzzle${lesson._count.puzzles !== 1 ? 's' : ''} · `
                          : ''}
                        Posted {new Date(lesson.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500 text-sm shrink-0">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Puzzles tab */}
      {tab === 'puzzles' && (
        <section>
          {puzzles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">♟️</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No puzzles assigned yet.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Your teacher will add homework puzzles here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {puzzles.map((pz) => {
                const dueDate = pz.dueDate ? new Date(pz.dueDate) : null;
                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                const isUrgent = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

                let dueBadgeClass = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
                let dueBadgeText = dueDate ? `Due ${dueDate.toLocaleDateString()}` : '';
                if (isOverdue) {
                  dueBadgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
                  dueBadgeText = 'Overdue';
                } else if (isUrgent && daysUntilDue !== null) {
                  dueBadgeClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
                  dueBadgeText = daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
                }

                return (
                  <Link
                    key={pz.id}
                    href={`/classrooms/${id}/puzzles/${pz.id}`}
                    className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-chess-accent dark:hover:border-gray-500 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 dark:text-gray-100 text-sm group-hover:text-chess-accent dark:group-hover:text-blue-400 transition-colors">{pz.title}</p>
                        {pz.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{pz.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        {dueDate && dueBadgeText && (
                          <span className={`px-2 py-0.5 rounded-full font-medium ${dueBadgeClass}`}>
                            {isOverdue && '⚠ '}{dueBadgeText}
                          </span>
                        )}
                        <span className="text-gray-400 dark:text-gray-500">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
