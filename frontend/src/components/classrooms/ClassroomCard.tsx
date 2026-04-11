'use client';

import Link from 'next/link';
import { Classroom } from '@/lib/types';

interface ClassroomCardProps {
  classroom: Classroom;
  /** 'owner' = teacher view, 'member' = student view */
  role: 'owner' | 'member';
}

export default function ClassroomCard({ classroom, role }: ClassroomCardProps) {
  const href = role === 'owner'
    ? `/collaborator/classrooms/${classroom.id}`
    : `/classrooms/${classroom.id}`;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏫</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{classroom.name}</h3>
          </div>
          {classroom.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{classroom.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {classroom._count && (
              <>
                <span>{classroom._count.members} student{classroom._count.members !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{classroom._count.playlists} playlist{classroom._count.playlists !== 1 ? 's' : ''}</span>
              </>
            )}
            {role === 'member' && classroom.owner && (
              <span>Teacher: <span className="font-medium">{classroom.owner.displayName || classroom.owner.username}</span></span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            classroom.tier === 'premium'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {classroom.tier === 'premium' ? '⭐ Premium' : 'Free'}
          </span>
          {!classroom.isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 font-medium">Inactive</span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {role === 'owner' && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-mono">
            <span>Code:</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200 font-bold tracking-wider">{classroom.inviteCode}</span>
          </div>
        )}
        {role === 'member' && classroom.joinedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Joined {new Date(classroom.joinedAt).toLocaleDateString()}
          </span>
        )}
        <Link
          href={href}
          className="ml-auto text-sm font-medium text-chess-dark dark:text-gray-300 hover:text-chess-gold dark:hover:text-chess-gold transition-colors"
        >
          {role === 'owner' ? 'Manage →' : 'Open →'}
        </Link>
      </div>
    </div>
  );
}
