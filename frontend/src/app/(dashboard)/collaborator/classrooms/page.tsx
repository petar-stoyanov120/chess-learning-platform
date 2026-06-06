'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Classroom } from '@/lib/types';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CollaboratorClassroomsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'user') router.replace('/');
    if (user && user.role === 'admin') router.replace('/admin/classrooms');
  }, [user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { owned: Classroom[] } }>('/classrooms');
      setClassrooms(res.data.owned ?? []);
    } catch {
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark">My Classrooms</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your teaching groups and playlists</p>
        </div>
        <Link
          href="/collaborator/classrooms/new"
          className="bg-chess-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
        >
          + New Classroom
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : classrooms.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="font-semibold text-gray-900 mb-2">No classrooms yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Create a classroom for your chess club or school group. Students join with an invite code.
          </p>
          <Link
            href="/collaborator/classrooms/new"
            className="bg-chess-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors"
          >
            Create Your First Classroom
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((c) => (
              <ClassroomCard key={c.id} classroom={c} role="owner" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
