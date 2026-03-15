'use client';

import { useState, useEffect, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

interface NotationPreviewProps {
  notation: string;
  onNotationChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  size?: number;
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function parseNotation(input: string): { fen: string | null; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { fen: STARTING_FEN, error: null };

  // Try as FEN first (contains slashes)
  if (trimmed.includes('/')) {
    try {
      const chess = new Chess(trimmed);
      return { fen: chess.fen(), error: null };
    } catch {
      return { fen: null, error: 'Invalid FEN notation.' };
    }
  }

  // Try as PGN
  try {
    const chess = new Chess();
    chess.loadPgn(trimmed);
    return { fen: chess.fen(), error: null };
  } catch {
    return { fen: null, error: 'Invalid PGN notation.' };
  }
}

export default function NotationPreview({
  notation,
  onNotationChange,
  label = 'Notation (FEN or PGN)',
  placeholder = 'Paste FEN or PGN here...',
  size = 280,
}: NotationPreviewProps) {
  const [debouncedNotation, setDebouncedNotation] = useState(notation);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNotation(notation), 300);
    return () => clearTimeout(timer);
  }, [notation]);

  const { fen, error } = useMemo(() => parseNotation(debouncedNotation), [debouncedNotation]);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
          value={notation}
          onChange={(e) => onNotationChange(e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded text-sm font-mono resize-none focus:outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-chess-gold'
          }`}
          placeholder={placeholder}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex justify-center">
        <div style={{ width: size, maxWidth: '100%' }}>
          <Chessboard
            position={fen ?? STARTING_FEN}
            boardWidth={size}
            arePiecesDraggable={false}
          />
        </div>
      </div>
    </div>
  );
}
