import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const validCategories = ['openings', 'concepts', 'endgames'];
const levels = [
  { slug: 'beginner', label: 'Beginner', color: 'bg-green-100 border-green-300 text-green-800', icon: '🌱' },
  { slug: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: '📈' },
  { slug: 'advanced', label: 'Advanced', color: 'bg-red-100 border-red-300 text-red-800', icon: '🏆' },
];

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const name = params.category.charAt(0).toUpperCase() + params.category.slice(1);
  return { title: `${name} Lessons`, description: `Chess ${name} lessons for all skill levels.` };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  if (!validCategories.includes(params.category)) notFound();

  const categoryName = params.category.charAt(0).toUpperCase() + params.category.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-4">
        <Link href="/learn" className="text-gray-500 hover:text-chess-gold text-sm">← All Topics</Link>
      </div>
      <h1 className="text-4xl font-bold text-chess-dark mb-3">{categoryName}</h1>
      <p className="text-gray-500 mb-10">Choose your skill level to view lessons.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {levels.map((level) => (
          <Link
            key={level.slug}
            href={`/learn/${params.category}/${level.slug}`}
            className={`border-2 rounded-2xl p-8 text-center ${level.color} hover:scale-105 transition-transform duration-200 shadow-sm`}
          >
            <div className="text-4xl mb-3">{level.icon}</div>
            <h2 className="text-xl font-bold mb-2">{level.label}</h2>
            <p className="text-sm opacity-70">View lessons →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
