import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BlogPostSummary, LessonSummary, PaginatedResponse } from '@/lib/types';
import BlogCard from '@/components/blog/BlogCard';
import LessonCard from '@/components/lessons/LessonCard';
import { API_URL } from '@/lib/constants';

const ChessBoard = dynamic(() => import('@/components/chess/ChessBoard'), { ssr: false });
const AdUnit = dynamic(() => import('@/components/ads/AdUnit'), { ssr: false });

async function getRecentPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${API_URL}/blog?limit=3`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data: PaginatedResponse<BlogPostSummary> = await res.json();
    return data.data;
  } catch {
    return [];
  }
}

async function getFeaturedLessons(): Promise<LessonSummary[]> {
  try {
    const res = await fetch(`${API_URL}/lessons?limit=3&sort=recent`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data: PaginatedResponse<LessonSummary> = await res.json();
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

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Pick Your Level',
    desc: 'Start at Beginner, Intermediate, or Advanced — no prior experience needed.',
    icon: '🎯',
  },
  {
    step: '2',
    title: 'Study Lessons',
    desc: 'Read structured lessons with interactive chess boards, diagrams, and tactics puzzles.',
    icon: '📚',
  },
  {
    step: '3',
    title: 'Join a Class',
    desc: 'Enroll in a teacher\'s classroom for guided, structured learning with curated playlists.',
    icon: '🏫',
  },
];

export default async function HomePage() {
  const [recentPosts, featuredLessons] = await Promise.all([
    getRecentPosts(),
    getFeaturedLessons(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-chess-dark to-chess-accent text-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-chess-cream leading-tight">
              Learn Chess<br className="hidden md:block" /> the Fun Way
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              Structured lessons for kids, beginners, and intermediate players. Master openings, concepts, and endgames step by step.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/learn"
                className="bg-chess-gold text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors text-center"
              >
                Start Learning
              </Link>
              <Link
                href="/register"
                className="bg-white text-chess-dark px-8 py-3 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors text-center"
              >
                Create Free Account
              </Link>
            </div>
          </div>
          {/* Mini chess board */}
          <div className="shrink-0 hidden md:block">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-chess-gold/30">
              <ChessBoard
                fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
                size={280}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-chess-dark dark:text-gray-100 mb-2">How It Works</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-10 text-sm">Get started in three easy steps.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-chess-dark text-white text-xs font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad unit between sections */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <AdUnit slot="home-top" format="leaderboard" className="flex justify-center" />
      </div>

      {/* Learning Categories */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-chess-dark dark:text-gray-100 mb-3">What Would You Like to Learn?</h2>
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

      {/* Classroom Puzzle Homework Teaser */}
      <section className="py-12 px-4 bg-chess-dark text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl mb-3">♟️</div>
          <h2 className="text-2xl font-bold mb-2 text-chess-cream">Homework Puzzles</h2>
          <p className="text-gray-300 text-sm mb-6">
            Your teacher assigns chess puzzles as homework. Analyse the position, write your answer in chess notation, and explain your thinking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/classrooms"
              className="bg-chess-gold text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-500 transition-colors"
            >
              Go to My Classrooms
            </Link>
            <Link
              href="/classrooms/join"
              className="bg-white/10 text-white border border-white/20 px-6 py-2.5 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Join a Classroom
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Lessons */}
      {featuredLessons.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-chess-dark">Featured Lessons</h2>
              <Link href="/learn" className="text-chess-gold font-medium hover:underline text-sm">
                View all lessons →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Join a Classroom CTA */}
      <section className="py-16 px-4 bg-amber-50 dark:bg-amber-900/10 border-y border-amber-100 dark:border-amber-900/30">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="text-6xl">🏫</div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-chess-dark dark:text-gray-100 mb-2">Running a Chess Club?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a free classroom for your students. Build curated lesson playlists, add personal notes per lesson, track student progress, and invite multiple groups with separate invite codes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/register?role=collaborator"
                className="bg-chess-dark text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-chess-accent transition-colors text-center"
              >
                Create a Free Classroom
              </Link>
              <Link
                href="/classrooms/join"
                className="border border-chess-dark text-chess-dark px-6 py-2.5 rounded-xl font-semibold hover:bg-chess-dark hover:text-white transition-colors text-center"
              >
                Join a Classroom
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Difficulty Levels */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-chess-dark dark:text-gray-100 mb-8">Learn at Your Own Pace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { level: 'Beginner', color: 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300', desc: 'Just starting out? Start here with the basics.' },
              { level: 'Intermediate', color: 'bg-yellow-100 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300', desc: 'Know the basics and want to improve?' },
              { level: 'Advanced', color: 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300', desc: 'Ready for complex strategies and tactics?' },
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
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-chess-dark dark:text-gray-100">Latest from the Blog</h2>
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
