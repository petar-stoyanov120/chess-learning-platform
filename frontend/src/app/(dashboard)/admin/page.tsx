'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Stats {
  users: number;
  lessons: { total: number; published: number; pending: number };
  posts: { total: number; published: number; pending: number };
  totalPending: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/collaborator');
  }, [user, router]);

  useEffect(() => {
    api.get<{ data: Stats }>('/admin/stats')
      .then((res) => setStats((res as { data: Stats }).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-1">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Welcome back, @{user?.username}</p>

      {stats && stats.totalPending > 0 && (
        <Link href="/admin/approvals" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-amber-800">{stats.totalPending} submission{stats.totalPending !== 1 ? 's' : ''} waiting for review</p>
              <p className="text-sm text-amber-600">Click to review and approve</p>
            </div>
          </div>
        </Link>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-blue-50 text-blue-700', href: '/admin/users' },
            { label: 'Published Lessons', value: stats.lessons.published, icon: '📚', color: 'bg-green-50 text-green-700', href: '/admin/lessons' },
            { label: 'Published Posts', value: stats.posts.published, icon: '✍️', color: 'bg-purple-50 text-purple-700', href: '/admin/blog' },
            { label: 'Pending Review', value: stats.totalPending, icon: '⏳', color: 'bg-amber-50 text-amber-700', href: '/admin/approvals' },
          ].map((card) => (
            <Link key={card.label} href={card.href} className={`${card.color} rounded-xl p-5 hover:opacity-90 transition-opacity`}>
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm font-medium opacity-70">{card.label}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/lessons/new" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">➕</span>
          <div>
            <h3 className="font-semibold text-gray-900">Create Lesson</h3>
            <p className="text-sm text-gray-500">Write a new chess lesson</p>
          </div>
        </Link>
        <Link href="/admin/approvals" className="card p-6 hover:shadow-md transition-shadow flex items-center gap-4">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-semibold text-gray-900">Review Submissions</h3>
            <p className="text-sm text-gray-500">Approve or reject collaborator content</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
