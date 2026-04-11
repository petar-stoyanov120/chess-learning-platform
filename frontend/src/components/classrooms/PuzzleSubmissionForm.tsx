'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassroomPuzzleSubmission } from '@/lib/types';

interface Props {
  classroomId: number;
  puzzleId: number;
  existingSubmission?: ClassroomPuzzleSubmission | null;
  onSubmitted: (submission: ClassroomPuzzleSubmission) => void;
}

export default function PuzzleSubmissionForm({ classroomId, puzzleId, existingSubmission, onSubmitted }: Props) {
  const { success, error } = useToast();
  const [notation, setNotation] = useState(existingSubmission?.notation ?? '');
  const [notes, setNotes] = useState(existingSubmission?.notes ?? '');
  const [loading, setLoading] = useState(false);

  const isLocked = Boolean(existingSubmission?.reviewedAt);
  const isEdit = Boolean(existingSubmission);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notation.trim()) {
      error('Please enter your move notation.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<ClassroomPuzzleSubmission>(
        `/classrooms/${classroomId}/puzzles/${puzzleId}/submit`,
        { notation: notation.trim(), notes: notes.trim() || undefined },
      );
      success(isEdit ? 'Submission updated.' : 'Answer submitted!');
      onSubmitted(res.data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to submit answer.');
    } finally {
      setLoading(false);
    }
  }

  if (isLocked) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
        This submission has been reviewed and is locked.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          rows={3}
          placeholder="e.g. Nf3, Rxe5+ Kd7 Rd5#"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-accent font-mono"
          style={{ fontFamily: 'monospace' }}
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">Use Standard Algebraic Notation (SAN)</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Thought Process
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Explain why you think this is the best move, what threats you see, what your plan is..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-accent"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-chess-accent text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-chess-accent/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting…' : isEdit ? 'Update Submission' : 'Submit Answer'}
      </button>
    </form>
  );
}
