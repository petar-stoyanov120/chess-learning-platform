'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

interface PendingLesson {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  author: { id: number; username: string };
  category: { name: string; slug: string };
  level: { name: string };
}

interface PendingPost {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  author: { id: number; username: string };
}

interface Pending {
  lessons: PendingLesson[];
  posts: PendingPost[];
  total: number;
}

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [rejectModal, setRejectModal] = useState<{ type: 'lesson' | 'post'; id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load() {
    try {
      const res = await api.get<{ data: Pending }>('/admin/pending');
      setPending((res as { data: Pending }).data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(type: 'lesson' | 'post', id: number) {
    const key = `${type}-${id}`;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const path = type === 'lesson' ? `/lessons/${id}/approve` : `/blog/${id}/approve`;
      await api.patch(path, {});
      await load();
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  async function reject(type: 'lesson' | 'post', id: number, reason: string) {
    const key = `${type}-${id}`;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const path = type === 'lesson' ? `/lessons/${id}/reject` : `/blog/${id}/reject`;
      await api.patch(path, { reason });
      setRejectModal(null);
      setRejectReason('');
      await load();
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-1">Pending Approvals</h1>
      <p className="text-gray-500 mb-8">{pending?.total || 0} submission{pending?.total !== 1 ? 's' : ''} waiting</p>

      {pending?.total === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-lg">All caught up! No pending submissions.</p>
        </div>
      )}

      {/* Lessons */}
      {(pending?.lessons.length || 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📚 Lessons <Badge variant="pending">{pending!.lessons.length}</Badge></h2>
          <div className="space-y-3">
            {pending!.lessons.map((lesson) => (
              <div key={lesson.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    by @{lesson.author.username} · {lesson.category.name} · <span className="capitalize">{lesson.level.name}</span> · {new Date(lesson.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve('lesson', lesson.id)}
                    disabled={processing[`lesson-${lesson.id}`]}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ type: 'lesson', id: lesson.id })}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog posts */}
      {(pending?.posts.length || 0) > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">✍️ Blog Posts <Badge variant="pending">{pending!.posts.length}</Badge></h2>
          <div className="space-y-3">
            {pending!.posts.map((post) => (
              <div key={post.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    by @{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve('post', post.id)}
                    disabled={processing[`post-${post.id}`]}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ type: 'post', id: post.id })}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-3">Reject Submission</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason so the author can improve their submission.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
              placeholder="e.g. Content needs more detail, incorrect information..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => reject(rejectModal.type, rejectModal.id, rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold text-sm disabled:opacity-50 hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
