'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface AdminClassroom {
  id: number;
  name: string;
  description?: string | null;
  inviteCode: string;
  isActive: boolean;
  createdAt: string;
  owner: { id: number; username: string; email: string };
  _count: { members: number; playlists: number };
}

interface ClassroomListData {
  classrooms: AdminClassroom[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminClassroomsPage() {
  const [data, setData] = useState<ClassroomListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ClassroomListData }>(`/admin/classrooms?page=${page}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-chess-dark dark:text-gray-100">Classrooms</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {data ? `${data.total} total classroom${data.total !== 1 ? 's' : ''}` : 'Manage all classrooms'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : !data || data.classrooms.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-3xl mb-2">🏫</p>
          <p>No classrooms created yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Classroom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Owner</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Students</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Playlists</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.classrooms.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{c.inviteCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 dark:text-gray-300">@{c.owner.username}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{c.owner.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{c._count.members}</td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{c._count.playlists}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.isActive
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300'
                      }`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:text-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
