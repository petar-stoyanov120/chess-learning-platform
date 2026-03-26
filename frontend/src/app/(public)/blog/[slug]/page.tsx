import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BlogPost } from '@/lib/types';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ShareButton from '@/components/ui/ShareButton';
import SanitizedHtml from '@/components/ui/SanitizedHtml';

const LessonSidePanel = dynamic(() => import('@/components/chess/LessonSidePanel'), { ssr: false });

import { API_URL } from '@/lib/constants';
const API = API_URL;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API}/blog/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as BlogPost;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: post.title,
    description: post.metaDescription || post.excerpt || `Read ${post.title} on ChessLearn`,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const variations = post.variations ?? [];
  const hasSidePanel = variations.length > 0;

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-10 ${hasSidePanel ? 'max-w-7xl' : 'max-w-3xl'}`}>
      <Breadcrumb items={[
        { label: 'Blog', href: '/blog' },
        { label: post.title },
      ]} />

      <div className={hasSidePanel ? 'flex flex-col lg:flex-row gap-10' : undefined}>
        {/* RIGHT COLUMN (board + variations) — first in DOM so it appears on top on mobile */}
        {hasSidePanel && (
          <div className="order-1 lg:order-2 w-full lg:w-[460px] flex-shrink-0">
            <div className="lg:sticky lg:top-8">
              <LessonSidePanel variations={variations} />
            </div>
          </div>
        )}

        {/* LEFT COLUMN (article text) — ordered first on desktop */}
        <article className={hasSidePanel ? 'order-2 lg:order-1 flex-1 min-w-0' : undefined}>
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-chess-dark mb-4">{post.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>by @{post.author.username}</span>
                <span>·</span>
                <time dateTime={post.approvedAt || post.createdAt}>
                  {new Date(post.approvedAt || post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </time>
                {post.readingTime && (
                  <>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </>
                )}
              </div>
              <ShareButton />
            </div>
          </header>

          <SanitizedHtml className="lesson-content" html={post.content} />

          {post.blogPostTags?.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {post.blogPostTags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    href={`/blog?tag=${tag.slug}`}
                    className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-chess-dark hover:text-white transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
