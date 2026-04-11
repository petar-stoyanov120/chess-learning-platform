'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { LessonSummary } from '@/lib/types';
import { API_URL } from '@/lib/constants';

interface ProgressEntry {
  lessonId: number;
  completedAt: string;
}

interface LearnHubProgressProps {
  categorySlug: string;
  levelSlug: string;
  totalLessons: number;
}

export default function LearnHubProgress({ categorySlug, levelSlug, totalLessons }: LearnHubProgressProps) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    if (!user || totalLessons === 0) return;

    let cancelled = false;

    async function load() {
      try {
        const [lessonsRes, progressRes] = await Promise.all([
          fetch(`${API_URL}/lessons/category/${categorySlug}/level/${levelSlug}`, { cache: 'no-store' }),
          api.get<{ data: ProgressEntry[] }>('/lessons/my/progress'),
        ]);

        if (!lessonsRes.ok || cancelled) return;
        const lessonsData = await lessonsRes.json();
        const lessons: LessonSummary[] = lessonsData?.data?.lessons ?? [];
        const lessonIds = new Set(lessons.map((l: LessonSummary) => l.id));
        const doneCount = progressRes.data.filter((p) => lessonIds.has(p.lessonId)).length;

        if (!cancelled) setCompleted(doneCount);
      } catch {
        // no-op — progress just won't show
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, categorySlug, levelSlug, totalLessons]);

  if (!user || completed === null || totalLessons === 0) return null;

  const pct = totalLessons > 0 ? (completed / totalLessons) * 100 : 0;

  return (
    <div className="mt-1.5">
      <div className="h-1.5 progress-bar">
        <div className="h-full progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {completed} / {totalLessons} done
      </p>
    </div>
  );
}
