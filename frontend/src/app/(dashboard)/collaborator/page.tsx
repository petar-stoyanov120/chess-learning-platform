'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { LessonSummary, BlogPostSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DailyLimit {
  used: number;
  limit: number;
  remaining: number;
  canPost: boolean;
}

export default function CollaboratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [dailyLimit, setDailyLimit] = useState<DailyLimit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') router.replace('/admin');
    if (user && user.role === 'user') router.replace('/');
  }, [user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [l, p, dl] = await Promise.allSettled([
        api.get<PaginatedResponse<LessonSummary>>('/lessons/my/list?limit=5'),
        api.get<PaginatedResponse<BlogPostSummary>>('/blog/my/list?limit=5'),
        api.get<{ data: DailyLimit }>('/profile/daily-limit'),
      ]);
      if (l.status === 'fulfilled') setLessons((l.value as PaginatedResponse<LessonSummary>).data);
      if (p.status === 'fulfilled') setPosts((p.value as PaginatedResponse<BlogPostSummary>).data);
      if (dl.status === 'fulfilled') setDailyLimit((dl.value as { data: DailyLimit }).data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const lessonsByStatus = {
    published: lessons.filter((l) => l.status.name === 'published').length,
    pending: lessons.filter((l) => l.status.name === 'pending_review').length,
    draft: lessons.filter((l) => l.status.name === 'draft').length,
    rejected: lessons.filter((l) => l.status.name === 'rejected').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100 mb-1">Collaborator Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Welcome, @{user?.username}</p>

      {/* Daily Limit Banner */}
      {dailyLimit && dailyLimit.limit !== null && (
        <div className={`rounded-xl p-4 mb-6 border ${
          dailyLimit.canPost
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{dailyLimit.canPost ? '✅' : '🚫'}</span>
            <div className="flex-1">
              <p className={`font-medium text-sm ${
                dailyLimit.canPost
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                Daily posts: {dailyLimit.used} of {dailyLimit.limit} used
                {dailyLimit.remaining !== null && dailyLimit.remaining > 0 && (
                  <span className="ml-1">· {dailyLimit.remaining} remaining today</span>
                )}
              </p>
              {!dailyLimit.canPost && (
                <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">Daily limit reached. You can post again tomorrow.</p>
              )}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: dailyLimit.limit }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${i < dailyLimit.used ? 'bg-red-400 dark:bg-red-500' : 'bg-green-300 dark:bg-green-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/collaborator/lessons/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">📚</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Submit a Lesson</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create and submit for review</p>
          </div>
        </Link>
        <Link href="/collaborator/blog/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">✍️</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Write a Blog Post</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Share your chess knowledge</p>
          </div>
        </Link>
        <Link href="/collaborator/classrooms" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">🏫</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">My Classrooms</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage teaching groups</p>
          </div>
        </Link>
      </div>

      {/* Submission Stats */}
      {!loading && lessons.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Published', count: lessonsByStatus.published, color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
            { label: 'Pending Review', count: lessonsByStatus.pending, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
            { label: 'Draft', count: lessonsByStatus.draft, color: 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300' },
            { label: 'Rejected', count: lessonsByStatus.rejected, color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-4`}>
              <div className="text-2xl font-bold">{s.count}</div>
              <div className="text-xs font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <>
          {lessons.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Lessons</h2>
                <Link href="/collaborator/lessons" className="text-sm text-chess-gold hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">{lesson.category.name} · {lesson.level.name}</p>
                      {lesson.status.name === 'rejected' && lesson.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-1">Rejected: {lesson.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={lesson.status.name === 'pending_review' ? 'pending' : lesson.status.name as 'published' | 'draft' | 'rejected'}>
                        {lesson.status.name.replace('_', ' ')}
                      </Badge>
                      <Link href={`/collaborator/lessons/${lesson.id}/edit`} className="text-xs text-chess-gold hover:underline">
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {posts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Blog Posts</h2>
                <Link href="/collaborator/blog" className="text-sm text-chess-gold hover:underline">View all →</Link>
              </div>
              <div className="space-y-2">
                {posts.map((post) => (
                  <div key={post.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{post.title}</p>
                      {post.status.name === 'rejected' && post.rejectionReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-1">Rejected: {post.rejectionReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={post.status.name === 'pending_review' ? 'pending' : post.status.name as 'published' | 'draft' | 'rejected'}>
                        {post.status.name.replace('_', ' ')}
                      </Badge>
                      <Link href={`/collaborator/blog/${post.id}/edit`} className="text-xs text-chess-gold hover:underline">
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lessons.length === 0 && posts.length === 0 && (
            <div className="card p-10 text-center text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">✏️</div>
              <p className="text-lg mb-2">No submissions yet</p>
              <p className="text-sm">Start by submitting a lesson or writing a blog post.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
