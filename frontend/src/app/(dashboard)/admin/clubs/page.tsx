'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Club } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminClubsPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Club[] }>('/admin/clubs');
      setClubs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadClubs();
  }, [user, loadClubs]);

  async function handleDelete(clubId: number, clubName: string) {
    if (!confirm(`Delete "${clubName}"? This will remove all club admins and coaches from this club.`)) return;
    setDeletingId(clubId);
    try {
      await api.delete(`/admin/clubs/${clubId}`);
      setClubs((prev) => prev.filter((c) => c.id !== clubId));
    } catch { /* ignore */ } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark dark:text-white">Clubs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage chess clubs on the platform
          </p>
        </div>
        <Link
          href="/admin/clubs/new"
          className="bg-chess-dark text-white dark:bg-chess-gold dark:text-chess-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
        >
          + New Club
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : clubs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">♟</div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No clubs yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Create a club to group coaches and locations under a named organisation.
          </p>
          <Link
            href="/admin/clubs/new"
            className="bg-chess-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
          >
            Create First Club
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700">
          {clubs.map((club) => (
            <div key={club.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-chess-gold/20 flex items-center justify-center text-chess-dark font-bold shrink-0">
                    {club.name[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{club.name}</p>
                  {club.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{club.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!club.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    Inactive
                  </span>
                )}
                <Link
                  href={`/admin/clubs/${club.id}/edit`}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(club.id, club.name)}
                  disabled={deletingId === club.id}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  {deletingId === club.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
