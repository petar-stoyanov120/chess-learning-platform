'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface InteractiveBoardProps {
  fen: string;
  onFenChange: (fen: string) => void;
  size?: number;
}

export default function InteractiveBoard({ fen, onFenChange, size = 340 }: InteractiveBoardProps) {
  // Stable mutable chess instance — we mutate it in place, track display state separately
  const chessRef = useRef<Chess | null>(null);
  function getChess(): Chess {
    if (!chessRef.current) chessRef.current = new Chess();
    return chessRef.current;
  }

  const [boardFen, setBoardFen] = useState(START_FEN);
  const [textFen, setTextFen] = useState('');
  const [fenError, setFenError] = useState('');
  const initialized = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync once when a non-empty fen prop arrives (handles async load of existing lesson/post)
  useEffect(() => {
    if (!initialized.current && fen) {
      initialized.current = true;
      try {
        getChess().load(fen);
      } catch {
        getChess().reset();
      }
      const f = getChess().fen();
      setBoardFen(f);
      setTextFen(f);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const applyFen = useCallback(
    (newFen: string) => {
      setBoardFen(newFen);
      setTextFen(newFen);
      setFenError('');
      onFenChange(newFen);
    },
    [onFenChange],
  );

  function onDrop(source: string, target: string): boolean {
    try {
      const move = getChess().move({ from: source, to: target, promotion: 'q' });
      if (!move) return false;
      const newFen = getChess().fen();
      const notation = getChess().pgn() || newFen;
      setBoardFen(newFen);
      setTextFen(notation);
      setFenError('');
      onFenChange(notation);
      return true;
    } catch {
      return false;
    }
  }

  function handleReset() {
    getChess().reset();
    setBoardFen(START_FEN);
    setTextFen('');
    setFenError('');
    onFenChange(START_FEN);
  }

  function handleUndo() {
    getChess().undo();
    const newFen = getChess().fen();
    const notation = getChess().pgn() || newFen;
    setBoardFen(newFen);
    setTextFen(notation);
    setFenError('');
    onFenChange(notation);
  }

  function handleTextChange(val: string) {
    setTextFen(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const t = val.trim();
      if (!t) {
        getChess().reset();
        const f = getChess().fen();
        setBoardFen(f);
        setFenError('');
        onFenChange(f);
        return;
      }
      try {
        // FEN strings contain '/' separating ranks — try FEN first, then PGN
        if (t.includes('/')) {
          getChess().load(t);
          const f = getChess().fen();
          setBoardFen(f);
          setFenError('');
          onFenChange(f); // store FEN as-is
        } else {
          getChess().reset();
          getChess().loadPgn(t);
          const f = getChess().fen();
          setBoardFen(f);
          setFenError('');
          onFenChange(t); // store the PGN text (human-readable)
        }
      } catch {
        setFenError('Invalid FEN or PGN notation.');
      }
    }, 400);
  }

  return (
    <div className="space-y-3">
      <div style={{ width: size, maxWidth: '100%', margin: '0 auto' }}>
        <Chessboard
          position={boardFen}
          boardWidth={size}
          onPieceDrop={onDrop}
          arePiecesDraggable={true}
        />
      </div>

      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded border border-gray-300 transition-colors font-medium"
        >
          ↺ Reset to start
        </button>
        <button
          type="button"
          onClick={handleUndo}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded border border-gray-300 transition-colors font-medium"
        >
          ← Undo last move
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          FEN or PGN Notation — drag pieces above, or paste notation here
        </label>
        <textarea
          value={textFen}
          onChange={(e) => handleTextChange(e.target.value)}
          rows={3}
          className={`w-full px-2 py-1.5 border rounded text-xs font-mono resize-none focus:outline-none focus:ring-1 ${
            fenError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-chess-gold'
          }`}
          placeholder={`Paste FEN (e.g. rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2)\nor PGN (e.g. 1. e4 c5 2. Nf3 d6)`}
        />
        {fenError && <p className="mt-1 text-xs text-red-600">{fenError}</p>}
      </div>
    </div>
  );
}
