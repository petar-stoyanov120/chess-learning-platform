'use client';

import { getRoleDisplayName } from '@/lib/url';

interface CoachUser {
  id: number;
  username: string;
  displayName?: string | null;
  email: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  role?: { name: string };
  club?: { id: number; name: string } | null;
  locationCoaches?: { location: { id: number; name: string } }[];
}

interface CoachUserRowProps {
  user: CoachUser;
  clubName?: string;
  onDemote?: (id: number) => void;
  isDemoting?: boolean;
}

export default function CoachUserRow({ user, clubName, onDemote, isDemoting }: CoachUserRowProps) {
  const displayName = user.displayName || user.username;
  const locations = user.locationCoaches?.map((lc) => lc.location.name) ?? [];

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-chess-gold/20 flex items-center justify-center text-chess-dark font-bold text-sm shrink-0">
          {displayName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{displayName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium shrink-0">
              {getRoleDisplayName('coach', clubName)}
            </span>
          </div>
          {locations.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Assigned: {locations.join(', ')}
            </p>
          )}
          {locations.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Not assigned to any location yet</p>
          )}
        </div>
      </div>
      {onDemote && (
        <button
          onClick={() => onDemote(user.id)}
          disabled={isDemoting}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors shrink-0"
        >
          {isDemoting ? 'Removing...' : 'Remove Coach'}
        </button>
      )}
    </div>
  );
}
