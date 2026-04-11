'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, Club, PaginatedResponse } from '@/lib/types';
import { getRoleDisplayName } from '@/lib/url';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type UserRole = 'admin' | 'club_admin' | 'collaborator' | 'coach' | 'user';

const CLUB_ROLES: UserRole[] = ['club_admin', 'coach'];

function isLocked(user: User): boolean {
  return !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Per-user pending role edits (before saving)
  const [pendingRole, setPendingRole] = useState<Record<number, string>>({});
  const [pendingClubId, setPendingClubId] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, clubsRes] = await Promise.allSettled([
        api.get<PaginatedResponse<User>>('/users?limit=100'),
        api.get<{ data: Club[] }>('/admin/clubs'),
      ]);
      if (usersRes.status === 'fulfilled') setUsers((usersRes.value as PaginatedResponse<User>).data);
      if (clubsRes.status === 'fulfilled') setClubs(Array.isArray(clubsRes.value.data) ? clubsRes.value.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleRoleChange(userId: number, role: string) {
    setPendingRole((prev) => ({ ...prev, [userId]: role }));
    // Clear clubId if role doesn't need a club
    if (!CLUB_ROLES.includes(role as UserRole)) {
      setPendingClubId((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  }

  function getCurrentRole(user: User): string {
    return pendingRole[user.id] ?? user.role.name;
  }

  function hasPendingChange(user: User): boolean {
    const role = pendingRole[user.id];
    if (!role) return false;
    if (CLUB_ROLES.includes(role as UserRole) && !pendingClubId[user.id]) return false;
    return true;
  }

  async function saveRoleChange(userId: number) {
    const role = pendingRole[userId];
    if (!role) return;
    setUpdating(userId);
    try {
      const body: Record<string, unknown> = { role };
      if (CLUB_ROLES.includes(role as UserRole) && pendingClubId[userId]) {
        body.clubId = Number(pendingClubId[userId]);
      }
      const res = await api.patch<{ data: User }>(`/admin/users/${userId}/role`, body);
      setUsers((prev) => prev.map((u) => u.id === userId ? (res as { data: User }).data : u));
      setPendingRole((prev) => { const n = { ...prev }; delete n[userId]; return n; });
      setPendingClubId((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setUpdating(null);
    }
  }

  function cancelRoleChange(userId: number) {
    setPendingRole((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    setPendingClubId((prev) => { const n = { ...prev }; delete n[userId]; return n; });
  }

  async function toggleStatus(user: User) {
    setUpdating(user.id);
    try {
      const res = await api.patch<{ data: User }>(`/users/${user.id}/status`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? (res as { data: User }).data : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  }

  async function unlockUser(userId: number) {
    setUpdating(userId);
    try {
      const res = await api.patch<{ data: User }>(`/users/${userId}/unlock`, {});
      setUsers((prev) => prev.map((u) => u.id === userId ? (res as { data: User }).data : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unlock user.');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-chess-dark dark:text-white">User Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} users</p>
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Club</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => {
                const currentRole = getCurrentRole(user);
                const needsClub = CLUB_ROLES.includes(currentRole as UserRole);
                const isPending = !!pendingRole[user.id];
                const canSave = hasPendingChange(user);
                const userClubName = (user as User & { club?: { name: string } }).club?.name;

                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.displayName ? (
                          <>
                            {user.displayName}
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">@{user.username}</span>
                          </>
                        ) : (
                          <span>@{user.username}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <select
                          value={currentRole}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updating === user.id}
                          className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-chess-gold"
                        >
                          <option value="user">User</option>
                          <option value="collaborator">Collaborator</option>
                          <option value="coach">{getRoleDisplayName('coach')}</option>
                          <option value="club_admin">{getRoleDisplayName('club_admin')}</option>
                          <option value="admin">Admin</option>
                        </select>

                        {needsClub && (
                          <select
                            value={pendingClubId[user.id] ?? ''}
                            onChange={(e) => setPendingClubId((prev) => ({ ...prev, [user.id]: e.target.value }))}
                            disabled={updating === user.id}
                            className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-chess-gold w-full"
                          >
                            <option value="">— Select club —</option>
                            {clubs.map((club) => (
                              <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                          </select>
                        )}

                        {isPending && (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => saveRoleChange(user.id)}
                              disabled={!canSave || updating === user.id}
                              className="text-xs px-2 py-0.5 rounded bg-chess-gold text-chess-dark font-medium disabled:opacity-40 hover:bg-chess-gold/90"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => cancelRoleChange(user.id)}
                              className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {userClubName ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-chess-gold/10 text-chess-dark dark:text-chess-gold font-medium">
                          {userClubName}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={user.isActive ? 'published' : 'rejected'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {isLocked(user) && (
                          <Badge variant="rejected">Locked</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => toggleStatus(user)}
                          disabled={updating === user.id}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 text-left"
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        {isLocked(user) && (
                          <button
                            onClick={() => unlockUser(user.id)}
                            disabled={updating === user.id}
                            className="text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50 text-left"
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
