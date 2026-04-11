'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Move } from 'chess.js';
import { Puzzle } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PuzzleBoardProps {
  puzzle: Puzzle;
  onSolved?: (triesCount: number) => void;
}

type BoardStatus = 'idle' | 'wrong' | 'correct' | 'solved';

export default function PuzzleBoard({ puzzle, onSolved }: PuzzleBoardProps) {
  const { user } = useAuth();
  const chessRef = useRef(new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<BoardStatus>('idle');
  const [triesCount, setTriesCount] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const solvingRef = useRef(false);

  const boardOrientation = puzzle.sideToMove === 'white' ? 'white' : 'black';

  function uciToMove(uci: string): { from: string; to: string; promotion?: string } {
    return {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length === 5 ? uci[4] : undefined,
    };
  }

  async function recordAttempt(didSolve: boolean, tries: number) {
    if (!user) return;
    try {
      await api.post(`/puzzles/${puzzle.id}/attempt`, { solved: didSolve, triesCount: tries });
    } catch {
      // non-critical
    }
  }

  const playEngineResponse = useCallback((nextMoveIndex: number) => {
    const engineUci = puzzle.solution[nextMoveIndex];
    if (!engineUci) return;

    setTimeout(() => {
      const moveData = uciToMove(engineUci);
      const chess = chessRef.current;
      try {
        chess.move(moveData as Move);
        setFen(chess.fen());
        setMoveIndex(nextMoveIndex + 1);
        setStatus('idle');
      } catch {
        // invalid engine move in puzzle data
      }
    }, 500);
  }, [puzzle.solution]);

  function handleSolvePuzzle(finalTries: number) {
    setSolved(true);
    setStatus('solved');
    recordAttempt(true, finalTries);
    onSolved?.(finalTries);
  }

  function onPieceDrop(sourceSquare: string, targetSquare: string, piece: string): boolean {
    if (solved || solvingRef.current) return false;

    const chess = chessRef.current;
    const expectedUci = puzzle.solution[moveIndex];
    if (!expectedUci) return false;

    const expected = uciToMove(expectedUci);
    const isPromotion = piece[1] === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1');
    const promotion = isPromotion ? 'q' : undefined;

    const playerUci = sourceSquare + targetSquare + (promotion ?? '');
    const isCorrect = playerUci === expectedUci || playerUci === expectedUci.slice(0, 4);

    if (!isCorrect) {
      const newTries = triesCount + 1;
      setTriesCount(newTries);
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 600);
      if (newTries >= 3) setShowSolution(true);
      recordAttempt(false, newTries);
      return false;
    }

    // Correct move
    solvingRef.current = true;
    try {
      chess.move({ from: expected.from, to: expected.to, promotion: expected.promotion });
    } catch {
      solvingRef.current = false;
      return false;
    }

    setFen(chess.fen());
    setStatus('correct');
    const nextIndex = moveIndex + 1;

    // Check if puzzle is fully solved
    if (nextIndex >= puzzle.solution.length) {
      const finalTries = triesCount + 1;
      setTriesCount(finalTries);
      handleSolvePuzzle(finalTries);
      solvingRef.current = false;
    } else {
      // Play engine response
      playEngineResponse(nextIndex);
      solvingRef.current = false;
    }

    return true;
  }

  function handleShowSolution() {
    setShowSolution(true);
    // Play through remaining solution moves
    const chess = chessRef.current;
    let delay = 0;
    for (let i = moveIndex; i < puzzle.solution.length; i++) {
      const uci = puzzle.solution[i];
      delay += 700;
      setTimeout(() => {
        try {
          chess.move(uciToMove(uci) as Move);
          setFen(chess.fen());
          if (i === puzzle.solution.length - 1) {
            setSolved(true);
            setStatus('solved');
          }
        } catch {
          // ignore
        }
      }, delay);
    }
  }

  function handleReset() {
    chessRef.current = new Chess(puzzle.fen);
    setFen(puzzle.fen);
    setMoveIndex(0);
    setStatus('idle');
    setTriesCount(0);
    setSolved(false);
    setShowSolution(false);
    solvingRef.current = false;
  }

  const BOARD_SIZE = 400;

  const boardStyle: React.CSSProperties = {
    borderRadius: '8px',
    overflow: 'hidden',
    border: status === 'wrong'
      ? '3px solid #ef4444'
      : status === 'correct' || status === 'solved'
        ? '3px solid #22c55e'
        : '3px solid transparent',
    transition: 'border-color 0.2s',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status banner */}
      <div className={`w-full max-w-md px-4 py-2 rounded-lg text-center text-sm font-medium transition-all ${
        solved
          ? 'bg-green-100 text-green-800'
          : status === 'wrong'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-50 text-gray-600 border border-gray-200'
      }`}>
        {solved
          ? `🎉 Puzzle solved! (${triesCount} attempt${triesCount !== 1 ? 's' : ''})`
          : status === 'wrong'
            ? '❌ That\'s not the right move. Try again!'
            : `${puzzle.sideToMove === 'white' ? '⬜' : '⬛'} ${puzzle.sideToMove.charAt(0).toUpperCase() + puzzle.sideToMove.slice(1)} to move`
        }
      </div>

      {/* Board */}
      <div style={boardStyle}>
        <Chessboard
          position={fen}
          boardWidth={BOARD_SIZE}
          boardOrientation={boardOrientation}
          arePiecesDraggable={!solved}
          onPieceDrop={onPieceDrop}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap justify-center">
        {!solved && triesCount >= 3 && !showSolution && (
          <button
            onClick={handleShowSolution}
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
          >
            Show Solution
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Reset Puzzle
        </button>
      </div>

      {/* Themes */}
      {puzzle.themes.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {puzzle.themes.map((theme) => (
            <span key={theme} className="text-xs bg-chess-dark/10 text-chess-dark px-2 py-0.5 rounded-full">
              {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
