'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BlogPostSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CollaboratorBlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.get<PaginatedResponse<BlogPostSummary>>('/blog/my/list?limit=50');
      setPosts((res as PaginatedResponse<BlogPostSummary>).data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(id: number) {
    setSubmitting(id);
    try {
      await api.patch(`/blog/${id}/submit`, {});
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
        <h1 className="text-2xl font-bold text-chess-dark">My Blog Posts</h1>
        <Link href="/collaborator/blog/new" className="bg-chess-dark text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-chess-accent">
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">✍️</div>
          <p>You haven&apos;t written any blog posts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="card p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{post.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</p>
                {post.status.name === 'rejected' && post.rejectionReason && (
                  <div className="mt-2 bg-red-50 border border-red-100 text-red-700 px-3 py-2 rounded text-sm">
                    <strong>Rejection reason:</strong> {post.rejectionReason}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={post.status.name === 'pending_review' ? 'pending' : post.status.name as 'published' | 'draft' | 'rejected'}>
                  {post.status.name.replace('_', ' ')}
                </Badge>
                {(post.status.name === 'draft' || post.status.name === 'rejected') && (
                  <>
                    <Link href={`/collaborator/blog/${post.id}/edit`} className="text-sm text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => submit(post.id)}
                      disabled={submitting === post.id}
                      className="text-sm bg-chess-dark text-white px-3 py-1 rounded-lg hover:bg-chess-accent disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
