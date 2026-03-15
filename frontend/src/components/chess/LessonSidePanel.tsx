'use client';

import { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Variation } from '@/lib/types';

interface LessonSidePanelProps {
  /** FEN string from the first diagram (lessons only). Omit for blog posts. */
  mainFen?: string;
  variations: Variation[];
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Parse FEN or PGN notation to a valid FEN string, falling back to starting position. */
function parseFen(notation: string): string {
  if (!notation?.trim()) return START_FEN;
  const t = notation.trim();
  // FEN strings contain '/' separating ranks
  if (t.includes('/')) {
    try {
      new Chess(t);
      return t;
    } catch {
      return START_FEN;
    }
  }
  // Otherwise try PGN
  try {
    const c = new Chess();
    c.loadPgn(t);
    return c.fen();
  } catch {
    return START_FEN;
  }
}

const BOARD_SIZE = 380;

export default function LessonSidePanel({ mainFen, variations }: LessonSidePanelProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  // For blog posts (no mainFen), use the first variation's position as the main board.
  // For lessons, mainFen comes from the first diagram.
  const effectiveMainFen = mainFen
    ? parseFen(mainFen)
    : variations.length > 0
      ? parseFen(variations[0].notation)
      : START_FEN;

  // The raw notation shown in the code block (FEN string or PGN depending on what was saved)
  const effectiveMainNotation = mainFen ?? variations[0]?.notation ?? START_FEN;

  const boardFen = useMemo(() => {
    if (activeId !== null) {
      const v = variations.find((x) => x.id === activeId);
      return v ? parseFen(v.notation) : effectiveMainFen;
    }
    return effectiveMainFen;
  }, [activeId, variations, effectiveMainFen]);

  const displayNotation =
    activeId !== null
      ? (variations.find((v) => v.id === activeId)?.notation ?? effectiveMainNotation)
      : effectiveMainNotation;

  // Nothing to show — parent should not render this
  if (!mainFen && variations.length === 0) return null;

  function toggle(id: number) {
    setActiveId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Static, non-interactive chess board */}
      <div style={{ maxWidth: BOARD_SIZE }} className="mx-auto">
        <Chessboard
          position={boardFen}
          boardWidth={BOARD_SIZE}
          arePiecesDraggable={false}
        />
      </div>

      {/* Notation block — only shown when notation is PGN (has readable moves, not raw FEN) */}
      {!displayNotation.includes('/') && displayNotation.trim() && displayNotation !== START_FEN && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Moves
          </p>
          <p className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 leading-relaxed">
            {displayNotation.trim()}
          </p>
        </div>
      )}

      {/* Variations list — clicking updates the board; clicking active resets to main */}
      {variations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Variations
          </p>
          <ul className="space-y-1">
            {variations.map((v, i) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => toggle(v.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeId === v.id
                      ? 'bg-chess-dark text-white'
                      : 'text-gray-700 hover:bg-amber-50 hover:text-chess-dark border border-transparent hover:border-amber-200'
                  }`}
                >
                  {v.name || `Variation ${i + 1}`}
                </button>
              </li>
            ))}
          </ul>
          {activeId !== null && (
            <p className="mt-2 text-xs text-gray-400 text-center">
              Click the highlighted variation again to reset the board
            </p>
          )}
        </div>
      )}
    </div>
  );
}
