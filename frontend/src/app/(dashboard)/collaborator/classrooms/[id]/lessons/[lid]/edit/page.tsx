'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassroomLesson, ClassroomPuzzle } from '@/lib/types';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const BoardSetupEditor = dynamic(() => import('@/components/chess/BoardSetupEditor'), { ssr: false });

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface PuzzleForm {
  localId: number;
  puzzleId?: number;  // set when loaded from DB or just saved
  title: string;
  description: string;
  fen: string;
  sideToMove: 'white' | 'black';
  dueDate: string;
  saved: boolean;
  editing: boolean;
}

let nextLocalId = 100;

export default function EditClassroomLessonPage() {
  const { id, lid } = useParams<{ id: string; lid: string }>();
  const classroomId = Number(id);
  const lessonId = Number(lid);
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [puzzleForms, setPuzzleForms] = useState<PuzzleForm[]>([]);
  const [savingPuzzle, setSavingPuzzle] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<ClassroomLesson>(`/classrooms/${classroomId}/classroom-lessons/${lessonId}`);
        const lesson = res.data;
        setTitle(lesson.title);
        setContent(lesson.content ?? '');
        // Load existing lesson puzzles
        if (lesson.puzzles && lesson.puzzles.length > 0) {
          setPuzzleForms(
            lesson.puzzles.map((pz) => ({
              localId: nextLocalId++,
              puzzleId: pz.id,
              title: pz.title,
              description: pz.description ?? '',
              fen: pz.fen,
              sideToMove: (pz.sideToMove as 'white' | 'black') ?? 'white',
              dueDate: pz.dueDate ? new Date(pz.dueDate).toISOString().slice(0, 16) : '',
              saved: true,
              editing: false,
            })),
          );
        }
      } catch {
        error('Failed to load lesson.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classroomId, lessonId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/classrooms/${classroomId}/classroom-lessons/${lessonId}`, {
        title: title.trim(),
        content,
      });
      success('Lesson updated!');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to update lesson.');
    } finally {
      setSaving(false);
    }
  }

  function addPuzzleForm() {
    setPuzzleForms((prev) => [
      ...prev,
      { localId: nextLocalId++, title: '', description: '', fen: STARTING_FEN, sideToMove: 'white', dueDate: '', saved: false, editing: true },
    ]);
  }

  function updateForm(localId: number, patch: Partial<PuzzleForm>) {
    setPuzzleForms((prev) => prev.map((f) => f.localId === localId ? { ...f, ...patch } : f));
  }

  async function savePuzzle(form: PuzzleForm) {
    if (!form.title.trim() || !form.fen.trim()) {
      error('Puzzle title and position are required.');
      return;
    }
    setSavingPuzzle(form.localId);
    try {
      if (form.puzzleId) {
        // Update existing puzzle — only allowed if no submissions
        await api.patch(`/classrooms/${classroomId}/puzzles/${form.puzzleId}`, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          fen: form.fen.trim(),
          sideToMove: form.sideToMove,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        });
      } else {
        // Create new puzzle attached to this lesson
        const res = await api.post<ClassroomPuzzle>(`/classrooms/${classroomId}/puzzles`, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          fen: form.fen.trim(),
          sideToMove: form.sideToMove,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          lessonId,
        });
        updateForm(form.localId, { puzzleId: res.data.id });
      }
      updateForm(form.localId, { saved: true, editing: false });
      success('Puzzle saved!');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save puzzle.');
    } finally {
      setSavingPuzzle(null);
    }
  }

  async function removePuzzle(form: PuzzleForm) {
    if (form.puzzleId) {
      if (!confirm('Remove this puzzle? All student submissions will also be deleted.')) return;
      try {
        await api.delete(`/classrooms/${classroomId}/puzzles/${form.puzzleId}`);
      } catch {
        error('Failed to remove puzzle.');
        return;
      }
    }
    setPuzzleForms((prev) => prev.filter((f) => f.localId !== form.localId));
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}?tab=lessons`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Lessons
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-chess-dark">Edit Lesson</h1>
      </div>

      {/* Lesson content form */}
      <form onSubmit={handleSave} className="space-y-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            {content !== undefined && (
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your lesson content here…"
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim() || !content.trim()}
          className="w-full py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Lesson'}
        </button>
      </form>

      {/* Puzzles section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">End-of-Lesson Puzzles</h2>
            <p className="text-xs text-gray-500 mt-0.5">Optional puzzles for students to solve after the lesson.</p>
          </div>
          <button
            type="button"
            onClick={addPuzzleForm}
            className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
          >
            + Add Puzzle
          </button>
        </div>

        {puzzleForms.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">No puzzles yet.</p>
        )}

        <div className="space-y-5">
          {puzzleForms.map((form) => (
            <div key={form.localId} className={`border rounded-xl p-5 space-y-4 ${form.saved && !form.editing ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  {form.saved && !form.editing ? `✓ ${form.title}` : (form.puzzleId ? 'Edit Puzzle' : 'New Puzzle')}
                </h3>
                <div className="flex gap-2">
                  {form.saved && !form.editing && (
                    <button type="button" onClick={() => updateForm(form.localId, { editing: true })} className="text-xs text-blue-500 hover:text-blue-700">
                      Edit
                    </button>
                  )}
                  <button type="button" onClick={() => removePuzzle(form)} className="text-xs text-red-400 hover:text-red-600">
                    Remove
                  </button>
                </div>
              </div>

              {(!form.saved || form.editing) && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateForm(form.localId, { title: e.target.value })}
                        maxLength={120}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Due Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => updateForm(form.localId, { dueDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm(form.localId, { description: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Position *</label>
                    <BoardSetupEditor
                      fen={form.fen}
                      onFenChange={(f) => {
                        const parts = f.split(' ');
                        updateForm(form.localId, { fen: f, sideToMove: parts[1] === 'b' ? 'black' : 'white' });
                      }}
                      size={340}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Side to Move</label>
                    <div className="flex gap-4">
                      {(['white', 'black'] as const).map((side) => (
                        <label key={side} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value={side}
                            checked={form.sideToMove === side}
                            onChange={() => updateForm(form.localId, { sideToMove: side })}
                            className="accent-chess-accent"
                          />
                          <span className="text-sm capitalize">{side} to move</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => savePuzzle(form)}
                      disabled={savingPuzzle === form.localId || !form.title.trim()}
                      className="px-4 py-2 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
                    >
                      {savingPuzzle === form.localId ? 'Saving…' : 'Save Puzzle'}
                    </button>
                    {form.editing && form.saved && (
                      <button
                        type="button"
                        onClick={() => updateForm(form.localId, { editing: false })}
                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/collaborator/classrooms/${classroomId}?tab=lessons`}
          className="block text-center py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Back to Lessons
        </Link>
      </div>
    </div>
  );
}
