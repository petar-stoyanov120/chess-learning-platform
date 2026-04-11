'use client';

import Link from 'next/link';
import { Location } from '@/lib/types';

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const roleBadge = location.myRole === 'owner'
    ? { label: 'Owner', className: 'bg-chess-gold/20 text-chess-gold' }
    : { label: 'Coach', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">📍</span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{location.name}</h3>
          </div>
          {location.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{location.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {location._count && (
              <>
                <span>{location._count.classrooms} group{location._count.classrooms !== 1 ? 's' : ''}</span>
                {location._count.notices > 0 && (
                  <>
                    <span>·</span>
                    <span>{location._count.notices} notice{location._count.notices !== 1 ? 's' : ''}</span>
                  </>
                )}
              </>
            )}
            {location.address && (
              <>
                <span>·</span>
                <span className="truncate max-w-[160px]">{location.address}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {location.myRole && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          )}
          {!location.isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 font-medium">
              Inactive
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end">
        <Link
          href={`/collaborator/locations/${location.id}`}
          className="text-sm font-medium text-chess-dark dark:text-gray-300 hover:text-chess-gold dark:hover:text-chess-gold transition-colors"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
