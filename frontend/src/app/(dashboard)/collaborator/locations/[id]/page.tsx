'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Location, LocationNotice, Classroom } from '@/lib/types';
import LocationNoticeList from '@/components/locations/LocationNoticeList';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type Tab = 'groups' | 'notices' | 'coaches';

export default function LocationDashboard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [location, setLocation] = useState<Location | null>(null);
  const [groups, setGroups] = useState<Classroom[]>([]);
  const [notices, setNotices] = useState<LocationNotice[]>([]);
  const [tab, setTab] = useState<Tab>('groups');
  const [loading, setLoading] = useState(true);

  const isCoach = location?.myRole === 'owner' || location?.myRole === 'coach';
  const isOwner = location?.myRole === 'owner' || user?.role === 'admin';

  const loadLocation = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, groupRes, noticeRes] = await Promise.all([
        api.get<{ data: Location }>(`/locations/${id}`),
        api.get<{ data: Classroom[] }>(`/locations/${id}/classrooms`).catch(() => ({ data: [] })),
        api.get<{ data: LocationNotice[] }>(`/locations/${id}/notices`).catch(() => ({ data: [] })),
      ]);
      setLocation(locRes.data);
      setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
      setNotices(Array.isArray(noticeRes.data) ? noticeRes.data : []);
    } catch {
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) loadLocation();
  }, [user, loadLocation]);

  async function handleApprove(noticeId: number) {
    try {
      await api.post(`/locations/${id}/notices/${noticeId}/approve`, {});
      setNotices((prev) => prev.map((n) => n.id === noticeId ? { ...n, status: 'approved' as const } : n));
    } catch { /* ignore */ }
  }

  async function handleReject(noticeId: number) {
    try {
      await api.post(`/locations/${id}/notices/${noticeId}/reject`, {});
      setNotices((prev) => prev.map((n) => n.id === noticeId ? { ...n, status: 'rejected' as const } : n));
    } catch { /* ignore */ }
  }

  async function handleDeleteNotice(noticeId: number) {
    try {
      await api.delete(`/locations/${id}/notices/${noticeId}`);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    } catch { /* ignore */ }
  }

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (!location) return <div className="text-center py-20 text-gray-500">Location not found.</div>;

  const pendingCount = notices.filter((n) => n.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/collaborator/locations" className="text-sm text-gray-400 hover:text-chess-gold transition-colors">
              ← Locations
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-chess-dark dark:text-white">{location.name}</h1>
          {location.club && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{location.club.name}</p>
          )}
          {location.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{location.description}</p>
          )}
          {location.address && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {location.address}</p>
          )}
          {location.scheduleInfo && (
            <p className="text-sm text-gray-500 dark:text-gray-400">🕐 {location.scheduleInfo}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <Link
              href={`/collaborator/locations/${id}/edit`}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Edit
            </Link>
          )}
          {isCoach && (
            <Link
              href={`/collaborator/classrooms/new?locationId=${id}`}
              className="text-sm px-4 py-1.5 rounded-lg bg-chess-dark dark:bg-chess-gold text-white dark:text-chess-dark font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
            >
              + New Group
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-1">
        {(['groups', 'notices', 'coaches'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-chess-gold text-chess-dark dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t}
            {t === 'notices' && pendingCount > 0 && isCoach && (
              <span className="ml-1.5 text-xs bg-amber-500 text-white rounded-full px-1.5 py-0.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'groups' && (
        <div>
          {groups.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm">No groups yet. Create a classroom group for this location.</p>
              {isCoach && (
                <Link
                  href={`/collaborator/classrooms/new?locationId=${id}`}
                  className="mt-4 inline-block text-sm px-4 py-2 rounded-lg bg-chess-dark text-white hover:bg-chess-gold hover:text-chess-dark transition-colors"
                >
                  + Create Group
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((c) => (
                <ClassroomCard key={c.id} classroom={c} role={isCoach ? 'owner' : 'member'} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'notices' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Location Board</h2>
            <Link
              href={`/collaborator/locations/${id}/notices/new`}
              className="text-sm px-3 py-1.5 rounded-lg bg-chess-dark dark:bg-chess-gold text-white dark:text-chess-dark font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
            >
              + Post Notice
            </Link>
          </div>
          <LocationNoticeList
            notices={notices}
            isCoach={isCoach}
            onApprove={isCoach ? handleApprove : undefined}
            onReject={isCoach ? handleReject : undefined}
            onDelete={isCoach ? handleDeleteNotice : undefined}
          />
        </div>
      )}

      {tab === 'coaches' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Coaches at this location</h2>
          </div>
          {(location.coaches ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">No coaches listed.</p>
          ) : (
            <div className="space-y-3">
              {(location.coaches ?? []).map((lc) => (
                <div key={lc.id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-chess-gold/20 flex items-center justify-center text-chess-dark font-bold text-sm shrink-0">
                    {(lc.user.displayName || lc.user.username)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {lc.user.displayName || lc.user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{lc.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
