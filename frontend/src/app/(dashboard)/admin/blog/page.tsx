'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { BlogPostSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    try {
      const res = await api.get<PaginatedResponse<BlogPostSummary>>('/blog/admin/all?limit=50');
      setPosts((res as PaginatedResponse<BlogPostSummary>).data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/blog/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark">Blog Posts</h1>
          <p className="text-gray-500 mt-0.5">{posts.length} total</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-chess-accent transition-colors"
        >
          + New Post
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">@{post.author.username}</td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status.name === 'pending_review' ? 'pending' : post.status.name as 'published' | 'draft' | 'rejected'}>
                      {post.status.name.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/blog/${post.id}/edit`} className="text-sm text-blue-600 hover:underline">Edit</Link>
                      <button
                        onClick={() => deletePost(post.id, post.title)}
                        disabled={deleting === post.id}
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
          {posts.length === 0 && <div className="text-center py-12 text-gray-400">No blog posts yet.</div>}
        </div>
      </div>
    </div>
  );
}
