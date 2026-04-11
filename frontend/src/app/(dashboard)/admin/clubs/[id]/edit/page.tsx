'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Club } from '@/lib/types';

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', logoUrl: '' });

  const loadClub = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Club[] }>('/admin/clubs');
      const found = (res.data ?? []).find((c) => String(c.id) === id);
      if (found) {
        setClub(found);
        setForm({
          name: found.name,
          description: found.description ?? '',
          logoUrl: found.logoUrl ?? '',
        });
      }
    } catch {
      setClub(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) loadClub();
  }, [user, loadClub]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Club name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/admin/clubs/${id}`, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
      });
      router.push('/admin/clubs');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!club) return <div className="text-center py-20 text-gray-500">Club not found.</div>;

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/clubs" className="text-sm text-gray-400 hover:text-chess-gold transition-colors">
          ← Clubs
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-chess-dark dark:text-white mb-6">Edit Club</h1>

      {error && (
        <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Club Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Chess Knights"
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
          <p className="text-xs text-gray-400 mt-1">
            Changing the name updates all role labels instantly (e.g. "{form.name || 'Club'} Coach").
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
          <input
            name="logoUrl"
            value={form.logoUrl}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
          {form.logoUrl && (
            <img src={form.logoUrl} alt="Logo preview" className="mt-2 w-12 h-12 rounded-full object-cover" />
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/clubs')}
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
