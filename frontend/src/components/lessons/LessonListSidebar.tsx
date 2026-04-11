'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LessonSummary } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface ProgressEntry {
  lessonId: number;
  completedAt: string;
}

interface LessonListSidebarProps {
  lessons: LessonSummary[];
  currentSlug: string;
  categorySlug: string;
  levelName: string;
}

export default function LessonListSidebar({
  lessons,
  currentSlug,
  categorySlug,
  levelName,
}: LessonListSidebarProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  // Default open on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ data: ProgressEntry[] }>('/lessons/my/progress')
      .then((res) => {
        const ids = new Set(res.data.map((p) => p.lessonId));
        setCompletedIds(ids);
      })
      .catch(() => {});
  }, [user]);

  const completedCount = lessons.filter((l) => completedIds.has(l.id)).length;

  return (
    <div className="mb-6">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-expanded={isOpen}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="flex-1 text-left">
          {levelName} lessons
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {user ? `${completedCount} / ${lessons.length} done` : `${lessons.length} lessons`}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Lesson list panel */}
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {/* Progress bar */}
          {user && lessons.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <div className="h-1.5 progress-bar">
                <div
                  className="h-full progress-fill"
                  style={{ width: `${(completedCount / lessons.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {lessons.map((lesson, idx) => {
              const isCurrent = lesson.slug === currentSlug;
              const isDone = completedIds.has(lesson.id);
              const href = `/learn/${categorySlug}/${levelName}/${lesson.slug}`;

              return (
                <li key={lesson.id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isCurrent
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-chess-dark dark:text-amber-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Status icon */}
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 text-base">
                      {isCurrent ? (
                        <span className="text-chess-gold">▶</span>
                      ) : isDone ? (
                        <span className="text-green-500 dark:text-green-400">✓</span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-600 font-mono">{idx + 1}</span>
                      )}
                    </span>
                    <span className="line-clamp-1 flex-1">{lesson.title}</span>
                    {lesson.readingTime && !isCurrent && (
                      <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">{lesson.readingTime}m</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
