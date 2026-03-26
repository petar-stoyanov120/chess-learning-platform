'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useBookmarks(lessonIds: number[]) {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user || lessonIds.length === 0) return;

    api
      .get<{ data: { bookmarkedLessonIds: number[] } }>(`/bookmarks/check?lessonIds=${lessonIds.join(',')}`)
      .then((res) => setBookmarkedIds(new Set(res.data.bookmarkedLessonIds)))
      .catch(() => {});
  }, [user, lessonIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const isBookmarked = useCallback((id: number) => bookmarkedIds.has(id), [bookmarkedIds]);

  const toggleBookmark = useCallback(
    async (id: number) => {
      const was = bookmarkedIds.has(id);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        was ? next.delete(id) : next.add(id);
        return next;
      });

      try {
        if (was) {
          await api.delete(`/bookmarks/${id}`);
        } else {
          await api.post('/bookmarks', { lessonId: id });
        }
      } catch {
        // revert
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          was ? next.add(id) : next.delete(id);
          return next;
        });
      }
    },
    [bookmarkedIds],
  );

  return { isBookmarked, toggleBookmark };
}
