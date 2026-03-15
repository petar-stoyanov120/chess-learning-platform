'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Level {
  id: number;
  name: string;
  sortOrder: number;
  _count: { lessons: number };
}

export default function AdminLevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', sortOrder: '0' });

  async function fetchLevels() {
    try {
      const res = await api.get<{ data: Level[] }>('/categories/difficulty-levels');
      setLevels((res as { data: Level[] }).data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLevels(); }, []);

  function resetForm() {
    setForm({ name: '', sortOrder: '0' });
    setEditId(null);
  }

  function startEdit(level: Level) {
    setEditId(level.id);
    setForm({ name: level.name, sortOrder: String(level.sortOrder) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, sortOrder: parseInt(form.sortOrder) };
    try {
      if (editId) {
        await api.patch(`/categories/difficulty-levels/${editId}`, payload);
      } else {
        await api.post('/categories/difficulty-levels', payload);
      }
      resetForm();
      await fetchLevels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save difficulty level.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this difficulty level?')) return;
    try {
      await api.delete(`/categories/difficulty-levels/${id}`);
      await fetchLevels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete difficulty level.');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-6">Manage Difficulty Levels</h1>

      <form onSubmit={handleSubmit} className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            required
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-chess-gold"
          />
        </div>
        <button type="submit" disabled={saving} className="bg-chess-gold text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-amber-600 disabled:opacity-50">
          {editId ? 'Update' : 'Create'}
        </button>
        {editId && (
          <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:underline">Cancel</button>
        )}
      </form>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sort Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lessons</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {levels.map((level) => (
              <tr key={level.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 capitalize">{level.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{level.sortOrder}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{level._count.lessons}</td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => startEdit(level)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button
                    onClick={() => handleDelete(level.id)}
                    disabled={level._count.lessons > 0}
                    className="text-sm text-red-600 hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
