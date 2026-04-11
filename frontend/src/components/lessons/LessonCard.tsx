import Link from 'next/link';
import Image from 'next/image';
import { getBaseUrl } from '@/lib/url';
import { LessonSummary } from '@/lib/types';
import Badge from '@/components/ui/Badge';

interface LessonCardProps {
  lesson: LessonSummary;
  completed?: boolean;
}

const CATEGORY_BORDER: Record<string, string> = {
  openings: 'border-l-4 border-blue-400',
  concepts: 'border-l-4 border-purple-400',
  endgames: 'border-l-4 border-amber-400',
};

export default function LessonCard({ lesson, completed }: LessonCardProps) {
  const href = `/learn/${lesson.category.slug}/${lesson.level.name}/${lesson.slug}`;
  const accentBorder = CATEGORY_BORDER[lesson.category.slug] ?? '';

  return (
    <Link
      href={href}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200 group relative flex flex-col ${accentBorder}`}
    >
      {completed && (
        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow" title="Completed">
          ✓
        </div>
      )}
      {lesson.coverImageUrl && (
        <div className="relative h-40 overflow-hidden">
          <Image
            src={`${getBaseUrl()}${lesson.coverImageUrl}`}
            alt={lesson.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>
            {lesson.level.name}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{lesson.category.name}</span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-chess-gold transition-colors line-clamp-2">
          {lesson.title}
        </h3>
        {lesson.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{lesson.excerpt}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>by @{lesson.author.username}</span>
          <div className="flex items-center gap-2">
            {lesson.readingTime && <span>{lesson.readingTime} min read</span>}
            {lesson.viewCount != null && lesson.viewCount > 0 && (
              <span>👁 {lesson.viewCount.toLocaleString()}</span>
            )}
            <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
