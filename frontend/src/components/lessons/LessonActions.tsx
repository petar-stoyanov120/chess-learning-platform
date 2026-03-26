'use client';

import BookmarkButton from '@/components/ui/BookmarkButton';
import AddToPlaylistPopover from '@/components/ui/AddToPlaylistPopover';
import { useAuth } from '@/lib/auth';
import { useBookmarks } from '@/hooks/useBookmarks';

interface LessonActionsProps {
  lessonId: number;
}

export default function LessonActions({ lessonId }: LessonActionsProps) {
  const { user } = useAuth();
  const { isBookmarked } = useBookmarks([lessonId]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <BookmarkButton lessonId={lessonId} initialBookmarked={isBookmarked(lessonId)} />
      <AddToPlaylistPopover lessonId={lessonId} />
    </div>
  );
}
