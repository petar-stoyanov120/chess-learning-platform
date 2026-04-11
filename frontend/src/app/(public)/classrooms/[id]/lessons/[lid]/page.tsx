'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ClassroomLesson, ClassroomPuzzle, ClassroomPuzzleSubmission } from '@/lib/types';
import SanitizedHtml from '@/components/ui/SanitizedHtml';
import PuzzleSubmissionForm from '@/components/classrooms/PuzzleSubmissionForm';
import SubmissionReviewPanel from '@/components/classrooms/SubmissionReviewPanel';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), { ssr: false });

export default function StudentLessonPage() {
  const { id, lid } = useParams<{ id: string; lid: string }>();
  const classroomId = Number(id);
  const lessonId = Number(lid);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState<ClassroomLesson | null>(null);
  const [submissions, setSubmissions] = useState<Record<number, ClassroomPuzzleSubmission | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const res = await api.get<ClassroomLesson>(`/classrooms/${classroomId}/classroom-lessons/${lessonId}`);
        setLesson(res.data);
        // Load submissions for each puzzle in parallel
        if (res.data.puzzles && res.data.puzzles.length > 0) {
          const submissionResults = await Promise.allSettled(
            res.data.puzzles.map((pz: ClassroomPuzzle) =>
              api.get<ClassroomPuzzleSubmission>(`/classrooms/${classroomId}/puzzles/${pz.id}/my-submission`)
                .then((r) => ({ puzzleId: pz.id, submission: r.data }))
                .catch(() => ({ puzzleId: pz.id, submission: null })),
            ),
          );
          const submMap: Record<number, ClassroomPuzzleSubmission | null> = {};
          submissionResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              submMap[result.value.puzzleId] = result.value.submission;
            }
          });
          setSubmissions(submMap);
        }
      } catch {
        router.replace(`/classrooms/${classroomId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, classroomId, lessonId, router]);

  if (loading || isLoading || !lesson) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const puzzles = lesson.puzzles ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href={`/classrooms/${classroomId}`} className="hover:text-gray-600">Classroom</Link>
        <span>/</span>
        <Link href={`/classrooms/${classroomId}?tab=lessons`} className="hover:text-gray-600">Lessons</Link>
        <span>/</span>
        <span className="text-gray-600 truncate">{lesson.title}</span>
      </div>

      {/* Lesson title */}
      <h1 className="text-2xl font-bold text-chess-dark mb-6">{lesson.title}</h1>

      {/* Lesson content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <SanitizedHtml html={lesson.content ?? ''} className="prose prose-sm max-w-none" />
      </div>

      {/* Puzzles section */}
      {puzzles.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Practice Puzzles
            </h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {puzzles.map((pz, idx) => {
            const submission = submissions[pz.id] ?? null;
            const isLate = pz.dueDate ? new Date(pz.dueDate) < new Date() : false;

            return (
              <div key={pz.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {/* Puzzle header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Puzzle {idx + 1}</p>
                      <h3 className="font-semibold text-gray-800">{pz.title}</h3>
                      {pz.description && (
                        <p className="text-sm text-gray-500 mt-1">{pz.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-xs">
                      {submission === null && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Not submitted</span>
                      )}
                      {submission && !submission.reviewedAt && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Awaiting review</span>
                      )}
                      {submission?.reviewedAt && submission.isCorrect === true && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Correct</span>
                      )}
                      {submission?.reviewedAt && submission.isCorrect === false && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">✗ Incorrect</span>
                      )}
                      {pz.dueDate && (
                        <span className={`px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          {isLate ? '⚠ Late' : `Due ${new Date(pz.dueDate).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Board */}
                <div className="p-5 bg-gray-50/50">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs text-gray-500 self-start">
                      {pz.sideToMove === 'white' ? 'White' : 'Black'} to move
                    </p>
                    <ChessBoard
                      fen={pz.fen}
                      orientation={pz.sideToMove as 'white' | 'black'}
                      size={300}
                    />
                  </div>
                </div>

                {/* Submission area */}
                <div className="p-5">
                  {!submission?.reviewedAt ? (
                    <PuzzleSubmissionForm
                      classroomId={classroomId}
                      puzzleId={pz.id}
                      existingSubmission={submission}
                      onSubmitted={(sub) =>
                        setSubmissions((prev) => ({ ...prev, [pz.id]: sub }))
                      }
                    />
                  ) : (
                    <SubmissionReviewPanel submission={submission} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {puzzles.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">No practice puzzles for this lesson.</p>
      )}
    </div>
  );
}
