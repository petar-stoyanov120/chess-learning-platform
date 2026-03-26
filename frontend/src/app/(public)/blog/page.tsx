import type { Metadata } from 'next';
import { BlogPostSummary, PaginatedResponse } from '@/lib/types';
import BlogCard from '@/components/blog/BlogCard';
import Pagination from '@/components/ui/Pagination';

export const metadata: Metadata = {
  title: 'Chess Blog',
  description: 'Read chess articles, tips, and insights from the ChessLearn community.',
};

import { API_URL } from '@/lib/constants';
const API = API_URL;

async function getPosts(page = 1, tag?: string, search?: string) {
  const params = new URLSearchParams({ page: page.toString(), limit: '9' });
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);

  try {
    const res = await fetch(`${API}/blog?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 0, hasNext: false, hasPrev: false } };
    return res.json() as Promise<PaginatedResponse<BlogPostSummary>>;
  } catch {
    return { data: [], meta: { total: 0, page: 1, limit: 9, totalPages: 0, hasNext: false, hasPrev: false } };
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; tag?: string; search?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { data: posts, meta } = await getPosts(page, searchParams.tag, searchParams.search);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-chess-dark mb-2">Chess Blog</h1>
        <p className="text-gray-500">Articles, tips, and chess insights.</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-xl">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination meta={meta} />
        </>
      )}
    </div>
  );
}
