'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';

const InteractiveBoard = dynamic(() => import('./InteractiveBoard'), { ssr: false });

export interface VariationInput {
  name: string;
  notation: string;
  sortOrder: number;
}

interface VariationEditorProps {
  variations: VariationInput[];
  onChange: (variations: VariationInput[]) => void;
}

export default function VariationEditor({ variations, onChange }: VariationEditorProps) {
  const add = useCallback(() => {
    onChange([...variations, { name: '', notation: '', sortOrder: variations.length }]);
  }, [variations, onChange]);

  const remove = useCallback(
    (index: number) => {
      onChange(
        variations
          .filter((_, i) => i !== index)
          .map((v, i) => ({ ...v, sortOrder: i })),
      );
    },
    [variations, onChange],
  );

  const updateName = useCallback(
    (index: number, value: string) => {
      onChange(variations.map((v, i) => (i === index ? { ...v, name: value } : v)));
    },
    [variations, onChange],
  );

  const updateNotation = useCallback(
    (index: number, value: string) => {
      onChange(variations.map((v, i) => (i === index ? { ...v, notation: value } : v)));
    },
    [variations, onChange],
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const next = index + direction;
      if (next < 0 || next >= variations.length) return;
      const arr = [...variations];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      onChange(arr.map((v, i) => ({ ...v, sortOrder: i })));
    },
    [variations, onChange],
  );

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Variations</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Add opening lines or positions. Drag pieces to set a position.
          </p>
        </div>
        <button type="button" onClick={add} className="text-sm text-chess-gold hover:underline font-medium">
          + Add Variation
        </button>
      </div>

      {variations.length === 0 && (
        <p className="text-sm text-gray-400">
          No variations yet. Click &quot;Add Variation&quot; to add opening lines or positions.
        </p>
      )}

      <div className="space-y-6">
        {variations.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
            {/* Header row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Variation {i + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white transition-colors"
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === variations.length - 1}
                  className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1.5 py-0.5 rounded border border-gray-300 hover:bg-white transition-colors"
                  title="Move down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline ml-1"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Variation name */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Variation name
              </label>
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateName(i, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-chess-gold bg-white"
                placeholder="e.g. Najdorf Variation, Classical Line"
              />
            </div>

            {/* Interactive board for this variation */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-3">Chess Position Editor</p>
              <InteractiveBoard
                fen={v.notation}
                onFenChange={(val) => updateNotation(i, val)}
                size={280}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
