'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface BookmarkButtonProps {
  lessonId: number;
  initialBookmarked: boolean;
}

export default function BookmarkButton({ lessonId, initialBookmarked }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function toggle() {
    setLoading(true);
    const prev = bookmarked;
    setBookmarked(!prev); // optimistic

    try {
      if (prev) {
        await api.delete(`/bookmarks/${lessonId}`);
      } else {
        await api.post('/bookmarks', { lessonId });
      }
    } catch {
      setBookmarked(prev); // revert
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={loading}
      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
      title={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={bookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        className={`w-5 h-5 ${bookmarked ? 'text-chess-gold' : 'text-gray-400'}`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );
}
