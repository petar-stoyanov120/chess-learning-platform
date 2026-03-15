'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Category, DifficultyLevel, Tag } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { VariationInput } from '@/components/chess/VariationEditor';
import { useDailyLimit } from '@/hooks/useDailyLimit';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const VariationEditor = dynamic(() => import('@/components/chess/VariationEditor'), { ssr: false });

export default function CollaboratorNewLessonPage() {
  const router = useRouter();
  const { canPost, remaining, limit, loading: limitLoading } = useDailyLimit();
  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<DifficultyLevel[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [variations, setVariations] = useState<VariationInput[]>([]);
  const [submitForReview, setSubmitForReview] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Category[] }>('/categories'),
      api.get<{ data: DifficultyLevel[] }>('/categories/difficulty-levels'),
      api.get<{ data: Tag[] }>('/tags'),
    ]).then(([cats, lvls, tgs]) => {
      setCategories((cats as { data: Category[] }).data);
      setLevels((lvls as { data: DifficultyLevel[] }).data);
      setTags((tgs as { data: Tag[] }).data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content || !categoryId || !levelId) {
      setError('Title, content, category, and level are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ data: { id: number } }>('/lessons', {
        title, content, excerpt,
        categoryId: parseInt(categoryId),
        difficultyLevelId: parseInt(levelId),
        tagIds: selectedTags,
        variations: variations.filter(v => v.name.trim() && v.notation.trim()),
      });
      if (submitForReview) {
        await api.patch(`/lessons/${(res as { data: { id: number } }).data.id}/submit`, {});
      }
      router.push('/collaborator/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-chess-dark">←</button>
        <h1 className="text-2xl font-bold text-chess-dark">Submit a Lesson</h1>
      </div>
      <p className="text-gray-500 mb-6 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        💡 Your lesson will be reviewed by an admin before it&apos;s published.
      </p>

      {!limitLoading && !canPost && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-sm">
          You have reached your daily limit of {limit} post. Your limit resets at midnight UTC.
        </div>
      )}
      {!limitLoading && canPost && limit !== null && (
        <p className="text-sm text-gray-400 mb-4">{remaining} of {limit} post remaining today.</p>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold"
              placeholder="e.g. The Ruy Lopez Opening" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level *</label>
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold">
                <option value="">Select level</option>
                {levels.map((l) => <option key={l.id} value={l.id} className="capitalize">{l.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (optional)</label>
            <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold"
              placeholder="Brief description..." />
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
          <RichTextEditor content={content} onChange={setContent} placeholder="Write the lesson content here..." />
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={submitForReview} onChange={(e) => setSubmitForReview(e.target.checked)} className="rounded" />
            <span className="text-sm font-medium text-gray-700">Submit for review immediately</span>
          </label>
          <button type="submit" disabled={loading || !canPost}
            className="bg-chess-dark text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-chess-accent disabled:opacity-60 flex items-center gap-2"
            title={!canPost ? 'Daily post limit reached' : undefined}>
            {loading ? <LoadingSpinner size="sm" /> : null}
            {submitForReview ? 'Submit for Review' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
