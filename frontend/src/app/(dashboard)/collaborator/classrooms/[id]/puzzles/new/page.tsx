'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

const BoardSetupEditor = dynamic(() => import('@/components/chess/BoardSetupEditor'), { ssr: false });

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function NewPuzzlePage() {
  const { id } = useParams<{ id: string }>();
  const classroomId = Number(id);
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [maxMoves, setMaxMoves] = useState('');
  const [fen, setFen] = useState(STARTING_FEN);
  const [sideToMove, setSideToMove] = useState<'white' | 'black'>('white');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  function handleFenChange(newFen: string) {
    setFen(newFen);
    const parts = newFen.split(' ');
    if (parts[1] === 'b') setSideToMove('black');
    else if (parts[1] === 'w') setSideToMove('white');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fen.trim()) return;
    setSaving(true);
    try {
      await api.post(`/classrooms/${classroomId}/puzzles`, {
        title: title.trim(),
        description: description.trim() || undefined,
        solution: solution.trim() || undefined,
        maxMoves: maxMoves ? parseInt(maxMoves) : undefined,
        fen: fen.trim(),
        sideToMove,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      success('Puzzle created!');
      router.push(`/collaborator/classrooms/${classroomId}?tab=puzzles`);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to create puzzle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}?tab=puzzles`} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
          ← Puzzles
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <h1 className="text-xl font-bold text-chess-dark dark:text-gray-100">New Puzzle</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Find the Fork"
              maxLength={120}
              required
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hint or context for students…"
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Solution / Answer Key <span className="text-gray-400 dark:text-gray-500 font-normal">(optional — only visible to you)</span>
            </label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="e.g. 1. Nf3 Rxe5+ 2. Kd7 Rd5#"
              rows={2}
              maxLength={2000}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none font-mono"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your reference answer. Students cannot see this.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Due Date <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Move Limit <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                value={maxMoves}
                onChange={(e) => setMaxMoves(e.target.value)}
                min={1}
                max={30}
                placeholder="Unlimited"
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold w-full"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Students must solve in this many moves or fewer.</p>
            </div>
          </div>
        </div>

        {/* Board editor */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Chess Position</h2>
          </div>

          <BoardSetupEditor
            fen={fen}
            onFenChange={handleFenChange}
            size={400}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Side to Move</label>
            <div className="flex gap-4">
              {(['white', 'black'] as const).map((side) => (
                <label key={side} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={side}
                    checked={sideToMove === side}
                    onChange={() => setSideToMove(side)}
                    className="accent-chess-accent"
                  />
                  <span className="text-sm capitalize dark:text-gray-300">{side} to move</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              This tells students which side needs to find the answer.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/collaborator/classrooms/${classroomId}?tab=puzzles`}
            className="flex-1 text-center py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !title.trim() || !fen.trim()}
            className="flex-1 py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Puzzle'}
          </button>
        </div>
      </form>
    </div>
  );
}
