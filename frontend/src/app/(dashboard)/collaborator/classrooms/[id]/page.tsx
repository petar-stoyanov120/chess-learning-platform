'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Classroom, ClassroomPlaylist, ClassroomProgress, ClassroomPuzzle, ClassroomLesson } from '@/lib/types';
import InviteCodeBanner from '@/components/classrooms/InviteCodeBanner';
import PlaylistCard from '@/components/classrooms/PlaylistCard';
import StudentProgressTable from '@/components/classrooms/StudentProgressTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/lib/toast';

type Tab = 'playlists' | 'puzzles' | 'lessons' | 'students' | 'progress' | 'settings';

export default function ManageClassroomPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [playlists, setPlaylists] = useState<ClassroomPlaylist[]>([]);
  const [progress, setProgress] = useState<ClassroomProgress[]>([]);
  const [puzzles, setPuzzles] = useState<ClassroomPuzzle[]>([]);
  const [lessons, setLessons] = useState<ClassroomLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const initialTab = (searchParams.get('tab') as Tab | null) ?? 'playlists';
  const [tab, setTab] = useState<Tab>(initialTab);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAgeMin, setEditAgeMin] = useState('');
  const [editAgeMax, setEditAgeMax] = useState('');
  const [saving, setSaving] = useState(false);

  const loadClassroom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Classroom & { playlists: ClassroomPlaylist[] } }>(`/classrooms/${id}`);
      setClassroom(res.data);
      setPlaylists(res.data.playlists ?? []);
      setEditName(res.data.name);
      setEditDesc(res.data.description ?? '');
      setEditAgeMin(res.data.ageMin != null ? String(res.data.ageMin) : '');
      setEditAgeMax(res.data.ageMax != null ? String(res.data.ageMax) : '');
    } catch {
      router.replace('/collaborator/classrooms');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const loadProgress = useCallback(async () => {
    try {
      const res = await api.get<{ data: ClassroomProgress[] }>(`/classrooms/${id}/progress`);
      setProgress(res.data ?? []);
    } catch {
      // no-op
    }
  }, [id]);

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

  useEffect(() => { loadClassroom(); }, [loadClassroom]);

  useEffect(() => {
    if (tab === 'progress' || tab === 'students') loadProgress();
    if (tab === 'puzzles') loadPuzzles();
    if (tab === 'lessons') loadLessons();
  }, [tab, loadProgress, loadPuzzles, loadLessons]);

  async function handleDeletePlaylist(pid: number) {
    if (!confirm('Delete this playlist? This cannot be undone.')) return;
    try {
      await api.delete(`/classrooms/${id}/playlists/${pid}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== pid));
      showToast('Playlist deleted.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete playlist', 'error');
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!confirm('Remove this student from the classroom?')) return;
    try {
      await api.delete(`/classrooms/${id}/members/${userId}`);
      setProgress((prev) => prev.filter((p) => p.user.id !== userId));
      showToast('Student removed.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove student', 'error');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const patch: Record<string, unknown> = { name: editName, description: editDesc };
      if (editAgeMin) patch.ageMin = Number(editAgeMin);
      else patch.ageMin = null;
      if (editAgeMax) patch.ageMax = Number(editAgeMax);
      else patch.ageMax = null;
      await api.patch(`/classrooms/${id}`, patch);
      setClassroom((prev) => prev ? {
        ...prev,
        name: editName,
        description: editDesc,
        ageMin: editAgeMin ? Number(editAgeMin) : null,
        ageMax: editAgeMax ? Number(editAgeMax) : null,
      } : prev);
      showToast('Settings saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!classroom) return;
    const newState = !classroom.isActive;
    if (!confirm(`${newState ? 'Activate' : 'Deactivate'} this classroom?`)) return;
    try {
      await api.patch(`/classrooms/${id}`, { isActive: newState });
      setClassroom((prev) => prev ? { ...prev, isActive: newState } : prev);
      showToast(`Classroom ${newState ? 'activated' : 'deactivated'}.`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  }

  if (loading || !classroom) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'playlists', label: 'Playlists', icon: '📋' },
    { key: 'puzzles', label: 'Puzzles', icon: '♟️' },
    { key: 'lessons', label: 'Lessons', icon: '📖' },
    { key: 'students', label: 'Students', icon: '👥' },
    { key: 'progress', label: 'Progress', icon: '📊' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            {classroom.location ? (
              <>
                <Link href="/collaborator/locations" className="hover:text-chess-gold transition-colors">Locations</Link>
                <span>/</span>
                <Link href={`/collaborator/locations/${classroom.location.id}`} className="hover:text-chess-gold transition-colors">
                  {classroom.location.name}
                </Link>
                <span>/</span>
                <span className="text-gray-500 dark:text-gray-400">Groups</span>
              </>
            ) : (
              <Link href="/collaborator/classrooms" className="hover:text-gray-600 dark:hover:text-gray-300">
                ← My Classrooms
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100">{classroom.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              classroom.tier === 'premium'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {classroom.tier === 'premium' ? '⭐ Premium' : 'Free'}
            </span>
            {!classroom.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 font-medium">Inactive</span>
            )}
          </div>
          {classroom.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{classroom.description}</p>
          )}
        </div>
      </div>

      {/* Invite banner */}
      <div className="mb-6">
        <InviteCodeBanner inviteCode={classroom.inviteCode} classroomName={classroom.name} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-chess-dark dark:border-gray-300 text-chess-dark dark:text-gray-100'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── Playlists ── */}
      {tab === 'playlists' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</p>
            <Link
              href={`/collaborator/classrooms/${id}/playlists/new`}
              className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
            >
              + New Playlist
            </Link>
          </div>
          {playlists.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">No playlists yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create your first playlist to assign lessons to your students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playlists.map((p) => (
                <PlaylistCard key={p.id} playlist={p} classroomId={id} isOwner onDelete={handleDeletePlaylist} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Puzzles ── */}
      {tab === 'puzzles' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''}</p>
            <Link
              href={`/collaborator/classrooms/${id}/puzzles/new`}
              className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
            >
              + New Puzzle
            </Link>
          </div>
          {puzzles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">♟️</p>
              <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">No puzzles yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a homework puzzle for your students to solve and submit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {puzzles.map((pz) => (
                <div key={pz.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{pz.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{pz._count?.submissions ?? 0} submission{(pz._count?.submissions ?? 0) !== 1 ? 's' : ''}</span>
                      {pz.maxMoves && <span className="text-amber-600 dark:text-amber-400">⏱ {pz.maxMoves} moves</span>}
                      {pz.dueDate && (
                        <span className={new Date(pz.dueDate) < new Date() ? 'text-red-500 dark:text-red-400' : ''}>
                          Due {new Date(pz.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link
                      href={`/classrooms/${id}/puzzles/${pz.id}`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    >
                      ♟ Solve
                    </Link>
                    <Link
                      href={`/collaborator/classrooms/${id}/puzzles/${pz.id}/submissions`}
                      className="text-xs px-3 py-1.5 bg-chess-accent/10 dark:bg-chess-accent/20 text-chess-accent rounded-lg hover:bg-chess-accent/20 dark:hover:bg-chess-accent/30 transition-colors"
                    >
                      View Submissions
                    </Link>
                    <Link
                      href={`/collaborator/classrooms/${id}/puzzles/${pz.id}/edit`}
                      className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this puzzle? All submissions will also be deleted.')) return;
                        try {
                          await api.delete(`/classrooms/${id}/puzzles/${pz.id}`);
                          setPuzzles((prev) => prev.filter((p) => p.id !== pz.id));
                          showToast('Puzzle deleted.', 'success');
                        } catch {
                          showToast('Failed to delete puzzle.', 'error');
                        }
                      }}
                      className="text-xs px-3 py-1.5 text-red-400 hover:text-red-600 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lessons ── */}
      {tab === 'lessons' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
            <Link
              href={`/collaborator/classrooms/${id}/lessons/new`}
              className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
            >
              + New Lesson
            </Link>
          </div>
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
              <p className="text-4xl mb-3">📖</p>
              <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">No lessons yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Write custom lessons for your students — with rich text content and optional end-of-lesson puzzles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">{lesson.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{lesson._count?.puzzles ?? 0} puzzle{(lesson._count?.puzzles ?? 0) !== 1 ? 's' : ''}</span>
                      <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/collaborator/classrooms/${id}/lessons/${lesson.id}/edit`}
                      className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this lesson? All attached puzzles will also be deleted.')) return;
                        try {
                          await api.delete(`/classrooms/${id}/classroom-lessons/${lesson.id}`);
                          setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
                          showToast('Lesson deleted.', 'success');
                        } catch {
                          showToast('Failed to delete lesson.', 'error');
                        }
                      }}
                      className="text-xs px-3 py-1.5 text-red-400 hover:text-red-600 border border-transparent hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Students ── */}
      {tab === 'students' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {classroom._count?.members ?? 0} student{(classroom._count?.members ?? 0) !== 1 ? 's' : ''}
              {classroom.tier === 'free' && ` (max 30 on free tier)`}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            {progress.length === 0 && (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <p className="text-3xl mb-2">👩‍🎓</p>
                <p className="text-sm">No students yet. Share your invite code!</p>
              </div>
            )}
            {progress.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Student</th>
                      <th className="text-right py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {progress.map((p) => (
                      <tr key={p.user.id}>
                        <td className="py-2 px-2 font-medium text-gray-900 dark:text-gray-100">
                          {p.user.displayName || p.user.username}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">@{p.user.username}</span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={() => handleRemoveMember(p.user.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Progress ── */}
      {tab === 'progress' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <StudentProgressTable progress={progress} onRemove={handleRemoveMember} />
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Classroom Settings</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Classroom Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={80}
                  required
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Age Range <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editAgeMin}
                    onChange={(e) => setEditAgeMin(e.target.value)}
                    placeholder="Min"
                    min={3}
                    max={99}
                    className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="number"
                    value={editAgeMax}
                    onChange={(e) => setEditAgeMax(e.target.value)}
                    placeholder="Max"
                    min={3}
                    max={99}
                    className="w-24 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                  />
                  <span className="text-xs text-gray-400">years</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Classroom Status</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {classroom.isActive
                ? 'This classroom is active. Students can join and access playlists.'
                : 'This classroom is inactive. Students cannot access it.'}
            </p>
            <button
              onClick={handleDeactivate}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                classroom.isActive
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              {classroom.isActive ? 'Deactivate Classroom' : 'Activate Classroom'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
