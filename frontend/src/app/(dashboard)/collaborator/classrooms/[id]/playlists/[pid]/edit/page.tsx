'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ClassroomPlaylist, ClassroomPlaylistLesson, LessonSummary } from '@/lib/types';
import LessonPickerModal from '@/components/classrooms/LessonPickerModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/lib/toast';

export default function EditPlaylistPage({ params }: { params: { id: string; pid: string } }) {
  const classroomId = parseInt(params.id);
  const playlistId = parseInt(params.pid);
  const router = useRouter();
  const { showToast } = useToast();

  const [playlist, setPlaylist] = useState<ClassroomPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIntro, setEditIntro] = useState('');
  const [saving, setSaving] = useState(false);

  // Per-lesson note editing
  const [editingNoteFor, setEditingNoteFor] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ClassroomPlaylist & { lessons: ClassroomPlaylistLesson[] } }>(
        `/classrooms/${classroomId}/playlists/${playlistId}`
      );
      setPlaylist(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description ?? '');
      setEditIntro(res.data.teacherIntro ?? '');
    } catch {
      router.replace(`/collaborator/classrooms/${classroomId}`);
    } finally {
      setLoading(false);
    }
  }, [classroomId, playlistId, router]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/classrooms/${classroomId}/playlists/${playlistId}`, {
        name: editName,
        description: editDesc,
        teacherIntro: editIntro,
      });
      setPlaylist((prev) => prev ? { ...prev, name: editName, description: editDesc, teacherIntro: editIntro } : prev);
      showToast('Playlist updated.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLesson(lesson: LessonSummary, teacherNote: string) {
    try {
      const res = await api.post<{ data: ClassroomPlaylistLesson }>(`/classrooms/${classroomId}/playlists/${playlistId}/lessons`, {
        lessonId: lesson.id,
        teacherNote: teacherNote || undefined,
      });
      setPlaylist((prev) => {
        if (!prev) return prev;
        const newLesson: ClassroomPlaylistLesson = {
          ...res.data,
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          excerpt: lesson.excerpt,
          coverImageUrl: lesson.coverImageUrl,
          readingTime: lesson.readingTime,
          sortOrder: (prev.lessons?.length ?? 0),
          teacherNote: teacherNote || null,
          author: lesson.author,
          category: lesson.category,
          level: lesson.level,
          status: lesson.status,
        };
        return { ...prev, lessons: [...(prev.lessons ?? []), newLesson] };
      });
      setShowPicker(false);
      showToast('Lesson added!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add lesson', 'error');
    }
  }

  async function handleRemoveLesson(lessonId: number) {
    if (!confirm('Remove this lesson from the playlist?')) return;
    try {
      await api.delete(`/classrooms/${classroomId}/playlists/${playlistId}/lessons/${lessonId}`);
      setPlaylist((prev) => {
        if (!prev) return prev;
        return { ...prev, lessons: (prev.lessons ?? []).filter((l) => l.id !== lessonId) };
      });
      showToast('Lesson removed.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove lesson', 'error');
    }
  }

  async function handleSaveNote(lessonId: number) {
    try {
      await api.patch(`/classrooms/${classroomId}/playlists/${playlistId}/lessons/${lessonId}`, {
        teacherNote: noteValue,
      });
      setPlaylist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lessons: (prev.lessons ?? []).map((l) =>
            l.id === lessonId ? { ...l, teacherNote: noteValue || null } : l
          ),
        };
      });
      setEditingNoteFor(null);
      showToast('Note saved.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save note', 'error');
    }
  }

  if (loading || !playlist) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  const lessons = playlist.lessons ?? [];
  const existingIds = lessons.map((l) => l.id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Classroom
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-chess-dark">Edit Playlist</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playlist details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Playlist Details</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={80}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={500}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher Introduction Note
              </label>
              <textarea
                value={editIntro}
                onChange={(e) => setEditIntro(e.target.value)}
                placeholder="Your message shown to students at the top of this playlist..."
                maxLength={2000}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">Visible to all students in this classroom.</p>
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

        {/* Lessons */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Lessons ({lessons.length})</h2>
            <button
              onClick={() => setShowPicker(true)}
              className="bg-chess-dark text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
            >
              + Add Lesson
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📖</p>
              <p className="text-sm">No lessons yet. Add some for your students.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-xs text-gray-400 mt-0.5 w-5 shrink-0">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lesson.category.name} · {lesson.level.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLesson(lesson.id)}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Teacher note */}
                  {editingNoteFor === lesson.id ? (
                    <div className="mt-2">
                      <textarea
                        value={noteValue}
                        onChange={(e) => setNoteValue(e.target.value)}
                        placeholder="Teacher note for this lesson..."
                        rows={2}
                        maxLength={1000}
                        className="w-full border border-amber-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-chess-gold resize-none"
                      />
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => setEditingNoteFor(null)} className="text-xs text-gray-500">Cancel</button>
                        <button onClick={() => handleSaveNote(lesson.id)} className="text-xs text-chess-dark font-medium">Save Note</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-start gap-2">
                      {lesson.teacherNote ? (
                        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 flex-1 italic">
                          📝 {lesson.teacherNote}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No teacher note</p>
                      )}
                      <button
                        onClick={() => { setEditingNoteFor(lesson.id); setNoteValue(lesson.teacherNote ?? ''); }}
                        className="text-xs text-chess-gold hover:underline shrink-0"
                      >
                        {lesson.teacherNote ? 'Edit' : 'Add'} Note
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPicker && (
        <LessonPickerModal
          onSelect={handleAddLesson}
          onClose={() => setShowPicker(false)}
          existingLessonIds={existingIds}
        />
      )}
    </div>
  );
}
