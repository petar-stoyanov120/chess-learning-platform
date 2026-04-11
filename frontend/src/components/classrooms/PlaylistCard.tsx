'use client';

import Link from 'next/link';
import { ClassroomPlaylist } from '@/lib/types';

interface PlaylistCardProps {
  playlist: ClassroomPlaylist;
  classroomId: number;
  completedCount?: number;
  isOwner?: boolean;
  onDelete?: (id: number) => void;
}

export default function PlaylistCard({ playlist, classroomId, completedCount, isOwner, onDelete }: PlaylistCardProps) {
  const total = playlist._count?.lessons ?? 0;
  const completed = completedCount ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const href = isOwner
    ? `/collaborator/classrooms/${classroomId}/playlists/${playlist.id}/edit`
    : `/classrooms/${classroomId}/playlists/${playlist.id}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900">{playlist.name}</h3>
        <span className="text-xs text-gray-500 shrink-0">{total} lesson{total !== 1 ? 's' : ''}</span>
      </div>
      {playlist.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{playlist.description}</p>
      )}
      {!isOwner && total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-chess-gold rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        {isOwner && onDelete && (
          <button
            onClick={() => onDelete(playlist.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        )}
        <Link
          href={href}
          className="ml-auto text-sm font-medium text-chess-dark hover:text-chess-gold transition-colors"
        >
          {isOwner ? 'Edit →' : 'Open →'}
        </Link>
      </div>
    </div>
  );
}
