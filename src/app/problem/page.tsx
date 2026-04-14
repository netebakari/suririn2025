"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE64URL, decodeData, encode } from '@/lib/util';
import { GameState, CellNumber, EdgeState, CellColor } from '@/types/game';
import { isSatisfied, isPuzzleSolved, applyHint, applySuperHint } from '@/lib/solver';

function ProblemContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [jsonText, setJsonText] = useState<string>('');

  useEffect(() => {
    let gridWidth = 8;
    let gridHeight = 8;
    let decodedData: (number | null)[][] = [];
    let isDataValid = false;

    if (dataParam && dataParam.length >= 2) {
      try {
        decodedData = decodeData(dataParam);
        gridWidth = decodedData[0].length;
        gridHeight = decodedData.length;
        isDataValid = true;
      } catch (e) {
        alert('データが間違っています');
      }
    }

    if (!isDataValid) {
      const pulzzeDataStr = [
        "10    3 ",
        " 3 23103",
        "      1 ",
        "3103    ",
        "    2230",
        " 3      ",
        "13020 0 ",
        " 2    32"  
      ];
      gridWidth = 8;
      gridHeight = 8;
      decodedData = pulzzeDataStr.map(row => 
        row.split('').map(char => char === ' ' ? null : parseInt(char, 10))
      );
    }

    setGameState({
      width: gridWidth,
      height: gridHeight,
      puzzleData: decodedData as CellNumber[][],
      hLines: Array.from({ length: gridHeight + 1 }, () => Array(gridWidth).fill('none')),
      vLines: Array.from({ length: gridHeight }, () => Array(gridWidth + 1).fill('none')),
      cellColors: Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0))
    });
  }, [dataParam]);

  const CELL_SIZE = 48;
  const EDGE_THICKNESS = 16; // Hit area thickness for easier clicking/hovering
  const LINE_THICKNESS = 4; // Actual visual line thickness (optional, but we can just use the background color for now)

  const handleHClick = (x: number, y: number) => {
    if (!gameState) return;
    const newHLines = gameState.hLines.map(row => [...row]);
    newHLines[y][x] = newHLines[y][x] === 'line' ? 'none' : 'line';
    setGameState({ ...gameState, hLines: newHLines });
  };

  const handleHContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (!gameState) return;
    const newHLines = gameState.hLines.map(row => [...row]);
    newHLines[y][x] = newHLines[y][x] === 'cross' ? 'none' : 'cross';
    setGameState({ ...gameState, hLines: newHLines });
  };

  const handleVClick = (x: number, y: number) => {
    if (!gameState) return;
    const newVLines = gameState.vLines.map(row => [...row]);
    newVLines[y][x] = newVLines[y][x] === 'line' ? 'none' : 'line';
    setGameState({ ...gameState, vLines: newVLines });
  };

  const handleVContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (!gameState) return;
    const newVLines = gameState.vLines.map(row => [...row]);
    newVLines[y][x] = newVLines[y][x] === 'cross' ? 'none' : 'cross';
    setGameState({ ...gameState, vLines: newVLines });
  };

  const toggleCellColor = (x: number, y: number) => {
    if (!gameState) return;
    const newColors = gameState.cellColors.map(row => [...row]);
    newColors[y][x] = ((newColors[y][x] + 1) % 3) as CellColor;
    setGameState({ ...gameState, cellColors: newColors });
  };

  const handleHint = () => {
    if (!gameState) return;
    setGameState(applyHint(gameState));
  };

  const handleSuperHint = () => {
    if (!gameState) return;
    setGameState(applySuperHint(gameState));
  };

  useEffect(() => {
    if (gameState) {
      setJsonText(JSON.stringify(gameState, null, 2));
    }
  }, [gameState]);

  const handleJsonUpdate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setGameState(parsed);
      
      if (parsed && parsed.puzzleData) {
        const formattedGrid = parsed.puzzleData.map((row: any[]) => 
          row.map((cell: any) => cell === null ? '.' : cell.toString()).join('')
        );
        const encoded = encode(formattedGrid);
        window.history.pushState(null, '', `/problem?data=${encoded}`);
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  useEffect(() => {
    if (!gameState) return;

    if (isPuzzleSolved(gameState)) {
      setTimeout(() => alert('正解！'), 50);
    }
  }, [gameState]);

  if (!gameState) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-24">
      <h1 className="text-2xl font-bold mb-8 text-black">スリザーリンク ({gameState.width}x{gameState.height})</h1>
      <div 
        className="relative" 
        style={{ 
          width: gameState.width * CELL_SIZE, 
          height: gameState.height * CELL_SIZE 
        }}
      >
        {/* Cells with numbers */}
        {gameState.puzzleData.map((row, y) =>
          row.map((num, x) => (
            <div
              key={`cell-${x}-${y}`}
              className={`absolute flex items-center justify-center text-black text-3xl font-medium cursor-pointer select-none transition-colors duration-200 ${
                gameState.cellColors[y][x] === 1 ? 'bg-pink-100' : gameState.cellColors[y][x] === 2 ? 'bg-sky-100' : 'bg-transparent'
              }`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
              onClick={() => toggleCellColor(x, y)}
            >
              {num !== null && (
                <>
                  {isSatisfied(x, y, num, gameState.hLines, gameState.vLines) && (
                    <div className="absolute w-10 h-10 bg-red-200 rounded-full z-0 pointer-events-none" />
                  )}
                  <span className="relative z-10 select-none pointer-events-none">{num}</span>
                </>
              )}
            </div>
          ))
        )}

        {/* Horizontal Edges */}
        {Array.from({ length: gameState.height + 1 }).map((_, y) =>
          Array.from({ length: gameState.width }).map((_, x) => (
            <div
              key={`h-edge-${x}-${y}`}
              className="absolute flex items-center justify-center cursor-pointer group z-10"
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE - EDGE_THICKNESS / 2,
                width: CELL_SIZE,
                height: EDGE_THICKNESS,
              }}
              onClick={() => handleHClick(x, y)}
              onContextMenu={(e) => handleHContextMenu(e, x, y)}
            >
              {gameState.hLines[y][x] === 'line' && (
                <div className="w-full h-1 bg-black transition-colors duration-200" />
              )}
              {gameState.hLines[y][x] === 'cross' && (
                <>
                  <div className="w-full h-0 border-t-2 border-dotted border-gray-400 absolute" />
                  <div className="text-gray-500 font-bold text-xs absolute z-20 select-none">×</div>
                </>
              )}
              {gameState.hLines[y][x] === 'none' && (
                <div className="w-full h-1 bg-transparent group-hover:bg-gray-300 transition-colors duration-200" />
              )}
            </div>
          ))
        )}

        {/* Vertical Edges */}
        {Array.from({ length: gameState.height }).map((_, y) =>
          Array.from({ length: gameState.width + 1 }).map((_, x) => (
            <div
              key={`v-edge-${x}-${y}`}
              className="absolute flex items-center justify-center cursor-pointer group z-10"
              style={{
                left: x * CELL_SIZE - EDGE_THICKNESS / 2,
                top: y * CELL_SIZE,
                width: EDGE_THICKNESS,
                height: CELL_SIZE,
              }}
              onClick={() => handleVClick(x, y)}
              onContextMenu={(e) => handleVContextMenu(e, x, y)}
            >
              {gameState.vLines[y][x] === 'line' && (
                <div className="w-1 h-full bg-black transition-colors duration-200" />
              )}
              {gameState.vLines[y][x] === 'cross' && (
                <>
                  <div className="h-full w-0 border-l-2 border-dotted border-gray-400 absolute" />
                  <div className="text-gray-500 font-bold text-xs absolute z-20 select-none">×</div>
                </>
              )}
              {gameState.vLines[y][x] === 'none' && (
                <div className="w-1 h-full bg-transparent group-hover:bg-gray-300 transition-colors duration-200" />
              )}
            </div>
          ))
        )}

        {/* Dots */}
        {Array.from({ length: gameState.height + 1 }).map((_, y) =>
          Array.from({ length: gameState.width + 1 }).map((_, x) => (
            <div
              key={`dot-${x}-${y}`}
              className="absolute bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: x * CELL_SIZE, 
                top: y * CELL_SIZE,
                width: '6px',
                height: '6px',
                zIndex: 20
              }}
            />
          ))
        )}
      </div>
      <div className="mt-12 flex gap-4">
        <button
          onClick={handleHint}
          className="px-6 py-3 bg-indigo-500 text-white font-bold rounded shadow hover:bg-indigo-600 transition-colors"
        >
          ヒント
        </button>
        <button
          onClick={handleSuperHint}
          className="px-6 py-3 bg-purple-600 text-white font-bold rounded shadow hover:bg-purple-700 transition-colors"
        >
          強力なヒント
        </button>
      </div>

      <div className="mt-8 w-full max-w-4xl flex flex-col gap-4">
        <h2 className="text-xl font-bold text-black">デバッグ用 GameState JSON</h2>
        <textarea 
          className="w-full h-64 p-4 border rounded text-sm font-mono text-black"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        <button
          onClick={handleJsonUpdate}
          className="px-6 py-3 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 transition-colors self-start"
        >
          JSONを反映
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProblemContent />
    </Suspense>
  );
}
