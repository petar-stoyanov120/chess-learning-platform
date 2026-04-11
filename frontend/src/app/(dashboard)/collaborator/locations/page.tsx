'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';
import LocationCard from '@/components/locations/LocationCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = user?.role === 'club_admin' || user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Location[] }>('/locations');
      setLocations(res.data ?? []);
    } catch {
      setLocations([]);
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
          <h1 className="text-2xl font-bold text-chess-dark dark:text-white">Locations</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Venues and schools where you run chess sessions
          </p>
        </div>
        {canCreate && (
          <Link
            href="/collaborator/locations/new"
            className="bg-chess-dark text-white dark:bg-chess-gold dark:text-chess-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
          >
            + New Location
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : locations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No locations yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {canCreate
              ? 'Create a location for each school or venue where you run chess sessions.'
              : 'You have not been assigned to any location yet. Ask your Club Admin to assign you.'}
          </p>
          {canCreate && (
            <Link
              href="/collaborator/locations/new"
              className="bg-chess-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors"
            >
              Create Your First Location
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
}
