'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { Location } from '@/lib/types';

export default function NewClassroomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const prefillLocationId = searchParams.get('locationId');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState<string>(prefillLocationId ?? '');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [saving, setSaving] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);

  const canPickLocation = user?.role === 'club_admin' || user?.role === 'coach' || user?.role === 'admin';

  const loadLocations = useCallback(async () => {
    if (!canPickLocation) return;
    try {
      const res = await api.get<{ data: Location[] }>('/locations');
      setLocations(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLocations([]);
    }
  }, [canPickLocation]);

  useEffect(() => {
    if (user) loadLocations();
  }, [user, loadLocations]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name, description };
      if (locationId) payload.locationId = Number(locationId);
      if (ageMin) payload.ageMin = Number(ageMin);
      if (ageMax) payload.ageMax = Number(ageMax);
      const res = await api.post<{ data: { id: number } }>('/classrooms', payload);
      showToast('Classroom created!', 'success');
      if (locationId) {
        router.push(`/collaborator/locations/${locationId}`);
      } else {
        router.push(`/collaborator/classrooms/${res.data.id}`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create classroom', 'error');
    } finally {
      setSaving(false);
    }
  }

  const backHref = prefillLocationId
    ? `/collaborator/locations/${prefillLocationId}`
    : '/collaborator/classrooms';

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
          ← {prefillLocationId ? 'Location' : 'Classrooms'}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-chess-dark dark:text-white">New Group</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Under 8s, Monday Year 6, Beginners Group A"
              maxLength={80}
              required
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
            />
            <p className="text-xs text-gray-400 mt-1">{name.length}/80</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this group, e.g. Wednesday afternoon class for beginners aged 7–9"
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
          </div>

          {canPickLocation && locations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Location <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
              >
                <option value="">No location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Assign this group to a venue. Students only see their own group.
              </p>
            </div>
          )}

          {canPickLocation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Age Range <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="Min"
                  min={3}
                  max={99}
                  className="w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                />
                <span className="text-gray-400 text-sm">to</span>
                <input
                  type="number"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  placeholder="Max"
                  min={3}
                  max={99}
                  className="w-24 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                />
                <span className="text-xs text-gray-400">years</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-400">
              <li>• You'll get a unique invite code to share with your students</li>
              <li>• Create playlists of lessons with your own teaching notes</li>
              <li>• Track each student's progress through your materials</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link
              href={backHref}
              className="flex-1 text-center py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold hover:text-chess-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
