import Link from 'next/link';
import { BlogPostSummary, PaginatedResponse } from '@/lib/types';
import BlogCard from '@/components/blog/BlogCard';
import { API_URL } from '@/lib/constants';

async function getRecentPosts() {
  try {
    const res = await fetch(
      `${API_URL}/blog?limit=3`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data: PaginatedResponse<BlogPostSummary> = await res.json();
    return data.data;
  } catch {
    return [];
  }
}

const categories = [
  {
    slug: 'openings',
    name: 'Openings',
    icon: '♟',
    description: 'Learn the key opening moves and understand the theory behind them.',
    color: 'from-blue-600 to-blue-800',
  },
  {
    slug: 'concepts',
    name: 'Concepts',
    icon: '💡',
    description: 'Master core chess concepts like tactics, strategy, and piece coordination.',
    color: 'from-purple-600 to-purple-800',
  },
  {
    slug: 'endgames',
    name: 'Endgames',
    icon: '👑',
    description: 'Learn endgame techniques to convert advantages into victories.',
    color: 'from-amber-600 to-amber-800',
  },
];

export default async function HomePage() {
  const recentPosts = await getRecentPosts();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-chess-dark to-chess-accent text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-7xl mb-4">♟</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-chess-cream">
            Learn Chess the Fun Way
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Structured lessons for kids, beginners, and intermediate players. Master openings, concepts, and endgames step by step.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/learn"
              className="bg-chess-gold text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors"
            >
              Start Learning
            </Link>
            <Link
              href="/register"
              className="bg-white text-chess-dark px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-chess-dark mb-3">What Would You Like to Learn?</h2>
          <p className="text-gray-500 text-center mb-10">Choose a topic and start with the level that suits you.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/learn/${cat.slug}`}
                className={`bg-gradient-to-br ${cat.color} text-white rounded-2xl p-8 hover:scale-105 transition-transform duration-200 shadow-lg`}
              >
                <div className="text-5xl mb-4">{cat.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                <p className="text-white/80 text-sm">{cat.description}</p>
                <div className="mt-4 text-white/70 text-sm font-medium">
                  Beginner · Intermediate · Advanced →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty Levels */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-chess-dark mb-8">Learn at Your Own Pace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { level: 'Beginner', color: 'bg-green-100 border-green-200 text-green-800', desc: 'Just starting out? Start here with the basics.' },
              { level: 'Intermediate', color: 'bg-yellow-100 border-yellow-200 text-yellow-800', desc: 'Know the basics and want to improve?' },
              { level: 'Advanced', color: 'bg-red-100 border-red-200 text-red-800', desc: 'Ready for complex strategies and tactics?' },
            ].map((item) => (
              <div key={item.level} className={`p-6 rounded-xl border-2 ${item.color}`}>
                <h3 className="font-bold text-lg mb-2">{item.level}</h3>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-chess-dark">Latest from the Blog</h2>
              <Link href="/blog" className="text-chess-gold font-medium hover:underline text-sm">
                View all posts →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
