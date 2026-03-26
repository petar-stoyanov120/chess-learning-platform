'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

interface Playlist {
  id: number;
  name: string;
  _count: { lessons: number };
}

interface AddToPlaylistPopoverProps {
  lessonId: number;
}

export default function AddToPlaylistPopover({ lessonId }: AddToPlaylistPopoverProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchPlaylists() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Playlist[] }>('/playlists');
      setPlaylists(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!open) fetchPlaylists();
    setOpen(!open);
  }

  async function handleAdd(playlistId: number) {
    try {
      await api.post(`/playlists/${playlistId}/lessons`, { lessonId });
      toast.success('Added to playlist');
      fetchPlaylists();
    } catch {
      toast.error('Failed to add to playlist');
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post<{ data: Playlist }>('/playlists', { name: newName.trim() });
      await api.post(`/playlists/${res.data.id}/lessons`, { lessonId });
      toast.success('Playlist created and lesson added');
      setNewName('');
      fetchPlaylists();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create playlist');
    }
    setCreating(false);
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        title="Add to playlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border z-50 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Add to playlist</p>

          {loading ? (
            <p className="text-xs text-gray-400 py-2">Loading...</p>
          ) : playlists.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No playlists yet. Create one below!</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAdd(pl.id)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-50 flex justify-between items-center"
                >
                  <span className="truncate">{pl.name}</span>
                  <span className="text-xs text-gray-400">{pl._count.lessons}</span>
                </button>
              ))}
            </div>
          )}

          <div className="border-t pt-2 mt-2 flex gap-1">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist name"
              maxLength={60}
              className="flex-1 text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-chess-gold"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="text-xs bg-chess-gold text-white px-2 py-1 rounded hover:opacity-90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
