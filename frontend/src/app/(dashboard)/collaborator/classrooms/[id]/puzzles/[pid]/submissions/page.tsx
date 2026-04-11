'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { ClassroomPuzzle, ClassroomPuzzleSubmission } from '@/lib/types';
import PuzzleReviewForm from '@/components/classrooms/PuzzleReviewForm';

const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), { ssr: false });

export default function SubmissionsPage() {
  const { id, pid } = useParams<{ id: string; pid: string }>();
  const classroomId = Number(id);
  const puzzleId = Number(pid);
  const { error } = useToast();

  const [puzzle, setPuzzle] = useState<ClassroomPuzzle | null>(null);
  const [submissions, setSubmissions] = useState<ClassroomPuzzleSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get<ClassroomPuzzle>(`/classrooms/${classroomId}/puzzles/${puzzleId}`),
          api.get<ClassroomPuzzleSubmission[]>(`/classrooms/${classroomId}/puzzles/${puzzleId}/submissions`),
        ]);
        setPuzzle(pRes.data);
        setSubmissions(sRes.data);
      } catch {
        error('Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [classroomId, puzzleId]);

  function handleReviewed(updated: ClassroomPuzzleSubmission) {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
  }

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading…</div>;

  const pending = submissions.filter((s) => !s.reviewedAt);
  const reviewed = submissions.filter((s) => s.reviewedAt);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}?tab=puzzles`} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
          ← Puzzles
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <h1 className="text-xl font-bold text-chess-dark dark:text-gray-100">Submissions — {puzzle?.title}</h1>
      </div>

      {/* Puzzle recap */}
      {puzzle && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-4 flex gap-6 items-start flex-wrap">
          <ChessBoard fen={puzzle.fen} orientation={puzzle.sideToMove} size={160} />
          <div className="text-sm flex-1 min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{puzzle.title}</p>
            {puzzle.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{puzzle.description}</p>}
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {puzzle.sideToMove === 'white' ? '⬜' : '⬛'} {puzzle.sideToMove} to move
              {puzzle.maxMoves && <span className="ml-3 text-amber-600 dark:text-amber-400 font-medium">⏱ {puzzle.maxMoves} move{puzzle.maxMoves !== 1 ? 's' : ''} max</span>}
            </p>
            {puzzle.dueDate && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Due: {new Date(puzzle.dueDate).toLocaleString()}
              </p>
            )}
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              <span className="font-medium">{pending.length}</span> pending &nbsp;·&nbsp;
              <span className="font-medium">{reviewed.length}</span> reviewed
            </p>
          </div>
        </div>
      )}

      {/* Solution reference box — teacher only */}
      {puzzle?.solution && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">Your Answer Key (only visible to you)</p>
          <pre className="text-sm font-mono text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{puzzle.solution}</pre>
        </div>
      )}

      {submissions.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-500 dark:text-gray-400">
          No submissions yet.
        </div>
      )}

      {/* Needs review */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Needs Review ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                classroomId={classroomId}
                puzzleId={puzzleId}
                onReviewed={handleReviewed}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-4">
            {reviewed.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                classroomId={classroomId}
                puzzleId={puzzleId}
                onReviewed={handleReviewed}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  classroomId,
  puzzleId,
  onReviewed,
}: {
  submission: ClassroomPuzzleSubmission;
  classroomId: number;
  puzzleId: number;
  onReviewed: (updated: ClassroomPuzzleSubmission) => void;
}) {
  const student = submission.user;
  const isLate = submission.puzzle
    ? false
    : false; // Late check done on list view

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Student info + submission */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">
              {student?.displayName || student?.username || `User #${submission.userId}`}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Answer</p>
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-100 whitespace-pre-wrap">{submission.notation}</pre>
          </div>

          {submission.notes && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Thought Process</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{submission.notes}</p>
            </div>
          )}
        </div>

        {/* Review form / verdict */}
        <div className="w-56 shrink-0">
          <PuzzleReviewForm
            submission={submission}
            classroomId={classroomId}
            puzzleId={puzzleId}
            onReviewed={onReviewed}
          />
        </div>
      </div>
    </div>
  );
}
