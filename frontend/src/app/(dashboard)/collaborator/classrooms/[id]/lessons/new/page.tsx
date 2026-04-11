'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassroomPuzzle } from '@/lib/types';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const BoardSetupEditor = dynamic(() => import('@/components/chess/BoardSetupEditor'), { ssr: false });

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface PuzzleForm {
  localId: number;
  title: string;
  description: string;
  fen: string;
  sideToMove: 'white' | 'black';
  dueDate: string;
  saved: boolean;
  savedId?: number;
}

let nextLocalId = 1;

export default function NewClassroomLessonPage() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Puzzle forms state — puzzles attached to this lesson (created after lesson is saved)
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [puzzleForms, setPuzzleForms] = useState<PuzzleForm[]>([]);
  const [addingPuzzle, setAddingPuzzle] = useState(false);
  const [savingPuzzle, setSavingPuzzle] = useState<number | null>(null);

  function addPuzzleForm() {
    setPuzzleForms((prev) => [
      ...prev,
      { localId: nextLocalId++, title: '', description: '', fen: STARTING_FEN, sideToMove: 'white', dueDate: '', saved: false },
    ]);
    setAddingPuzzle(true);
  }

  function updatePuzzleForm(localId: number, patch: Partial<PuzzleForm>) {
    setPuzzleForms((prev) => prev.map((f) => f.localId === localId ? { ...f, ...patch } : f));
  }

  async function savePuzzle(form: PuzzleForm, savedLessonId: number) {
    if (!form.title.trim() || !form.fen.trim()) {
      error('Puzzle title and position are required.');
      return;
    }
    setSavingPuzzle(form.localId);
    try {
      const res = await api.post<ClassroomPuzzle>(`/classrooms/${classroomId}/puzzles`, {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        fen: form.fen.trim(),
        sideToMove: form.sideToMove,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        lessonId: savedLessonId,
      });
      updatePuzzleForm(form.localId, { saved: true, savedId: res.data.id });
      success('Puzzle added!');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save puzzle.');
    } finally {
      setSavingPuzzle(null);
    }
  }

  async function removePuzzle(form: PuzzleForm) {
    if (form.saved && form.savedId) {
      if (!confirm('Remove this puzzle?')) return;
      try {
        await api.delete(`/classrooms/${classroomId}/puzzles/${form.savedId}`);
      } catch {
        error('Failed to remove puzzle.');
        return;
      }
    }
    setPuzzleForms((prev) => prev.filter((f) => f.localId !== form.localId));
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post<{ id: number }>(`/classrooms/${classroomId}/classroom-lessons`, {
        title: title.trim(),
        content,
      });
      setLessonId(res.data.id);
      success('Lesson saved! You can now add puzzles below.');
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    router.push(`/collaborator/classrooms/${classroomId}?tab=lessons`);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}?tab=lessons`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Lessons
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-chess-dark">New Lesson</h1>
      </div>

      {/* Lesson form */}
      <form onSubmit={handleSaveLesson} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The London System — Key Ideas"
              maxLength={200}
              required
              disabled={!!lessonId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            {!lessonId ? (
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your lesson content here…"
              />
            ) : (
              <div
                className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50 text-gray-600"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>
        </div>

        {!lessonId && (
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Lesson'}
          </button>
        )}
      </form>

      {/* Puzzles section — only shown after lesson is saved */}
      {lessonId && (
        <div className="mt-6 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">End-of-Lesson Puzzles</h2>
                <p className="text-xs text-gray-500 mt-0.5">Optional — add puzzles for students to solve after reading this lesson.</p>
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

            <div className="space-y-6">
              {puzzleForms.map((form) => (
                <div key={form.localId} className={`border rounded-xl p-5 space-y-4 ${form.saved ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      {form.saved ? `✓ ${form.title || 'Puzzle'}` : 'New Puzzle'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removePuzzle(form)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  {!form.saved && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                          <input
                            type="text"
                            value={form.title}
                            onChange={(e) => updatePuzzleForm(form.localId, { title: e.target.value })}
                            placeholder="e.g. Spot the Opening Trap"
                            maxLength={120}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Due Date (optional)</label>
                          <input
                            type="datetime-local"
                            value={form.dueDate}
                            onChange={(e) => updatePuzzleForm(form.localId, { dueDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                        <textarea
                          value={form.description}
                          onChange={(e) => updatePuzzleForm(form.localId, { description: e.target.value })}
                          placeholder="Hint or context for students…"
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
                            updatePuzzleForm(form.localId, {
                              fen: f,
                              sideToMove: parts[1] === 'b' ? 'black' : 'white',
                            });
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
                                onChange={() => updatePuzzleForm(form.localId, { sideToMove: side })}
                                className="accent-chess-accent"
                              />
                              <span className="text-sm capitalize">{side} to move</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => savePuzzle(form, lessonId)}
                        disabled={savingPuzzle === form.localId || !form.title.trim()}
                        className="px-4 py-2 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
                      >
                        {savingPuzzle === form.localId ? 'Saving…' : 'Save Puzzle'}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
          >
            Finish & Go to Lessons
          </button>
        </div>
      )}
    </div>
  );
}
