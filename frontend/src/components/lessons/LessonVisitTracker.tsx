'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  href: string;
}

export default function LessonVisitTracker({ title, href }: Props) {
  useEffect(() => {
    try {
      localStorage.setItem('chess_last_lesson', JSON.stringify({ title, href }));
    } catch {
      // ignore storage errors
    }
  }, [title, href]);

  return null;
}
