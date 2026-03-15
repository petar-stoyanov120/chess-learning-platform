'use client';

import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  fen: string;
  caption?: string;
  orientation?: 'white' | 'black';
  size?: number;
}

export default function ChessBoard({ fen, caption, orientation = 'white', size = 400 }: ChessBoardProps) {
  return (
    <div className="flex flex-col items-center my-6">
      <div style={{ width: size, maxWidth: '100%' }}>
        <Chessboard
          position={fen}
          boardOrientation={orientation}
          boardWidth={size}
          arePiecesDraggable={false}
        />
      </div>
      {caption && (
        <p className="mt-3 text-sm text-gray-600 italic text-center max-w-sm">{caption}</p>
      )}
    </div>
  );
}
