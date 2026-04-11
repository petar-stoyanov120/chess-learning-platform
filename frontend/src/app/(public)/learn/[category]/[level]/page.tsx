import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LessonSummary } from '@/lib/types';
import LessonCard from '@/components/lessons/LessonCard';
import Breadcrumb from '@/components/ui/Breadcrumb';

import { API_URL } from '@/lib/constants';
const API = API_URL;

async function getLessons(category: string, level: string) {
  try {
    const res = await fetch(`${API}/lessons/category/${category}/level/${level}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as { category: { name: string }; level: { name: string }; lessons: LessonSummary[] };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { category: string; level: string } }): Promise<Metadata> {
  const cat = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  const lvl = params.level.charAt(0).toUpperCase() + params.level.slice(1);
  return { title: `${cat} - ${lvl}`, description: `${lvl} chess ${cat} lessons.` };
}

export default async function LevelPage({ params }: { params: { category: string; level: string } }) {
  const data = await getLessons(params.category, params.level);
  if (!data) notFound();

  const { category, level, lessons } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: 'Learn', href: '/learn' },
        { label: category.name, href: `/learn/${params.category}`, capitalize: true },
        { label: level.name, capitalize: true },
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-chess-dark dark:text-gray-100 capitalize">
          {category.name} — {level.name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</p>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-lg">No lessons yet in this section. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
