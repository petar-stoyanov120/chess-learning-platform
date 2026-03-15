import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Lesson } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import ShareButton from '@/components/ui/ShareButton';
import ProgressTracker from '@/components/lessons/ProgressTracker';
import SanitizedHtml from '@/components/ui/SanitizedHtml';

const LessonSidePanel = dynamic(() => import('@/components/chess/LessonSidePanel'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

async function getAdjacentLessons(categorySlug: string, levelName: string, currentId: number) {
  try {
    const res = await fetch(`${API}/lessons/category/${categorySlug}/level/${levelName}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { prev: null, next: null };
    const data = await res.json();
    const lessons = data.data.lessons as Lesson[];
    const idx = lessons.findIndex((l) => l.id === currentId);
    return {
      prev: idx > 0 ? lessons[idx - 1] : null,
      next: idx < lessons.length - 1 ? lessons[idx + 1] : null,
    };
  } catch {
    return { prev: null, next: null };
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

  const { prev, next } = await getAdjacentLessons(params.category, params.level, lesson.id);

  const mainFen = lesson.diagrams?.[0]?.fen;
  const variations = lesson.variations ?? [];
  const hasSidePanel = !!(mainFen || variations.length > 0);

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-10 ${hasSidePanel ? 'max-w-7xl' : 'max-w-4xl'}`}>
      <ProgressTracker slug={params.slug} />

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
          {/* Breadcrumb */}
          <div className="flex gap-2 text-sm text-gray-400 mb-6 flex-wrap">
            <Link href="/learn" className="hover:text-chess-gold">Learn</Link>
            <span>/</span>
            <Link href={`/learn/${lesson.category.slug}`} className="hover:text-chess-gold">{lesson.category.name}</Link>
            <span>/</span>
            <Link href={`/learn/${lesson.category.slug}/${lesson.level.name}`} className="hover:text-chess-gold capitalize">{lesson.level.name}</Link>
            <span>/</span>
            <span className="text-gray-600">{lesson.title}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>
                {lesson.level.name}
              </Badge>
              <span className="text-sm text-gray-400 capitalize">{lesson.category.name}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-chess-dark mb-3">{lesson.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm text-gray-500">
                by @{lesson.author.username}
                {lesson.readingTime && <span className="ml-3 text-gray-400">{lesson.readingTime} min read</span>}
              </span>
              <ShareButton label="🔗 Share this lesson" />
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

          {/* Prev / Next navigation */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between gap-4">
            {prev ? (
              <Link
                href={`/learn/${prev.category.slug}/${prev.level.name}/${prev.slug}`}
                className="flex-1 p-4 rounded-xl border border-gray-200 hover:border-chess-gold hover:bg-amber-50 transition-all group"
              >
                <div className="text-xs text-gray-400 mb-1">← Previous</div>
                <div className="font-medium text-gray-900 group-hover:text-chess-gold line-clamp-1">{prev.title}</div>
              </Link>
            ) : <div className="flex-1" />}

            {next ? (
              <Link
                href={`/learn/${next.category.slug}/${next.level.name}/${next.slug}`}
                className="flex-1 p-4 rounded-xl border border-gray-200 hover:border-chess-gold hover:bg-amber-50 transition-all group text-right"
              >
                <div className="text-xs text-gray-400 mb-1">Next →</div>
                <div className="font-medium text-gray-900 group-hover:text-chess-gold line-clamp-1">{next.title}</div>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        </div>
      </div>
    </div>
  );
}
