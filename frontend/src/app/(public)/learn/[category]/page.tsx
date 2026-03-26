import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const revalidate = 60;

const validCategories = ['openings', 'concepts', 'endgames'];
const levels = [
  { slug: 'beginner', label: 'Beginner', color: 'bg-green-100 border-green-300 text-green-800', icon: '🌱' },
  { slug: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: '📈' },
  { slug: 'advanced', label: 'Advanced', color: 'bg-red-100 border-red-300 text-red-800', icon: '🏆' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const name = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return { title: `${name} Lessons`, description: `Chess ${name} lessons for all skill levels.` };
}

async function getLevelCounts(category: string): Promise<Record<string, number>> {
  try {
    const results = await Promise.allSettled(
      levels.map((level) =>
        fetch(`${API_URL}/lessons?category=${category}&level=${level.slug}&limit=1`, { next: { revalidate: 60 } })
          .then((r) => r.json())
          .then((data: { meta?: { total?: number } }) => ({ slug: level.slug, count: data?.meta?.total ?? 0 }))
      )
    );
    const counts: Record<string, number> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        counts[result.value.slug] = result.value.count;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  if (!validCategories.includes(params.category)) notFound();

  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  const counts = await getLevelCounts(params.category);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Learn', href: '/learn' }, { label: categoryName }]} />
      <h1 className="text-4xl font-bold text-chess-dark mb-3">{categoryName}</h1>
      <p className="text-gray-500 mb-10">Choose your skill level to view lessons.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {levels.map((level) => {
          const count = counts[level.slug] ?? null;
          return (
            <a
              key={level.slug}
              href={`/learn/${params.category}/${level.slug}`}
              className={`border-2 rounded-2xl p-8 text-center ${level.color} hover:scale-105 transition-transform duration-200 shadow-sm block`}
            >
              <div className="text-4xl mb-3">{level.icon}</div>
              <h2 className="text-xl font-bold mb-2">{level.label}</h2>
              {count !== null ? (
                <p className="text-sm opacity-70">{count} lesson{count !== 1 ? 's' : ''}</p>
              ) : (
                <p className="text-sm opacity-70">View lessons →</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
