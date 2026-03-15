'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function isLocked(user: User): boolean {
  return !!user.lockedUntil && new Date(user.lockedUntil) > new Date();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    api.get<PaginatedResponse<User>>('/users?limit=50')
      .then((res) => setUsers((res as PaginatedResponse<User>).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(userId: number, role: string) {
    setUpdating(userId);
    try {
      const res = await api.patch<{ data: User }>(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? (res as { data: User }).data : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setUpdating(null);
    }
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
      <h1 className="text-2xl font-bold text-chess-dark mb-6">User Management</h1>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Locked</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">@{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role.name}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      disabled={updating === user.id}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-chess-gold"
                    >
                      <option value="user">User</option>
                      <option value="collaborator">Collaborator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'published' : 'rejected'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {isLocked(user) ? (
                      <Badge variant="rejected">Locked</Badge>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => toggleStatus(user)}
                      disabled={updating === user.id}
                      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {isLocked(user) && (
                      <button
                        onClick={() => unlockUser(user.id)}
                        disabled={updating === user.id}
                        className="text-sm text-green-600 hover:underline disabled:opacity-50"
                      >
                        Unlock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
