'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface Props {
  slug: string;
}

interface RatingSummary {
  likes: number;
  dislikes: number;
  userVote: 1 | -1 | 0;
}

export default function LessonRating({ slug }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<RatingSummary | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: RatingSummary }>(`/lessons/${slug}/rating`);
      setData((res as { data: RatingSummary }).data);
    } catch {
      // ratings are non-critical
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function vote(value: 1 | -1) {
    if (!user || pending) return;
    const next = data?.userVote === value ? 0 : value;
    setPending(true);
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const wasLike = prev.userVote === 1;
      const wasDislike = prev.userVote === -1;
      return {
        ...prev,
        likes: prev.likes + (next === 1 ? 1 : wasLike ? -1 : 0),
        dislikes: prev.dislikes + (next === -1 ? 1 : wasDislike ? -1 : 0),
        userVote: next as 0 | 1 | -1,
      };
    });
    try {
      await api.patch(`/lessons/${slug}/rating`, { value: next });
    } catch {
      load(); // revert on error
    } finally {
      setPending(false);
    }
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Was this helpful?</span>
      <button
        onClick={() => vote(1)}
        disabled={!user || pending}
        title={user ? 'Helpful' : 'Log in to rate'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:cursor-not-allowed ${
          data.userVote === 1
            ? 'bg-green-100 border-green-300 text-green-700'
            : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
        }`}
      >
        <span>👍</span>
        <span>{data.likes}</span>
      </button>
      <button
        onClick={() => vote(-1)}
        disabled={!user || pending}
        title={user ? 'Not helpful' : 'Log in to rate'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:cursor-not-allowed ${
          data.userVote === -1
            ? 'bg-red-100 border-red-300 text-red-700'
            : 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
        }`}
      >
        <span>👎</span>
        <span>{data.dislikes}</span>
      </button>
      {!user && (
        <span className="text-xs text-gray-400">Log in to vote</span>
      )}
    </div>
  );
}
