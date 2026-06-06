'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProgressEntry {
  lessonId: number;
  completedAt: string;
}

export default function UserDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
    if (!isLoading && user && user.role !== 'user') {
      router.replace(user.role === 'admin' ? '/admin' : user.role === 'club_admin' ? '/club-admin' : '/collaborator');
    }
  }, [user, isLoading, router]);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const pr = await api.get<{ data: ProgressEntry[] }>('/lessons/my/progress');
      setProgress(pr.data);
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (isLoading || !user) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100 mb-1">My Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Welcome back, @{user.username}</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{progress.length}</div>
          <div className="text-sm text-green-600 dark:text-green-500">Lessons completed</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5">
          <div className="text-3xl mb-1">🏫</div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-400 mt-2">
            <Link href="/classrooms" className="hover:underline">Go to my classrooms →</Link>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div className="mt-4 pt-6 border-t dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/classrooms"
              className="border rounded-xl p-4 text-center font-medium hover:opacity-80 transition-opacity bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300"
            >
              My Classrooms
            </Link>
            <Link
              href="/classrooms/join"
              className="border rounded-xl p-4 text-center font-medium hover:opacity-80 transition-opacity bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
            >
              Join a Classroom
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
