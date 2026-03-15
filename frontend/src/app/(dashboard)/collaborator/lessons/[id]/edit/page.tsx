'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Category, DifficultyLevel, Tag, Lesson } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { VariationInput } from '@/components/chess/VariationEditor';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const VariationEditor = dynamic(() => import('@/components/chess/VariationEditor'), { ssr: false });

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [levels, setLevels] = useState<DifficultyLevel[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [levelId, setLevelId] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [variations, setVariations] = useState<VariationInput[]>([]);
  const [submitForReview, setSubmitForReview] = useState(false);
  const [statusName, setStatusName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Lesson }>(`/lessons/my/${lessonId}`),
      api.get<{ data: Category[] }>('/categories'),
      api.get<{ data: DifficultyLevel[] }>('/categories/difficulty-levels'),
      api.get<{ data: Tag[] }>('/tags'),
    ]).then(([lessonRes, cats, lvls, tgs]) => {
      const lesson = (lessonRes as { data: Lesson }).data;
      setTitle(lesson.title);
      setContent(lesson.content);
      setExcerpt(lesson.excerpt || '');
      setCategoryId(String(lesson.category.id));
      setLevelId(String(lesson.level.id));
      setSelectedTags(lesson.lessonTags.map((lt) => lt.tag.id));
      setVariations((lesson.variations || []).map((v, i) => ({ name: v.name, notation: v.notation, sortOrder: v.sortOrder ?? i })));
      setStatusName(lesson.status.name);
      setCategories((cats as { data: Category[] }).data);
      setLevels((lvls as { data: DifficultyLevel[] }).data);
      setTags((tgs as { data: Tag[] }).data);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load lesson.');
    }).finally(() => setLoading(false));
  }, [lessonId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !content || !categoryId || !levelId) {
      setError('Title, content, category, and level are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/lessons/${lessonId}`, {
        title, content, excerpt,
        categoryId: parseInt(categoryId),
        difficultyLevelId: parseInt(levelId),
        tagIds: selectedTags,
        variations: variations.filter(v => v.name.trim() && v.notation.trim()),
      });
      if (submitForReview) {
        await api.patch(`/lessons/${lessonId}/submit`, {});
      }
      router.push('/collaborator/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-chess-dark">←</button>
        <h1 className="text-2xl font-bold text-chess-dark">Edit Lesson</h1>
      </div>

      {statusName === 'rejected' && (
        <p className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">
          This lesson was rejected. Edit it and resubmit for review.
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-gold" />
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
