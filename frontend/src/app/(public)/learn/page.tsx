import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const LearnHubProgress = dynamic(() => import('@/components/lessons/LearnHubProgress'), { ssr: false });

export const metadata: Metadata = {
  title: 'Learn Chess',
  description: 'Browse chess lessons by topic - openings, concepts, and endgames.',
};

export const revalidate = 60;

const categories = [
  {
    slug: 'openings',
    name: 'Openings',
    icon: '♟',
    description: 'Learn opening theory — e4, d4, and more. Understand the principles behind the first moves.',
    color: 'from-blue-500 to-blue-700',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    slug: 'concepts',
    name: 'Concepts',
    icon: '💡',
    description: 'Tactics, forks, pins, discovered attacks — the building blocks of strong chess play.',
    color: 'from-purple-500 to-purple-700',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    slug: 'endgames',
    name: 'Endgames',
    icon: '👑',
    description: 'King and pawn endgames, rook endgames, and converting advantages into wins.',
    color: 'from-amber-500 to-amber-700',
    levels: ['Beginner', 'Intermediate', 'Advanced'],
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const LEVELS = ['beginner', 'intermediate', 'advanced'];

// Returns { "openings.beginner": 3, "openings.intermediate": 1, ... }
async function getLessonCountsByLevel(): Promise<Record<string, number>> {
  try {
    const pairs = categories.flatMap((cat) => LEVELS.map((level) => ({ cat: cat.slug, level })));
    const results = await Promise.allSettled(
      pairs.map(({ cat, level }) =>
        fetch(`${API_URL}/lessons?category=${cat}&level=${level}&limit=1`, { next: { revalidate: 60 } })
          .then((r) => r.json())
          .then((data: { meta?: { total?: number } }) => ({ key: `${cat}.${level}`, count: data?.meta?.total ?? 0 }))
      )
    );
    const counts: Record<string, number> = {};
    for (const result of results) {
      if (result.status === 'fulfilled') counts[result.value.key] = result.value.count;
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function LearnPage() {
  const counts = await getLessonCountsByLevel();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-chess-dark dark:text-gray-100 mb-3">Chess Lessons</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Choose a topic to start learning.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map((cat) => {
          const total = LEVELS.reduce((sum, lvl) => sum + (counts[`${cat.slug}.${lvl}`] ?? 0), 0);
          return (
            <div key={cat.slug} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className={`bg-gradient-to-br ${cat.color} text-white rounded-2xl p-6 text-center w-full md:w-48 flex-shrink-0`}>
                  <div className="text-5xl mb-2">{cat.icon}</div>
                  <h2 className="text-2xl font-bold">{cat.name}</h2>
                  {total > 0 && (
                    <p className="text-sm opacity-80 mt-1">{total} lesson{total !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 mb-5">{cat.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {cat.levels.map((level) => {
                      const count = counts[`${cat.slug}.${level.toLowerCase()}`] ?? null;
                      return (
                        <Link
                          key={level}
                          href={`/learn/${cat.slug}/${level.toLowerCase()}`}
                          className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-chess-gold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-chess-gold">{level}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {count !== null ? `${count} lesson${count !== 1 ? 's' : ''}` : 'View lessons →'}
                            </div>
                            <LearnHubProgress
                              categorySlug={cat.slug}
                              levelSlug={level.toLowerCase()}
                              totalLessons={count ?? 0}
                            />
                          </div>
                          <span className="text-gray-300 dark:text-gray-600 group-hover:text-chess-gold text-lg">→</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
