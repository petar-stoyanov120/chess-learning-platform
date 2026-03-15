import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn Chess',
  description: 'Browse chess lessons by topic - openings, concepts, and endgames.',
};

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

export default function LearnPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-chess-dark mb-3">Chess Lessons</h1>
        <p className="text-gray-500 text-lg">Choose a topic to start learning.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {categories.map((cat) => (
          <div key={cat.slug} className="card p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className={`bg-gradient-to-br ${cat.color} text-white rounded-2xl p-6 text-center w-full md:w-48 flex-shrink-0`}>
                <div className="text-5xl mb-2">{cat.icon}</div>
                <h2 className="text-2xl font-bold">{cat.name}</h2>
              </div>
              <div className="flex-1">
                <p className="text-gray-600 mb-5">{cat.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {cat.levels.map((level) => (
                    <Link
                      key={level}
                      href={`/learn/${cat.slug}/${level.toLowerCase()}`}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-chess-gold hover:bg-amber-50 transition-all group"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-chess-gold">{level}</div>
                        <div className="text-xs text-gray-400 mt-0.5">View lessons →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
