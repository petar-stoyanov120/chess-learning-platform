'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { LessonSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.get<PaginatedResponse<LessonSummary>>('/lessons/admin/all?limit=50');
      setLessons((res as PaginatedResponse<LessonSummary>).data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function deleteLesson(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/lessons/${id}`);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark">Lessons</h1>
          <p className="text-gray-500 mt-0.5">{lessons.length} total</p>
        </div>
        <Link href="/admin/lessons/new" className="bg-chess-dark text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-chess-accent transition-colors">
          + New Lesson
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Level</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Author</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs truncate">{lesson.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{lesson.category.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>{lesson.level.name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lesson.status.name === 'pending_review' ? 'pending' : lesson.status.name as 'published' | 'draft' | 'rejected'}>
                      {lesson.status.name.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">@{lesson.author.username}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/lessons/${lesson.id}/edit`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                      <button
                        onClick={() => deleteLesson(lesson.id, lesson.title)}
                        disabled={deleting === lesson.id}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lessons.length === 0 && (
            <div className="text-center py-12 text-gray-400">No lessons yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
