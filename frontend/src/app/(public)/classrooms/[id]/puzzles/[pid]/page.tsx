'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ClassroomPuzzle, ClassroomPuzzleSubmission } from '@/lib/types';
import PuzzleSubmissionForm from '@/components/classrooms/PuzzleSubmissionForm';
import SubmissionReviewPanel from '@/components/classrooms/SubmissionReviewPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), { ssr: false });

export default function StudentPuzzlePage() {
  const { id, pid } = useParams<{ id: string; pid: string }>();
  const classroomId = Number(id);
  const puzzleId = Number(pid);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [puzzle, setPuzzle] = useState<ClassroomPuzzle | null>(null);
  const [submission, setSubmission] = useState<ClassroomPuzzleSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([
          api.get<ClassroomPuzzle>(`/classrooms/${classroomId}/puzzles/${puzzleId}`),
          api.get<ClassroomPuzzleSubmission | null>(`/classrooms/${classroomId}/puzzles/${puzzleId}/my-submission`),
        ]);
        setPuzzle(pRes.data);
        setSubmission(sRes.data ?? null);
      } catch {
        router.replace(`/classrooms/${classroomId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, classroomId, puzzleId, router]);

  if (loading || isLoading || !puzzle) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const now = new Date();
  const isLate = puzzle.dueDate ? new Date(puzzle.dueDate) < now : false;
  const isReviewed = Boolean(submission?.reviewedAt);

  function statusBadge() {
    if (!submission) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Not submitted</span>;
    }
    if (!isReviewed) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Awaiting review</span>;
    }
    if (submission.isCorrect) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ Correct</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">✗ Incorrect</span>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6">
        <Link href="/classrooms" className="hover:text-gray-600 dark:hover:text-gray-300">Classrooms</Link>
        <span>/</span>
        <Link href={`/classrooms/${classroomId}?tab=puzzles`} className="hover:text-gray-600 dark:hover:text-gray-300">Puzzles</Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium truncate">{puzzle.title}</span>
      </div>

      {/* Puzzle header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100">{puzzle.title}</h1>
          {puzzle.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{puzzle.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {statusBadge()}
          {puzzle.dueDate && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              {isLate ? '⚠ Late' : `Due ${new Date(puzzle.dueDate).toLocaleDateString()}`}
            </span>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-6 flex flex-col items-center gap-3">
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-gray-100">
              {puzzle.sideToMove === 'white' ? '⬜ White' : '⬛ Black'} to move
            </span>
            <span className="text-gray-400 dark:text-gray-500 ml-2">— find the best move(s)</span>
          </p>
          {puzzle.maxMoves && (
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
              ⏱ Solve in {puzzle.maxMoves} move{puzzle.maxMoves !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ChessBoard fen={puzzle.fen} orientation={puzzle.sideToMove} size={400} />
      </div>

      {/* Submission section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Your Answer</h2>

        {isReviewed && submission ? (
          <SubmissionReviewPanel submission={submission} />
        ) : (
          <PuzzleSubmissionForm
            classroomId={classroomId}
            puzzleId={puzzleId}
            existingSubmission={submission}
            onSubmitted={setSubmission}
          />
        )}
      </div>
    </div>
  );
}
