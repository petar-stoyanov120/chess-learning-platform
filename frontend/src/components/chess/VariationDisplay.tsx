'use client';

import { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Variation } from '@/lib/types';

interface VariationDisplayProps {
  variations: Variation[];
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function notationToFen(notation: string): string {
  const trimmed = notation.trim();
  if (!trimmed) return STARTING_FEN;

  if (trimmed.includes('/')) {
    try {
      const chess = new Chess(trimmed);
      return chess.fen();
    } catch {
      return STARTING_FEN;
    }
  }

  try {
    const chess = new Chess();
    chess.loadPgn(trimmed);
    return chess.fen();
  } catch {
    return STARTING_FEN;
  }
}

export default function VariationDisplay({ variations }: VariationDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeFen = useMemo(
    () => notationToFen(variations[activeIndex]?.notation ?? ''),
    [variations, activeIndex]
  );

  if (variations.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <h2 className="text-xl font-bold text-chess-dark mb-6">Variations</h2>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Variation list */}
        <div className="md:w-64 flex-shrink-0">
          <ul className="space-y-1">
            {variations.map((v, i) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    i === activeIndex
                      ? 'bg-chess-dark text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {v.name || `Variation ${i + 1}`}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Board */}
        <div className="flex-1 flex justify-center">
          <div style={{ width: 360, maxWidth: '100%' }}>
            <Chessboard
              position={activeFen}
              boardWidth={360}
              arePiecesDraggable={false}
            />
            <p className="mt-2 text-center text-sm font-medium text-gray-700">
              {variations[activeIndex]?.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
