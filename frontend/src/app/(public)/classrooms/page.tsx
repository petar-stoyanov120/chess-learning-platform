'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Classroom } from '@/lib/types';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MyClassroomsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [joined, setJoined] = useState<Classroom[]>([]);
  const [owned, setOwned] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: { owned: Classroom[]; joined: Classroom[] } }>('/classrooms');
      setOwned(res.data.owned ?? []);
      setJoined(res.data.joined ?? []);
    } catch {
      setJoined([]);
      setOwned([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-chess-dark">My Classrooms</h1>
          <p className="text-gray-500 mt-1">Your enrolled and managed chess classrooms</p>
        </div>
        <Link
          href="/classrooms/join"
          className="bg-chess-gold text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-dark transition-colors"
        >
          + Join a Classroom
        </Link>
      </div>

      {/* Classrooms I'm enrolled in as student */}
      {joined.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrolled As Student</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joined.map((c) => (
              <ClassroomCard key={c.id} classroom={c} role="member" />
            ))}
          </div>
        </section>
      )}

      {/* Classrooms I own (teacher) */}
      {owned.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Teaching Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {owned.map((c) => (
              <ClassroomCard key={c.id} classroom={c} role="owner" />
            ))}
          </div>
        </section>
      )}

      {joined.length === 0 && owned.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="font-semibold text-gray-900 text-xl mb-2">No classrooms yet</h2>
          <p className="text-gray-500 mb-6">Join a classroom with an invite code from your teacher, or create your own.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/classrooms/join"
              className="bg-chess-gold text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-chess-dark transition-colors"
            >
              Join with Invite Code
            </Link>
            {(user?.role === 'collaborator' || user?.role === 'admin') && (
              <Link
                href="/collaborator/classrooms/new"
                className="border border-chess-dark text-chess-dark px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Create a Classroom
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
