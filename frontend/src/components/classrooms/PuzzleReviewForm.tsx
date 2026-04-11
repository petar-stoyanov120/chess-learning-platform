'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassroomPuzzleSubmission } from '@/lib/types';

interface Props {
  submission: ClassroomPuzzleSubmission;
  classroomId: number;
  puzzleId: number;
  onReviewed: (updated: ClassroomPuzzleSubmission) => void;
}

export default function PuzzleReviewForm({ submission, classroomId, puzzleId, onReviewed }: Props) {
  const { success, error } = useToast();
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    submission.reviewedAt != null ? (submission.isCorrect ?? null) : null,
  );
  const [feedback, setFeedback] = useState(submission.coachFeedback ?? '');
  const [loading, setLoading] = useState(false);

  // Display-only mode if already reviewed
  if (submission.reviewedAt) {
    return (
      <div className="space-y-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            submission.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {submission.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </span>
        {submission.coachFeedback && (
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{submission.coachFeedback}</p>
        )}
      </div>
    );
  }

  async function handleSave() {
    if (isCorrect === null) {
      error('Please select Correct or Incorrect.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch<ClassroomPuzzleSubmission>(
        `/classrooms/${classroomId}/puzzles/${puzzleId}/submissions/${submission.id}`,
        { isCorrect, coachFeedback: feedback.trim() || undefined },
      );
      success('Review saved.');
      onReviewed(res.data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Failed to save review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Correct / Incorrect toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsCorrect(true)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            isCorrect === true
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
          }`}
        >
          ✓ Correct
        </button>
        <button
          type="button"
          onClick={() => setIsCorrect(false)}
          className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            isCorrect === false
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
          }`}
        >
          ✗ Incorrect
        </button>
      </div>

      {/* Feedback */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        placeholder="Optional feedback for the student…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-accent"
        disabled={loading}
      />

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || isCorrect === null}
        className="bg-chess-dark text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save Review'}
      </button>
    </div>
  );
}
