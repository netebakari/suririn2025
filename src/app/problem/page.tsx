"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BASE64URL, decodeData } from '@/lib/util';
import { GameState, CellNumber, EdgeState, CellColor } from '@/types/game';

function ProblemContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');

  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    let gridWidth = 8;
    let gridHeight = 8;
    let decodedData: (number | null)[][] = [];
    let isDataValid = false;

    if (dataParam && dataParam.length >= 2) {
      gridWidth = BASE64URL.indexOf(dataParam[0]);
      gridHeight = BASE64URL.indexOf(dataParam[1]);
      if (gridWidth <= 0) gridWidth = 8;
      if (gridHeight <= 0) gridHeight = 8;
      
      const expectedDataLength = Math.ceil((gridWidth * gridHeight) / 2);
      if (dataParam.length - 2 === expectedDataLength) {
        isDataValid = true;
        decodedData = decodeData(dataParam.substring(2), gridWidth, gridHeight);
      } else {
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
    const newHLines = gameState.hLines.map(row => [...row]);
    const newVLines = gameState.vLines.map(row => [...row]);

    let changed = true;
    while (changed) {
      changed = false;

      for (let y = 0; y < gameState.height; y++) {
        for (let x = 0; x < gameState.width; x++) {
          const num = gameState.puzzleData[y][x];

          if (num === 0) {
            if (newHLines[y][x] !== 'cross') { newHLines[y][x] = 'cross'; changed = true; }
            if (newHLines[y + 1][x] !== 'cross') { newHLines[y + 1][x] = 'cross'; changed = true; }
            if (newVLines[y][x] !== 'cross') { newVLines[y][x] = 'cross'; changed = true; }
            if (newVLines[y][x + 1] !== 'cross') { newVLines[y][x + 1] = 'cross'; changed = true; }
          } else if (num !== null) {
            const edges = [
              { type: 'h', r: y, c: x, state: newHLines[y][x] },
              { type: 'h', r: y + 1, c: x, state: newHLines[y + 1][x] },
              { type: 'v', r: y, c: x, state: newVLines[y][x] },
              { type: 'v', r: y, c: x + 1, state: newVLines[y][x + 1] }
            ];

            const crossCount = edges.filter(e => e.state === 'cross').length;
            const lineCount = edges.filter(e => e.state === 'line').length;

            if (4 - crossCount === num) {
              for (const e of edges) {
                if (e.state !== 'cross' && e.state !== 'line') {
                  if (e.type === 'h') newHLines[e.r][e.c] = 'line';
                  if (e.type === 'v') newVLines[e.r][e.c] = 'line';
                  changed = true;
                }
              }
            }

            if (lineCount === num) {
              for (const e of edges) {
                if (e.state !== 'cross' && e.state !== 'line') {
                  if (e.type === 'h') newHLines[e.r][e.c] = 'cross';
                  if (e.type === 'v') newVLines[e.r][e.c] = 'cross';
                  changed = true;
                }
              }
            }
          }
        }
      }
    }

    setGameState({ ...gameState, hLines: newHLines, vLines: newVLines });
  };

  const isSatisfied = useCallback((x: number, y: number, num: number, hL: EdgeState[][], vL: EdgeState[][]) => {
    let count = 0;
    if (hL[y][x] === 'line') count++;
    if (hL[y + 1][x] === 'line') count++;
    if (vL[y][x] === 'line') count++;
    if (vL[y][x + 1] === 'line') count++;
    return count === num;
  }, []);

  useEffect(() => {
    if (!gameState) return;

    // 1. すべての数字が条件を満たしているかチェック
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const num = gameState.puzzleData[y][x];
        if (num !== null) {
          if (!isSatisfied(x, y, num, gameState.hLines, gameState.vLines)) return;
        }
      }
    }

    // 2. 実線が1つの輪っかになっているかチェック（枝分かれ、途切れなし）
    let hasEdges = false;
    let startNode: string | null = null;
    const adj = new Map<string, string[]>();

    for (let y = 0; y <= gameState.height; y++) {
      for (let x = 0; x <= gameState.width; x++) {
        let degree = 0;
        const neighbors: string[] = [];
        const nodeId = `${x},${y}`;

        // 上の辺
        if (y > 0 && gameState.vLines[y - 1][x] === 'line') {
          degree++;
          neighbors.push(`${x},${y - 1}`);
        }
        // 下の辺
        if (y < gameState.height && gameState.vLines[y][x] === 'line') {
          degree++;
          neighbors.push(`${x},${y + 1}`);
        }
        // 左の辺
        if (x > 0 && gameState.hLines[y][x - 1] === 'line') {
          degree++;
          neighbors.push(`${x - 1},${y}`);
        }
        // 右の辺
        if (x < gameState.width && gameState.hLines[y][x] === 'line') {
          degree++;
          neighbors.push(`${x + 1},${y}`);
        }

        if (degree > 0) {
          if (degree !== 2) return; // 枝分かれまたは途切れがある
          hasEdges = true;
          startNode = nodeId;
          adj.set(nodeId, neighbors);
        }
      }
    }

    if (!hasEdges || !startNode) return;

    // 連結成分が1つか（1つの輪っかか）どうかをチェック
    const visited = new Set<string>();
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const neighbor of adj.get(curr) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // 全ての線が含まれるノードを訪問できていれば、1つの輪っかである
    if (visited.size === adj.size) {
      setTimeout(() => alert('正解！'), 50);
    }
  }, [gameState, isSatisfied]);

  if (!gameState) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-24">
      <h1 className="text-2xl font-bold mb-8 text-black">スリザーリンク サンプル問題</h1>
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
      <button
        onClick={handleHint}
        className="mt-12 px-6 py-3 bg-indigo-500 text-white font-bold rounded shadow hover:bg-indigo-600 transition-colors"
      >
        ヒント
      </button>
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
