'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CoachUser {
  id: number;
  username: string;
  displayName?: string | null;
  email: string;
  locationCoaches?: { location: { id: number; name: string } }[];
}

export default function ClubAdminDashboard() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [coaches, setCoaches] = useState<CoachUser[]>([]);
  const [loading, setLoading] = useState(true);

  const clubName = user?.club?.name ?? 'Your Club';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locRes, coachRes] = await Promise.all([
        api.get<{ data: Location[] }>('/locations').catch(() => ({ data: [] as Location[] })),
        api.get<{ data: CoachUser[] }>('/club-admin/coaches').catch(() => ({ data: [] as CoachUser[] })),
      ]);
      setLocations(Array.isArray(locRes.data) ? locRes.data : []);
      setCoaches(Array.isArray(coachRes.data) ? coachRes.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  const unassignedCoaches = coaches.filter((c) => !c.locationCoaches?.length);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-chess-dark dark:text-white">{clubName} Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage your club's locations and coaches
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Locations"
          value={locations.length}
          href="/collaborator/locations"
          action="View all"
        />
        <StatCard
          label="Coaches"
          value={coaches.length}
          href="/club-admin/coaches"
          action="Manage"
        />
        {unassignedCoaches.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5">
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{unassignedCoaches.length}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">Unassigned coaches</p>
            <Link
              href="/club-admin/coaches"
              className="text-xs text-amber-700 dark:text-amber-300 hover:underline mt-2 inline-block font-medium"
            >
              Assign now →
            </Link>
          </div>
        )}
      </div>

      {/* Locations overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Locations</h2>
          <div className="flex gap-2">
            <Link
              href="/collaborator/locations/new"
              className="text-sm px-3 py-1.5 rounded-lg bg-chess-dark dark:bg-chess-gold text-white dark:text-chess-dark font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
            >
              + New Location
            </Link>
            <Link
              href="/collaborator/locations"
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View all
            </Link>
          </div>
        </div>

        {locations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              No locations yet. Create a location for each school or venue.
            </p>
            <Link
              href="/collaborator/locations/new"
              className="text-sm px-4 py-2 rounded-lg bg-chess-dark text-white hover:bg-chess-gold hover:text-chess-dark transition-colors"
            >
              Create First Location
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700">
            {locations.slice(0, 5).map((loc) => (
              <Link
                key={loc.id}
                href={`/collaborator/locations/${loc.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{loc.name}</p>
                  {loc.address && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{loc.address}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {loc._count && (
                    <span className="text-xs text-gray-400">{loc._count.classrooms} groups</span>
                  )}
                  <span className="text-xs text-chess-gold font-medium capitalize">
                    {loc.myRole ?? 'view'}
                  </span>
                </div>
              </Link>
            ))}
            {locations.length > 5 && (
              <Link
                href="/collaborator/locations"
                className="flex items-center justify-center px-4 py-3 text-sm text-chess-gold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-b-2xl"
              >
                View all {locations.length} locations →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Coaches overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Coaches</h2>
          <Link
            href="/club-admin/coaches"
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Manage coaches
          </Link>
        </div>

        {coaches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No coaches yet. Promote a user to coach from the Coaches page.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700">
            {coaches.slice(0, 5).map((coach) => {
              const displayName = coach.displayName || coach.username;
              const locationNames = coach.locationCoaches?.map((lc) => lc.location.name) ?? [];
              return (
                <div key={coach.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-chess-gold/20 flex items-center justify-center text-chess-dark font-bold text-sm shrink-0">
                    {displayName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayName}</p>
                    {locationNames.length > 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {locationNames.join(', ')}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">Not assigned to any location</p>
                    )}
                  </div>
                </div>
              );
            })}
            {coaches.length > 5 && (
              <Link
                href="/club-admin/coaches"
                className="flex items-center justify-center px-4 py-3 text-sm text-chess-gold hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-b-2xl"
              >
                View all {coaches.length} coaches →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href, action }: { label: string; value: number; href: string; action: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
      <p className="text-2xl font-bold text-chess-dark dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      <Link href={href} className="text-xs text-chess-gold hover:underline mt-2 inline-block font-medium">
        {action} →
      </Link>
    </div>
  );
}
