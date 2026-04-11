'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Classroom } from '@/lib/types';
import { useToast } from '@/lib/toast';

export default function JoinClassroomPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();

  const [code, setCode] = useState(params.get('code') ?? '');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?redirect=/classrooms/join');
  }, [user, isLoading, router]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setJoining(true);
    try {
      const res = await api.post<{ data: Classroom }>('/classrooms/join', { inviteCode: code.trim().toUpperCase() });
      showToast(`Joined "${res.data?.name}"!`, 'success');
      router.push(`/classrooms/${res.data?.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid invite code. Please try again.', 'error');
    } finally {
      setJoining(false);
    }
  }

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-2xl font-bold text-chess-dark">Join a Classroom</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter the invite code your teacher gave you</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. CHESS4"
                maxLength={8}
                required
                autoFocus
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-bold font-mono tracking-widest uppercase focus:outline-none focus:border-chess-gold"
              />
            </div>
            <button
              type="submit"
              disabled={joining || !code.trim()}
              className="w-full py-3 bg-chess-dark text-white rounded-xl text-sm font-semibold hover:bg-chess-gold transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Classroom'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/classrooms" className="text-chess-gold hover:underline">← Back to My Classrooms</Link>
        </p>
      </div>
    </div>
  );
}
