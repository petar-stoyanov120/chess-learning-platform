'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Stats {
  users: number;
  classrooms: number;
  lessons: { total: number; published: number; pending: number; draft: number; rejected: number };
  posts: { total: number; published: number; pending: number; draft: number; rejected: number };
  totalPending: number;
}

interface PendingLesson {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  author: { username: string };
  category: { name: string };
  level: { name: string };
}

interface PendingPost {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  author: { username: string };
}

interface PendingData {
  lessons: PendingLesson[];
  posts: PendingPost[];
  total: number;
}

interface RecentUser {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  isActive: boolean;
  role: { name: string };
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingData | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/collaborator');
  }, [user, router]);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Stats }>('/admin/stats'),
      api.get<{ data: PendingData }>('/admin/pending'),
      api.get<{ data: RecentUser[] }>('/admin/recent-users'),
    ])
      .then(([s, p, u]) => {
        setStats((s as { data: Stats }).data);
        setPending((p as { data: PendingData }).data);
        setRecentUsers((u as { data: RecentUser[] }).data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const pendingPreview = pending
    ? [
        ...pending.lessons.slice(0, 3).map((l) => ({
          id: l.id,
          title: l.title,
          type: 'lesson' as const,
          author: l.author.username,
          meta: `${l.category.name} · ${l.level.name}`,
          createdAt: l.createdAt,
        })),
        ...pending.posts.slice(0, Math.max(0, 3 - pending.lessons.length)).map((p) => ({
          id: p.id,
          title: p.title,
          type: 'post' as const,
          author: p.author.username,
          meta: 'Blog Post',
          createdAt: p.createdAt,
        })),
      ].slice(0, 3)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100 mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Welcome back, @{user?.username}</p>

      {/* Pending alert */}
      {stats && stats.totalPending > 0 && (
        <Link
          href="/admin/approvals"
          className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">{stats.totalPending} submission{stats.totalPending !== 1 ? 's' : ''} waiting for review</p>
              <p className="text-sm text-amber-600 dark:text-amber-300">Click to review and approve</p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300', href: '/admin/users' },
            { label: 'Published Lessons', value: stats.lessons.published, icon: '📚', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300', href: '/admin/lessons' },
            { label: 'Published Posts', value: stats.posts.published, icon: '✍️', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300', href: '/admin/blog' },
            { label: 'Classrooms', value: stats.classrooms ?? 0, icon: '🏫', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300', href: '/admin/classrooms' },
            { label: 'Pending Review', value: stats.totalPending, icon: '⏳', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300', href: '/admin/approvals' },
          ].map((card) => (
            <Link key={card.label} href={card.href} className={`${card.color} rounded-xl p-5 hover:opacity-90 transition-opacity`}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm font-medium opacity-70">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending approvals preview */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Pending Approvals</h2>
            <Link href="/admin/approvals" className="text-sm text-chess-gold hover:underline">View all →</Link>
          </div>
          {pendingPreview.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No pending submissions</p>
          ) : (
            <div className="space-y-3">
              {pendingPreview.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">@{item.author} · {item.meta}</p>
                  </div>
                  <Link
                    href="/admin/approvals"
                    className="flex-shrink-0 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded hover:bg-amber-200 dark:hover:bg-amber-900/60"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Content breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Content Overview</h2>
          {stats && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Lessons</span>
                  <span className="text-gray-400 dark:text-gray-500">{stats.lessons.total} total</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="badge badge-published text-xs px-2 py-0.5">{stats.lessons.published} published</span>
                  <span className="badge badge-pending text-xs px-2 py-0.5">{stats.lessons.pending} pending</span>
                  {stats.lessons.draft > 0 && <span className="badge badge-draft text-xs px-2 py-0.5">{stats.lessons.draft} draft</span>}
                  {stats.lessons.rejected > 0 && <span className="badge badge-rejected text-xs px-2 py-0.5">{stats.lessons.rejected} rejected</span>}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Blog Posts</span>
                  <span className="text-gray-400 dark:text-gray-500">{stats.posts.total} total</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="badge badge-published text-xs px-2 py-0.5">{stats.posts.published} published</span>
                  <span className="badge badge-pending text-xs px-2 py-0.5">{stats.posts.pending} pending</span>
                  {stats.posts.draft > 0 && <span className="badge badge-draft text-xs px-2 py-0.5">{stats.posts.draft} draft</span>}
                  {stats.posts.rejected > 0 && <span className="badge badge-rejected text-xs px-2 py-0.5">{stats.posts.rejected} rejected</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent users */}
      {recentUsers.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-chess-gold hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">@{u.username}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.role.name === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
                      : u.role.name === 'collaborator'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>{u.role.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/lessons/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">➕</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create Lesson</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Write a new chess lesson</p>
          </div>
        </Link>
        <Link href="/admin/approvals" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Review Submissions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Approve or reject content</p>
          </div>
        </Link>
        <Link href="/admin/users" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">👥</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Manage Users</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">View and manage accounts</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
