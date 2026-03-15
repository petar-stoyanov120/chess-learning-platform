'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LessonSummary, BlogPostSummary, PaginatedResponse } from '@/lib/types';
import Badge from '@/components/ui/Badge';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [tab, setTab] = useState<'lessons' | 'blog'>('lessons');
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setLessons([]);
      setPosts([]);
      return;
    }
    setSearching(true);
    try {
      const [lessonsRes, postsRes] = await Promise.all([
        fetch(`${API}/lessons?search=${encodeURIComponent(q)}&limit=20`).then((r) => r.json()),
        fetch(`${API}/blog?search=${encodeURIComponent(q)}&limit=20`).then((r) => r.json()),
      ]);
      setLessons((lessonsRes as PaginatedResponse<LessonSummary>).data || []);
      setPosts((postsRes as PaginatedResponse<BlogPostSummary>).data || []);
    } catch {
      setLessons([]);
      setPosts([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) search(initialQuery);
  }, [initialQuery, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== initialQuery) {
        router.replace(query ? `/search?q=${encodeURIComponent(query)}` : '/search', { scroll: false });
        search(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, initialQuery, router, search]);

  const totalLessons = lessons.length;
  const totalPosts = posts.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-chess-dark mb-6">Search</h1>

      <div className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons and blog posts..."
          autoFocus
          className="w-full px-5 py-3 pl-12 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-chess-gold"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {query.trim() && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            <button
              onClick={() => setTab('lessons')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'lessons' ? 'border-chess-gold text-chess-dark' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Lessons ({totalLessons})
            </button>
            <button
              onClick={() => setTab('blog')}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === 'blog' ? 'border-chess-gold text-chess-dark' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Blog Posts ({totalPosts})
            </button>
          </div>

          {searching ? (
            <div className="text-center py-12 text-gray-400">Searching...</div>
          ) : tab === 'lessons' ? (
            totalLessons === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">♟</div>
                <p>No lessons found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/${lesson.category.slug}/${lesson.level.name}/${lesson.slug}`}
                    className="card p-4 block hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        {lesson.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.excerpt}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={lesson.level.name as 'beginner' | 'intermediate' | 'advanced'}>{lesson.level.name}</Badge>
                          <span className="text-xs text-gray-400 capitalize">{lesson.category.name}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : totalPosts === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">♟</div>
              <p>No blog posts found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="card p-4 block hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>}
                  <div className="mt-2 text-xs text-gray-400">
                    by @{post.author.username} · {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {!query.trim() && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">♟</div>
          <p>Type a keyword to search lessons and blog posts</p>
        </div>
      )}
    </div>
  );
}
