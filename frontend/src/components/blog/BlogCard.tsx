import Link from 'next/link';
import Image from 'next/image';
import { getBaseUrl } from '@/lib/url';
import { BlogPostSummary } from '@/lib/types';

interface BlogCardProps {
  post: BlogPostSummary;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className="card hover:shadow-md transition-shadow duration-200 group">
      {post.coverImageUrl && (
        <div className="relative h-44 overflow-hidden">
          <Image
            src={`${getBaseUrl()}${post.coverImageUrl}`}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-chess-gold transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{post.excerpt}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.blogPostTags.slice(0, 3).map(({ tag }) => (
            <span key={tag.id} className="text-xs bg-chess-dark text-chess-cream px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
              {tag.name}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>by @{post.author.username}</span>
          <div className="flex items-center gap-2">
            {post.readingTime && <span>{post.readingTime} min read</span>}
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
