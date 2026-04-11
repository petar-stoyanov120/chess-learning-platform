import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Lesson, LessonSummary } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ShareButton from '@/components/ui/ShareButton';
import ProgressTracker from '@/components/lessons/ProgressTracker';
import LessonActions from '@/components/lessons/LessonActions';
import LessonVisitTracker from '@/components/lessons/LessonVisitTracker';
import SanitizedHtml from '@/components/ui/SanitizedHtml';

const LessonRating = dynamic(() => import('@/components/lessons/LessonRating'), { ssr: false });
const CommentSection = dynamic(() => import('@/components/lessons/CommentSection'), { ssr: false });
const LessonListSidebar = dynamic(() => import('@/components/lessons/LessonListSidebar'), { ssr: false });
const LessonSidePanel = dynamic(() => import('@/components/chess/LessonSidePanel'), { ssr: false });

import { API_URL } from '@/lib/constants';
const API = API_URL;

async function getLesson(slug: string): Promise<Lesson | null> {
  try {
    const res = await fetch(`${API}/lessons/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as Lesson;
  } catch {
    return null;
  }
}

async function getLevelLessons(categorySlug: string, levelName: string) {
  try {
    const res = await fetch(`${API}/lessons/category/${categorySlug}/level/${levelName}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data.lessons as LessonSummary[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lesson = await getLesson(params.slug);
  if (!lesson) return { title: 'Lesson Not Found' };
  return {
    title: lesson.title,
    description: lesson.metaDescription || lesson.excerpt || `Learn ${lesson.title} on ChessLearn`,
  };
}

export default async function LessonPage({ params }: { params: { category: string; level: string; slug: string } }) {
  const lesson = await getLesson(params.slug);
  if (!lesson) notFound();

  const levelLessons = await getLevelLessons(params.category, params.level);
  const idx = levelLessons.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? levelLessons[idx - 1] : null;
  const next = idx < levelLessons.length - 1 ? levelLessons[idx + 1] : null;

  const mainFen = lesson.diagrams?.[0]?.fen;
  const variations = lesson.variations ?? [];
  const hasSidePanel = !!(mainFen || variations.length > 0);

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-10 ${hasSidePanel ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <ProgressTracker slug={params.slug} />
      <LessonVisitTracker title={lesson.title} href={`/learn/${params.category}/${params.level}/${params.slug}`} />

      <div className={hasSidePanel ? 'flex flex-col lg:flex-row gap-10' : undefined}>
        {/* RIGHT COLUMN (board) — first in DOM so it appears on top on mobile */}
        {hasSidePanel && (
          <div className="order-1 lg:order-2 w-full lg:w-[460px] flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <LessonSidePanel mainFen={mainFen} variations={variations} />
            </div>
          </div>
        )}

        {/* LEFT COLUMN (text) — second in DOM but ordered first on desktop */}
        <div className={hasSidePanel ? 'order-2 lg:order-1 flex-1 min-w-0' : undefined}>
          {/* Collapsible lesson list */}
          {levelLessons.length > 0 && (
            <LessonListSidebar
              lessons={levelLessons}
              currentSlug={params.slug}
              categorySlug={params.category}
              levelName={params.level}
            />
          )}

          <Breadcrumb items={[
            { label: 'Learn', href: '/learn' },
            { label: lesson.category.name, href: `/learn/${lesson.category.slug}` },
            { label: lesson.level.name, href: `/learn/${lesson.category.slug}/${lesson.level.name}`, capitalize: true },
            { label: lesson.title },
          ]} />

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>
                {lesson.level.name}
              </Badge>
              <span className="text-sm text-gray-400 dark:text-gray-500 capitalize">{lesson.category.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-chess-dark dark:text-gray-100 mb-3">{lesson.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                by @{lesson.author.username}
                {lesson.readingTime && <span className="ml-3 text-gray-400 dark:text-gray-500">{lesson.readingTime} min read</span>}
              </span>
              <div className="flex items-center gap-2">
                <LessonActions lessonId={lesson.id} />
                <ShareButton label="🔗 Share this lesson" />
              </div>
            </div>
          </div>

          {/* Lesson content */}
          <SanitizedHtml as="article" className="lesson-content" html={lesson.content} />

          {/* Tags */}
          {lesson.lessonTags?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {lesson.lessonTags.map(({ tag }) => (
                  <span key={tag.id} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                    #{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <LessonRating slug={params.slug} />
              {typeof lesson.viewCount === 'number' && lesson.viewCount > 0 && (
                <span className="text-xs text-gray-400">👁 {lesson.viewCount.toLocaleString()} views</span>
              )}
            </div>
          </div>

          {/* Comments */}
          <CommentSection lessonId={lesson.id} />

          {/* Prev / Next navigation */}
          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-4">
            {prev ? (
              <Link
                href={`/learn/${params.category}/${params.level}/${prev.slug}`}
                className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-chess-gold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
              >
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">← Previous</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-chess-gold line-clamp-1">{prev.title}</div>
              </Link>
            ) : <div className="flex-1" />}

            {next ? (
              <Link
                href={`/learn/${params.category}/${params.level}/${next.slug}`}
                className="flex-1 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-chess-gold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group text-right"
              >
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Next →</div>
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-chess-gold line-clamp-1">{next.title}</div>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>
      </div>
    </div>
  );
}
