'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Location } from '@/lib/types';

export default function NewLocationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    scheduleInfo: '',
    addressVisible: true,
    scheduleVisible: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ data: Location }>('/locations', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        scheduleInfo: form.scheduleInfo.trim() || undefined,
        addressVisible: form.addressVisible,
        scheduleVisible: form.scheduleVisible,
      });
      router.push(`/collaborator/locations/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create location.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-chess-dark dark:text-white mb-6">New Location</h1>

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
            Show address to all members (uncheck to keep private)
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
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm rounded-lg bg-chess-dark text-white font-semibold hover:bg-chess-gold hover:text-chess-dark disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Location'}
          </button>
        </div>
      </form>
    </div>
  );
}
