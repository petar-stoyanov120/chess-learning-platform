'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<(Category & { _count: { lessons: number } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  async function fetchCategories() {
    try {
      const res = await api.get<{ data: (Category & { _count: { lessons: number } })[] }>('/categories');
      setCategories((res as { data: (Category & { _count: { lessons: number } })[] }).data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  function resetForm() {
    setForm({ name: '', slug: '', description: '' });
    setEditId(null);
  }

  function startEdit(cat: Category & { _count: { lessons: number } }) {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/categories/${editId}`, { name: form.name, description: form.description });
      } else {
        await api.post('/categories', form);
      }
      resetForm();
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category.');
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-chess-dark mb-6">Manage Categories</h1>

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
        {!editId && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-chess-gold"
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slug</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lessons</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{cat.description || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{cat._count.lessons}</td>
                <td className="px-4 py-3 space-x-3">
                  <button onClick={() => startEdit(cat)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={cat._count.lessons > 0}
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
