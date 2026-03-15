'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LessonSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CollaboratorLessonsPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.get<PaginatedResponse<LessonSummary>>('/lessons/my/list?limit=50');
      setLessons((res as PaginatedResponse<LessonSummary>).data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(id: number) {
    setSubmitting(id);
    try {
      await api.patch(`/lessons/${id}/submit`, {});
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-chess-dark">My Lessons</h1>
        <Link href="/collaborator/lessons/new" className="bg-chess-dark text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-chess-accent transition-colors">
          + New Lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📚</div>
          <p>You haven&apos;t submitted any lessons yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5 capitalize">{lesson.category.name} · {lesson.level.name}</p>
                  {lesson.status.name === 'rejected' && lesson.rejectionReason && (
                    <div className="mt-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded text-sm">
                      <strong>Rejection reason:</strong> {lesson.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={lesson.status.name === 'pending_review' ? 'pending' : lesson.status.name as 'published' | 'draft' | 'rejected'}>
                    {lesson.status.name.replace('_', ' ')}
                  </Badge>
                  {(lesson.status.name === 'draft' || lesson.status.name === 'rejected') && (
                    <>
                      <Link href={`/collaborator/lessons/${lesson.id}/edit`} className="text-sm text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => submit(lesson.id)}
                        disabled={submitting === lesson.id}
                        className="text-sm bg-chess-dark text-white px-3 py-1 rounded-lg hover:bg-chess-accent disabled:opacity-50"
                      >
                        Submit for Review
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
