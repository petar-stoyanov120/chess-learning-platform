'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { getRoleDisplayName } from '@/lib/url';
import CoachUserRow from '@/components/club-admin/CoachUserRow';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CoachUser {
  id: number;
  username: string;
  displayName?: string | null;
  email: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  role?: { name: string };
  club?: { id: number; name: string } | null;
  locationCoaches?: { location: { id: number; name: string } }[];
}

interface SearchUser {
  id: number;
  username: string;
  displayName?: string | null;
  email: string;
  role?: { name: string };
}

export default function CoachesPage() {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<CoachUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [demotingId, setDemotingId] = useState<number | null>(null);

  // Search / promote
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [promotingId, setPromotingId] = useState<number | null>(null);

  const clubName = user?.club?.name ?? undefined;

  const loadCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: CoachUser[] }>('/club-admin/coaches');
      setCoaches(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadCoaches();
  }, [user, loadCoaches]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.get<{ data: SearchUser[] }>(`/club-admin/users/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handlePromote(userId: number) {
    setPromotingId(userId);
    try {
      await api.post(`/club-admin/users/${userId}/promote`, {});
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      await loadCoaches();
    } catch { /* ignore */ } finally {
      setPromotingId(null);
    }
  }

  async function handleDemote(userId: number) {
    setDemotingId(userId);
    try {
      await api.delete(`/club-admin/users/${userId}/demote`);
      setCoaches((prev) => prev.filter((c) => c.id !== userId));
    } catch { /* ignore */ } finally {
      setDemotingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-chess-dark dark:text-white">Coaches</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage coaches for {clubName ?? 'your club'}
        </p>
      </div>

      {/* Promote user */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add a Coach</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Search for a user or collaborator to promote to {clubName ? `${clubName} Coach` : 'Coach'}.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-chess-dark text-white font-medium hover:bg-chess-gold hover:text-chess-dark disabled:opacity-60 transition-colors"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
            {searchResults.map((u) => {
              const displayName = u.displayName || u.username;
              const isAlreadyCoach = coaches.some((c) => c.id === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {u.role?.name ?? 'user'}
                    </span>
                    {isAlreadyCoach ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Already a coach</span>
                    ) : (
                      <button
                        onClick={() => handlePromote(u.id)}
                        disabled={promotingId === u.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-chess-gold text-chess-dark font-medium hover:bg-chess-gold/90 disabled:opacity-50 transition-colors"
                      >
                        {promotingId === u.id ? 'Promoting...' : `Make ${getRoleDisplayName('coach', clubName)}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchResults.length === 0 && searchQuery && !searching && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No users found. Try a different search.</p>
        )}
      </div>

      {/* Current coaches */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Current Coaches {coaches.length > 0 && <span className="text-gray-400 font-normal">({coaches.length})</span>}
        </h2>

        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : coaches.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            No coaches yet. Use the search above to promote a user.
          </p>
        ) : (
          <div>
            {coaches.map((coach) => (
              <CoachUserRow
                key={coach.id}
                user={coach}
                clubName={clubName}
                onDemote={handleDemote}
                isDemoting={demotingId === coach.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
