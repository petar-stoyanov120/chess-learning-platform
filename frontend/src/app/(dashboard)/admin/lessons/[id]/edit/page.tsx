'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Category, DifficultyLevel, Tag, Lesson } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { VariationInput } from '@/components/chess/VariationEditor';

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor'), { ssr: false });
const InteractiveBoard = dynamic(() => import('@/components/chess/InteractiveBoard'), { ssr: false });
const VariationEditor = dynamic(() => import('@/components/chess/VariationEditor'), { ssr: false });

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface DiagramInput {
  fen: string;
  caption: string;
}

export default function AdminEditLessonPage() {
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
  const [diagrams, setDiagrams] = useState<DiagramInput[]>([]);
  const [variations, setVariations] = useState<VariationInput[]>([]);
  const [statusName, setStatusName] = useState('');

  useEffect(() => {
    Promise.all([
      api.get<{ data: Lesson }>(`/lessons/admin/${lessonId}`),
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
      setDiagrams(lesson.diagrams?.map((d) => ({ fen: d.fen, caption: d.caption || '' })) || []);
      setVariations((lesson.variations || []).map((v, i) => ({ name: v.name, notation: v.notation, sortOrder: v.sortOrder ?? i })));
      setStatusName(lesson.status.name);
      setCategories((cats as { data: Category[] }).data);
      setLevels((lvls as { data: DifficultyLevel[] }).data);
      setTags((tgs as { data: Tag[] }).data);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load lesson.');
    }).finally(() => setLoading(false));
  }, [lessonId]);

  function addDiagram() {
    setDiagrams([...diagrams, { fen: START_FEN, caption: '' }]);
  }

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
        diagrams: diagrams.filter((d) => d.fen.trim()),
        variations: variations.filter((v) => v.name.trim() && v.notation.trim()),
      });
      router.push('/admin/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lesson.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      await api.patch(`/lessons/${lessonId}/approve`, {});
      router.push('/admin/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish lesson.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-chess-dark">&larr;</button>
        <h1 className="text-2xl font-bold text-chess-dark">Edit Lesson</h1>
        <span className="text-sm text-gray-400 capitalize">({statusName.replace('_', ' ')})</span>
      </div>

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

        {/* Chess Position Editor */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Chess Position Editor</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Drag pieces to set a position. The first diagram is shown on the published page.
              </p>
            </div>
            <button type="button" onClick={addDiagram} className="text-sm text-chess-gold hover:underline font-medium">
              + Add diagram
            </button>
          </div>
          {diagrams.length === 0 && <p className="text-sm text-gray-400">No diagrams yet.</p>}
          {diagrams.map((d, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-5 mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-gray-700">Diagram {i + 1}</span>
                <button
                  type="button"
                  onClick={() => setDiagrams(diagrams.filter((_, j) => j !== i))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
              <InteractiveBoard
                fen={d.fen}
                onFenChange={(val) => setDiagrams(diagrams.map((x, j) => j === i ? { ...x, fen: val } : x))}
                size={300}
              />
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Caption (optional)</label>
                <input
                  type="text" value={d.caption}
                  onChange={(e) => setDiagrams(diagrams.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
                  placeholder="Describe the position..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Variations */}
        <VariationEditor variations={variations} onChange={setVariations} />

        {/* Tags */}
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
          <button type="submit" disabled={saving}
            className="bg-chess-dark text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-chess-accent disabled:opacity-60 flex items-center gap-2">
            {saving ? <LoadingSpinner size="sm" /> : null}
            Save Changes
          </button>
          {statusName !== 'published' && (
            <button type="button" onClick={handlePublish} disabled={saving}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60">
              Publish
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
