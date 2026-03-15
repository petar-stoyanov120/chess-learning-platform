'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LessonSummary, BlogPostSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';

export default function CollaboratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);

  useEffect(() => {
    if (user && user.role === 'admin') router.replace('/admin');
    if (user && user.role === 'user') router.replace('/');
  }, [user, router]);

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<LessonSummary>>('/lessons/my/list?limit=5'),
      api.get<PaginatedResponse<BlogPostSummary>>('/blog/my/list?limit=5'),
    ]).then(([l, p]) => {
      setLessons((l as PaginatedResponse<LessonSummary>).data);
      setPosts((p as PaginatedResponse<BlogPostSummary>).data);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-1">Collaborator Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome, @{user?.username}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/collaborator/lessons/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">📚</span>
          <div>
            <h3 className="font-semibold text-gray-900">Submit a Lesson</h3>
            <p className="text-sm text-gray-500">Create and submit for review</p>
          </div>
        </Link>
        <Link href="/collaborator/blog/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">✍️</span>
          <div>
            <h3 className="font-semibold text-gray-900">Write a Blog Post</h3>
            <p className="text-sm text-gray-500">Share your chess knowledge</p>
          </div>
        </Link>
      </div>

      {lessons.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Lessons</h2>
            <Link href="/collaborator/lessons" className="text-sm text-chess-gold hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{lesson.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{lesson.category.name} · {lesson.level.name}</p>
                  {lesson.status.name === 'rejected' && lesson.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Rejected: {lesson.rejectionReason}</p>
                  )}
                </div>
                <Badge variant={lesson.status.name === 'pending_review' ? 'pending' : lesson.status.name as 'published' | 'draft' | 'rejected'}>
                  {lesson.status.name.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Blog Posts</h2>
            <Link href="/collaborator/blog" className="text-sm text-chess-gold hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{post.title}</p>
                  {post.status.name === 'rejected' && post.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Rejected: {post.rejectionReason}</p>
                  )}
                </div>
                <Badge variant={post.status.name === 'pending_review' ? 'pending' : post.status.name as 'published' | 'draft' | 'rejected'}>
                  {post.status.name.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
