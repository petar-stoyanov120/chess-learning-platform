'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';

export default function EditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    scheduleInfo: '',
    addressVisible: true,
    scheduleVisible: true,
  });

  const loadLocation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Location }>(`/locations/${id}`);
      const loc = res.data;
      setLocation(loc);
      setForm({
        name: loc.name,
        description: loc.description ?? '',
        address: loc.address ?? '',
        scheduleInfo: loc.scheduleInfo ?? '',
        addressVisible: loc.addressVisible,
        scheduleVisible: loc.scheduleVisible,
      });
    } catch {
      setLocation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) loadLocation();
  }, [user, loadLocation]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Location name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/locations/${id}`, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        scheduleInfo: form.scheduleInfo.trim() || null,
        addressVisible: form.addressVisible,
        scheduleVisible: form.scheduleVisible,
      });
      router.push(`/collaborator/locations/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse" />
        <div className="space-y-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!location) {
    return <div className="text-center py-20 text-gray-500">Location not found.</div>;
  }

  const isOwner = location.myRole === 'owner' || user?.role === 'admin';
  if (!isOwner) {
    return <div className="text-center py-20 text-gray-500">You don't have permission to edit this location.</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href={`/collaborator/locations/${id}`}
          className="text-sm text-gray-400 hover:text-chess-gold transition-colors"
        >
          ← {location.name}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-white mb-6">Edit Location</h1>

      {error && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Springfield Elementary School"
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of this venue..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address / Venue Info</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g. 12 Main Street, Springfield"
            maxLength={300}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              name="addressVisible"
              checked={form.addressVisible}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            Show address to all members
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson Schedule</label>
          <textarea
            name="scheduleInfo"
            value={form.scheduleInfo}
            onChange={handleChange}
            placeholder="e.g. Tuesdays 15:30–16:30 and Thursdays 15:00–16:00"
            rows={2}
            maxLength={1000}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-y"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              name="scheduleVisible"
              checked={form.scheduleVisible}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            Show schedule to all members
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/collaborator/locations/${id}`)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm rounded-lg bg-chess-dark text-white font-semibold hover:bg-chess-gold hover:text-chess-dark disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
