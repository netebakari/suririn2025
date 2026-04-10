"use client";

import React, { useState, useEffect, useCallback } from 'react';

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

const parsePuzzleData = (dataStr: string[]): (number | null)[][] => {
  return dataStr.map(row => 
    row.split('').map(char => char === ' ' ? null : parseInt(char, 10))
  );
};

const puzzleData = parsePuzzleData(pulzzeDataStr);

export default function Home() {
  const GRID_SIZE = 8;
  const CELL_SIZE = 48;
  const EDGE_THICKNESS = 16; // Hit area thickness for easier clicking/hovering
  const LINE_THICKNESS = 4; // Actual visual line thickness (optional, but we can just use the background color for now)

  type EdgeState = 'none' | 'line' | 'cross';

  const [hLines, setHLines] = useState<EdgeState[][]>(
    Array.from({ length: GRID_SIZE + 1 }, () => Array(GRID_SIZE).fill('none'))
  );
  
  const [vLines, setVLines] = useState<EdgeState[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE + 1).fill('none'))
  );

  const [cellColors, setCellColors] = useState<number[][]>(
    Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
  );

  const handleHClick = (x: number, y: number) => {
    const newLines = [...hLines];
    newLines[y] = [...newLines[y]];
    newLines[y][x] = newLines[y][x] === 'line' ? 'none' : 'line';
    setHLines(newLines);
  };

  const handleHContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    const newLines = [...hLines];
    newLines[y] = [...newLines[y]];
    newLines[y][x] = newLines[y][x] === 'cross' ? 'none' : 'cross';
    setHLines(newLines);
  };

  const handleVClick = (x: number, y: number) => {
    const newLines = [...vLines];
    newLines[y] = [...newLines[y]];
    newLines[y][x] = newLines[y][x] === 'line' ? 'none' : 'line';
    setVLines(newLines);
  };

  const handleVContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    const newLines = [...vLines];
    newLines[y] = [...newLines[y]];
    newLines[y][x] = newLines[y][x] === 'cross' ? 'none' : 'cross';
    setVLines(newLines);
  };

  const toggleCellColor = (x: number, y: number) => {
    const newColors = [...cellColors];
    newColors[y] = [...newColors[y]];
    newColors[y][x] = (newColors[y][x] + 1) % 3;
    setCellColors(newColors);
  };

  const isSatisfied = useCallback((x: number, y: number, num: number) => {
    let count = 0;
    if (hLines[y][x] === 'line') count++;
    if (hLines[y + 1][x] === 'line') count++;
    if (vLines[y][x] === 'line') count++;
    if (vLines[y][x + 1] === 'line') count++;
    return count === num;
  }, [hLines, vLines]);

  useEffect(() => {
    // 1. すべての数字が条件を満たしているかチェック
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const num = puzzleData[y][x];
        if (num !== null) {
          if (!isSatisfied(x, y, num)) return;
        }
      }
    }

    // 2. 実線が1つの輪っかになっているかチェック（枝分かれ、途切れなし）
    let hasEdges = false;
    let startNode: string | null = null;
    const adj = new Map<string, string[]>();

    for (let y = 0; y <= GRID_SIZE; y++) {
      for (let x = 0; x <= GRID_SIZE; x++) {
        let degree = 0;
        const neighbors: string[] = [];
        const nodeId = `${x},${y}`;

        // 上の辺
        if (y > 0 && vLines[y - 1][x] === 'line') {
          degree++;
          neighbors.push(`${x},${y - 1}`);
        }
        // 下の辺
        if (y < GRID_SIZE && vLines[y][x] === 'line') {
          degree++;
          neighbors.push(`${x},${y + 1}`);
        }
        // 左の辺
        if (x > 0 && hLines[y][x - 1] === 'line') {
          degree++;
          neighbors.push(`${x - 1},${y}`);
        }
        // 右の辺
        if (x < GRID_SIZE && hLines[y][x] === 'line') {
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
  }, [hLines, vLines, isSatisfied]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-24">
      <h1 className="text-2xl font-bold mb-8 text-black">スリザーリンク サンプル問題</h1>
      <div 
        className="relative" 
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE 
        }}
      >
        {/* Cells with numbers */}
        {puzzleData.map((row, y) =>
          row.map((num, x) => (
            <div
              key={`cell-${x}-${y}`}
              className={`absolute flex items-center justify-center text-black text-3xl font-medium cursor-pointer select-none transition-colors duration-200 ${
                cellColors[y][x] === 1 ? 'bg-pink-100' : cellColors[y][x] === 2 ? 'bg-sky-100' : 'bg-transparent'
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
                  {isSatisfied(x, y, num) && (
                    <div className="absolute w-10 h-10 bg-red-200 rounded-full z-0 pointer-events-none" />
                  )}
                  <span className="relative z-10 select-none pointer-events-none">{num}</span>
                </>
              )}
            </div>
          ))
        )}

        {/* Horizontal Edges */}
        {Array.from({ length: GRID_SIZE + 1 }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => (
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
              {hLines[y][x] === 'line' && (
                <div className="w-full h-1 bg-black transition-colors duration-200" />
              )}
              {hLines[y][x] === 'cross' && (
                <>
                  <div className="w-full h-0 border-t-2 border-dotted border-gray-400 absolute" />
                  <div className="text-gray-500 font-bold text-xs absolute z-20 select-none">×</div>
                </>
              )}
              {hLines[y][x] === 'none' && (
                <div className="w-full h-1 bg-transparent group-hover:bg-gray-300 transition-colors duration-200" />
              )}
            </div>
          ))
        )}

        {/* Vertical Edges */}
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE + 1 }).map((_, x) => (
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
              {vLines[y][x] === 'line' && (
                <div className="w-1 h-full bg-black transition-colors duration-200" />
              )}
              {vLines[y][x] === 'cross' && (
                <>
                  <div className="h-full w-0 border-l-2 border-dotted border-gray-400 absolute" />
                  <div className="text-gray-500 font-bold text-xs absolute z-20 select-none">×</div>
                </>
              )}
              {vLines[y][x] === 'none' && (
                <div className="w-1 h-full bg-transparent group-hover:bg-gray-300 transition-colors duration-200" />
              )}
            </div>
          ))
        )}

        {/* Dots */}
        {Array.from({ length: GRID_SIZE + 1 }).map((_, y) =>
          Array.from({ length: GRID_SIZE + 1 }).map((_, x) => (
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
    </main>
  );
}
