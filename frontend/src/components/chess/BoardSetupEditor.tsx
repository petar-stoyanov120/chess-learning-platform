'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';

type PositionObj = Record<string, string>;

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FEN_PIECE: Record<string, string> = {
  wP: 'P', wN: 'N', wB: 'B', wR: 'R', wQ: 'Q', wK: 'K',
  bP: 'p', bN: 'n', bB: 'b', bR: 'r', bQ: 'q', bK: 'k',
};
const POSITION_PIECE: Record<string, string> = {
  P: 'wP', N: 'wN', B: 'wB', R: 'wR', Q: 'wQ', K: 'wK',
  p: 'bP', n: 'bN', b: 'bB', r: 'bR', q: 'bQ', k: 'bK',
};
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Unicode chess symbols for the palette (visually matches board pieces)
const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};
const PIECE_LABELS: Record<string, string> = {
  wK: 'K', wQ: 'Q', wR: 'R', wB: 'B', wN: 'N', wP: 'P',
  bK: 'k', bQ: 'q', bR: 'r', bB: 'b', bN: 'n', bP: 'p',
};

const WHITE_PIECES = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'];
const BLACK_PIECES = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];

function positionToFen(position: PositionObj): string {
  const rows = RANKS.map(rank => {
    let row = '';
    let empty = 0;
    FILES.forEach(file => {
      const p = position[`${file}${rank}`];
      if (p && FEN_PIECE[p]) {
        if (empty > 0) { row += empty; empty = 0; }
        row += FEN_PIECE[p];
      } else {
        empty++;
      }
    });
    if (empty > 0) row += empty;
    return row;
  });
  return `${rows.join('/')} w KQkq - 0 1`;
}

function fenToPosition(fen: string): PositionObj {
  const position: PositionObj = {};
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');
  rows.forEach((row, rankIdx) => {
    const rank = 8 - rankIdx;
    let fileIdx = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        fileIdx += parseInt(ch);
      } else {
        const square = `${FILES[fileIdx]}${rank}`;
        const piece = POSITION_PIECE[ch];
        if (piece) position[square] = piece;
        fileIdx++;
      }
    }
  });
  return position;
}

function isBoardSquare(s: string): boolean {
  return /^[a-h][1-8]$/.test(s);
}

interface BoardSetupEditorProps {
  fen: string;
  onFenChange: (fen: string) => void;
  size?: number;
  disabled?: boolean;
}

interface PaletteButtonProps {
  piece: string;
  isSelected: boolean;
  onClick: () => void;
}

function PaletteButton({ piece, isSelected, onClick }: PaletteButtonProps) {
  const isEraser = piece === 'erase';
  return (
    <button
      type="button"
      onClick={onClick}
      title={isEraser ? 'Erase mode — click a square to remove its piece' : `Place ${PIECE_LABELS[piece]} (${piece})`}
      className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg border-2 text-xl transition-all select-none ${
        isSelected
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-400 shadow-sm'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
      } ${isEraser ? 'text-red-400 dark:text-red-400' : ''}`}
    >
      {isEraser ? '✕' : PIECE_SYMBOLS[piece]}
    </button>
  );
}

export default function BoardSetupEditor({
  fen,
  onFenChange,
  size = 360,
  disabled = false,
}: BoardSetupEditorProps) {
  const [position, setPosition] = useState<PositionObj>({});
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const initialized = useRef(false);

  // Load initial FEN once
  useEffect(() => {
    if (!initialized.current && fen) {
      initialized.current = true;
      setPosition(fenToPosition(fen));
    }
  }, [fen]);

  const applyPosition = useCallback(
    (newPos: PositionObj) => {
      setPosition(newPos);
      onFenChange(positionToFen(newPos));
    },
    [onFenChange],
  );

  // Board-to-board drag or spare-to-board (handled by palette click-to-place)
  function handlePieceDrop(sourceSquare: string, targetSquare: string, piece: string): boolean {
    if (disabled) return false;
    const newPos = { ...position };
    if (isBoardSquare(sourceSquare)) {
      delete newPos[sourceSquare];
    }
    newPos[targetSquare] = piece;
    applyPosition(newPos);
    return true;
  }

  // Right-click still removes a piece (keyboard shortcut)
  function handleSquareRightClick(square: string) {
    if (disabled) return;
    const newPos = { ...position };
    delete newPos[square];
    applyPosition(newPos);
  }

  // Click-to-place: palette selected piece is placed on clicked square
  function handleSquareClick(square: string) {
    if (disabled || !selectedPiece) return;
    const newPos = { ...position };
    if (selectedPiece === 'erase') {
      delete newPos[square];
    } else {
      newPos[square] = selectedPiece;
    }
    applyPosition(newPos);
  }

  // Drag piece off the board to delete it
  function handleDropOffBoard(sourceSquare: string) {
    if (disabled) return;
    const newPos = { ...position };
    delete newPos[sourceSquare];
    applyPosition(newPos);
  }

  function handlePaletteClick(piece: string) {
    setSelectedPiece(prev => prev === piece ? null : piece);
  }

  function handleClear() {
    applyPosition({});
    setSelectedPiece(null);
  }

  function handleReset() {
    applyPosition(fenToPosition(START_FEN));
    setSelectedPiece(null);
  }

  function handleFenPaste(val: string) {
    const trimmed = val.trim();
    if (!trimmed) return;
    try {
      applyPosition(fenToPosition(trimmed));
    } catch {
      // ignore invalid FEN
    }
  }

  const currentFen = positionToFen(position);

  if (disabled) {
    return (
      <div style={{ width: size, maxWidth: '100%', margin: '0 auto' }}>
        <Chessboard
          position={position}
          boardWidth={size}
          arePiecesDraggable={false}
          customBoardStyle={{ borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">FEN</label>
          <input
            type="text"
            readOnly
            defaultValue={currentFen}
            className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select a piece from the palette, then click a square to place it. Drag board pieces to move them. Drag a piece off the board or use the ✕ eraser to remove it.
      </p>

      {/* Main layout: palette + board */}
      <div className="flex gap-3 items-start flex-wrap">
        {/* Piece palette sidebar */}
        <div className="flex flex-col gap-1 pt-1 shrink-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">White</p>
          {WHITE_PIECES.map((p) => (
            <PaletteButton
              key={p}
              piece={p}
              isSelected={selectedPiece === p}
              onClick={() => handlePaletteClick(p)}
            />
          ))}

          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 mb-0.5">Black</p>
          {BLACK_PIECES.map((p) => (
            <PaletteButton
              key={p}
              piece={p}
              isSelected={selectedPiece === p}
              onClick={() => handlePaletteClick(p)}
            />
          ))}

          {/* Eraser */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <PaletteButton
              piece="erase"
              isSelected={selectedPiece === 'erase'}
              onClick={() => handlePaletteClick('erase')}
            />
          </div>
        </div>

        {/* Board column */}
        <div className="flex-1 min-w-0">
          <div style={{ width: Math.min(size, 500), maxWidth: '100%' }}>
            <Chessboard
              position={position}
              boardWidth={Math.min(size, 500)}
              sparePieces={false}
              arePiecesDraggable={true}
              onPieceDrop={handlePieceDrop}
              onSquareRightClick={handleSquareRightClick}
              onSquareClick={handleSquareClick}
              onPieceDropOffBoard={handleDropOffBoard}
              onPieceDragBegin={() => setIsDragging(true)}
              onPieceDragEnd={() => setIsDragging(false)}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: selectedPiece && selectedPiece !== 'erase' ? 'crosshair' : selectedPiece === 'erase' ? 'cell' : 'default',
              }}
            />
          </div>

          {/* Trash zone — visible during drag */}
          <div
            className={`mt-2 flex items-center justify-center gap-2 border-2 border-dashed rounded-lg h-10 text-sm transition-all duration-200 ${
              isDragging
                ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 opacity-100'
                : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 opacity-50'
            }`}
          >
            <span>✕</span>
            <span>{isDragging ? 'Drop here to remove piece' : 'Drag off board to remove'}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedPiece(null)}
          className={`text-xs px-3 py-1.5 rounded border transition-colors font-medium ${
            selectedPiece === null
              ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
          title="Switch to normal cursor — click squares to do nothing (drag pieces as usual)"
        >
          ↖ Normal cursor
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 transition-colors font-medium"
        >
          ↺ Starting position
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded border border-red-200 dark:border-red-800 transition-colors font-medium"
        >
          ✕ Clear board
        </button>
      </div>

      {/* FEN input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          FEN — paste a position here or use the board above
        </label>
        <div className="flex gap-2 items-start">
          <input
            type="text"
            defaultValue={currentFen}
            key={currentFen}
            onBlur={(e) => handleFenPaste(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFenPaste((e.target as HTMLInputElement).value); } }}
            className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-chess-gold dark:bg-gray-700 dark:text-gray-100"
            placeholder="Paste FEN to load a position…"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(currentFen)}
            className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 transition-colors whitespace-nowrap"
            title="Copy FEN"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
