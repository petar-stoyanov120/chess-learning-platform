'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function NewPlaylistPage({ params }: { params: { id: string } }) {
  const classroomId = parseInt(params.id);
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teacherIntro, setTeacherIntro] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<{ data: { id: number } }>(
        `/classrooms/${classroomId}/playlists`,
        { name, description, teacherIntro }
      );
      showToast('Playlist created!', 'success');
      router.push(`/collaborator/classrooms/${classroomId}/playlists/${res.data.id}/edit`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create playlist', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/collaborator/classrooms/${classroomId}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Classroom
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-chess-dark">New Playlist</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Playlist Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Week 1: Chess Basics"
              maxLength={80}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this playlist covers"
              maxLength={500}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Teacher Introduction Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={teacherIntro}
              onChange={(e) => setTeacherIntro(e.target.value)}
              placeholder="Your message to students before they start this playlist. E.g. 'This week we're focusing on piece development...'"
              maxLength={2000}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Shown to students at the top of the playlist.</p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/collaborator/classrooms/${classroomId}`}
              className="flex-1 text-center py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create & Add Lessons →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
