'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { LessonSummary } from '@/lib/types';

interface LessonPickerModalProps {
  onSelect: (lesson: LessonSummary, teacherNote: string) => Promise<void>;
  onClose: () => void;
  existingLessonIds: number[];
}

export default function LessonPickerModal({ onSelect, onClose, existingLessonIds }: LessonPickerModalProps) {
  const [query, setQuery] = useState('');
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(null);
  const [teacherNote, setTeacherNote] = useState('');
  const [adding, setAdding] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (q.trim()) params.set('search', q.trim());
      const res = await api.get<{ data: LessonSummary[] }>(`/lessons?${params}`);
      setLessons(res.data ?? []);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search('');
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  async function handleAdd() {
    if (!selectedLesson) return;
    setAdding(true);
    try {
      await onSelect(selectedLesson, teacherNote);
      setSelectedLesson(null);
      setTeacherNote('');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-900">Add Lesson to Playlist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search published lessons..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Searching...</div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No lessons found.</div>
          ) : (
            lessons.map((lesson) => {
              const alreadyAdded = existingLessonIds.includes(lesson.id);
              const isSelected = selectedLesson?.id === lesson.id;
              return (
                <button
                  key={lesson.id}
                  disabled={alreadyAdded}
                  onClick={() => setSelectedLesson(isSelected ? null : lesson)}
                  className={`w-full text-left px-3 py-3 rounded-lg mb-1 text-sm transition-colors ${
                    alreadyAdded
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : isSelected
                        ? 'bg-chess-dark text-white'
                        : 'hover:bg-amber-50 text-gray-800'
                  }`}
                >
                  <div className="font-medium">{lesson.title}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                    {lesson.category.name} · {lesson.level.name}
                    {alreadyAdded && ' · Already added'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {selectedLesson && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Teacher note for <em>{selectedLesson.title}</em> (optional):
            </p>
            <textarea
              value={teacherNote}
              onChange={(e) => setTeacherNote(e.target.value)}
              placeholder="e.g. Focus on move 12. Ask students about the alternative..."
              rows={2}
              maxLength={1000}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setSelectedLesson(null); setTeacherNote(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 py-2 bg-chess-dark text-white rounded-lg text-sm font-medium hover:bg-chess-gold transition-colors disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Lesson'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
