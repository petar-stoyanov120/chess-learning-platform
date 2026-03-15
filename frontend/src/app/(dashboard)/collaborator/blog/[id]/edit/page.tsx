'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Tag, BlogPost } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { VariationInput } from '@/components/chess/VariationEditor';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const VariationEditor = dynamic(() => import('@/components/chess/VariationEditor'), { ssr: false });

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [variations, setVariations] = useState<VariationInput[]>([]);
  const [submitForReview, setSubmitForReview] = useState(false);
  const [statusName, setStatusName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: BlogPost }>(`/blog/my/${postId}`),
      api.get<{ data: Tag[] }>('/tags'),
    ]).then(([postRes, tgs]) => {
      const post = (postRes as { data: BlogPost }).data;
      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt || '');
      setSelectedTags(post.blogPostTags.map((bt) => bt.tag.id));
      setVariations((post.variations || []).map((v, i) => ({ name: v.name, notation: v.notation, sortOrder: v.sortOrder ?? i })));
      setStatusName(post.status.name);
      setTags((tgs as { data: Tag[] }).data);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load post.');
    }).finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/blog/${postId}`, {
        title, content, excerpt, tagIds: selectedTags,
        variations: variations.filter(v => v.name.trim() && v.notation.trim()),
      });
      if (submitForReview) {
        await api.patch(`/blog/${postId}/submit`, {});
      }
      router.push('/collaborator/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-chess-dark">←</button>
        <h1 className="text-2xl font-bold text-chess-dark">Edit Blog Post</h1>
      </div>

      {statusName === 'rejected' && (
        <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          This post was rejected. Edit it and resubmit for review.
        </p>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (optional)</label>
            <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold" />
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
          <RichTextEditor content={content} onChange={setContent} placeholder="Write your blog post here..." />
        </div>

        {/* Variations */}
        <VariationEditor variations={variations} onChange={setVariations} />

        {tags.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button key={tag.id} type="button"
                  onClick={() => setSelectedTags(selectedTags.includes(tag.id) ? selectedTags.filter((t) => t !== tag.id) : [...selectedTags, tag.id])}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedTags.includes(tag.id) ? 'bg-chess-dark text-white border-chess-dark' : 'border-gray-300 text-gray-600 hover:border-chess-dark'}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {(statusName === 'draft' || statusName === 'rejected') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={submitForReview} onChange={(e) => setSubmitForReview(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium text-gray-700">Submit for review</span>
            </label>
          )}
          <button type="submit" disabled={saving}
            className="bg-chess-dark text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-chess-accent disabled:opacity-60 flex items-center gap-2">
            {saving ? <LoadingSpinner size="sm" /> : null}
            {submitForReview ? 'Save & Submit' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
