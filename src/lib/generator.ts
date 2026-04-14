/**
 * スリザーリンクの問題を生成する関数
 * 現在は仮実装として、指定されたサイズの盤面を乱数（nullまたは0〜3）で埋めて返します。
 * 
 * @param width 盤面の幅
 * @param height 盤面の高さ
 * @returns 生成された問題の2次元配列
 */
import { encode } from './util';
import { applySuperHint, isPuzzleSolved } from './solver';
import { GameState, EdgeState, CellNumber, CellColor } from '@/types/game';

function canSolve(puzzleData: (number | null)[][], width: number, height: number): boolean {
  const hLines: EdgeState[][] = Array.from({ length: height + 1 }, () => Array(width).fill('none'));
  const vLines: EdgeState[][] = Array.from({ length: height }, () => Array(width + 1).fill('none'));
  const cellColors: CellColor[][] = Array.from({ length: height }, () => Array(width).fill(0));
  
  const initialState: GameState = {
    width,
    height,
    puzzleData: puzzleData as CellNumber[][],
    hLines,
    vLines,
    cellColors,
  };
  
  const finalState = applySuperHint(initialState);
  return isPuzzleSolved(finalState);
}

function tryGenerateTree(width: number, height: number): number[][] | null {
  const M = Array.from({ length: height }, () => Array(width).fill(0));
  
  const sx = Math.floor(Math.random() * width);
  const sy = Math.floor(Math.random() * height);
  M[sy][sx] = 1;
  let count = 1;
  
  const candidates: {x: number, y: number}[] = [];
  const addCandidates = (cx: number, cy: number) => {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && M[ny][nx] === 0) {
        candidates.push({x: nx, y: ny});
      }
    }
  };
  addCandidates(sx, sy);
  
  const getM = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return M[y][x];
  };
  
  const canTurnOn = (x: number, y: number) => {
    if (M[y][x] === 1) return false;
    
    // 木構造を保つため、周囲4マスの1の数がちょうど1つであることを確認
    let adjOnes = 0;
    if (getM(x, y-1) === 1) adjOnes++;
    if (getM(x, y+1) === 1) adjOnes++;
    if (getM(x-1, y) === 1) adjOnes++;
    if (getM(x+1, y) === 1) adjOnes++;
    if (adjOnes !== 1) return false; // 2個以上なら閉路ができる
    
    // 市松模様チェック (斜め接合による交差を防ぐ)
    if (getM(x-1, y-1) === 1 && getM(x, y-1) === 0 && getM(x-1, y) === 0) return false;
    if (getM(x+1, y-1) === 1 && getM(x, y-1) === 0 && getM(x+1, y) === 0) return false;
    if (getM(x-1, y+1) === 1 && getM(x, y+1) === 0 && getM(x-1, y) === 0) return false;
    if (getM(x+1, y+1) === 1 && getM(x, y+1) === 0 && getM(x+1, y) === 0) return false;
    
    return true;
  };
  
  const maxArea = Math.floor(width * height * 0.6); // 全体の半分未満
  
  while (candidates.length > 0) {
    let idx = candidates.length - 1; // DFS気味に探索
    if (Math.random() < 0.2) { // 少しランダム性をもたせる
      idx = Math.floor(Math.random() * candidates.length);
    }
    const {x, y} = candidates[idx];
    candidates.splice(idx, 1);
    
    if (canTurnOn(x, y)) {
      M[y][x] = 1;
      count++;
      addCandidates(x, y);
      
      if (count >= maxArea) {
        break;
      }
    }
  }
  
  let top = false, bottom = false, left = false, right = false;
  for (let i = 0; i < width; i++) {
    if (M[0][i] === 1) top = true;
    if (M[height-1][i] === 1) bottom = true;
  }
  for (let i = 0; i < height; i++) {
    if (M[i][0] === 1) left = true;
    if (M[i][width-1] === 1) right = true;
  }
  
  if (top && bottom && left && right) {
    return M;
  }
  return null;
}

export function generateProblem(width: number, height: number): (number | null)[][] {
  let M: number[][] | null = null;
  for (let i = 0; i < 1000; i++) {
    M = tryGenerateTree(width, height);
    if (M) break;
  }
  
  // 万が一生成できなかった場合はフォールバック（全セル1）
  if (!M) {
    M = Array.from({ length: height }, () => Array(width).fill(1));
  }
  
  const getM = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    return M![y][x];
  };

  const grid: (number | null)[][] = [];
  for (let y = 0; y < height; y++) {
    const row: (number | null)[] = [];
    for (let x = 0; x < width; x++) {
      let count = 0;
      if (getM(x, y) !== getM(x, y - 1)) count++;
      if (getM(x, y) !== getM(x, y + 1)) count++;
      if (getM(x, y) !== getM(x - 1, y)) count++;
      if (getM(x, y) !== getM(x + 1, y)) count++;
      
      row.push(count);
    }
    grid.push(row);
  }
  
  // 数字を減らすリダクションフェーズ
  const cells: {x: number, y: number}[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({x, y});
    }
  }
  
  // 順番をランダムにシャッフル
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  
  // 1つずつ数字を消してみて、唯一解が保たれるかチェック
  for (const {x, y} of cells) {
    const originalNum = grid[y][x];
    grid[y][x] = null;
    
    if (!canSolve(grid, width, height)) {
      // 解けなくなった場合は元に戻す
      grid[y][x] = originalNum;
    }
  }
  
  return grid;
}

export function generateUrl(width: number, height: number): string {
  const grid = generateProblem(width, height);
  const formattedGrid = grid.map(row => 
    row.map(cell => cell === null ? '.' : cell.toString()).join('')
  );
  const data = encode(formattedGrid);
  return `http://localhost:3000/problem?data=${data}`;
}

// CLIとして実行された場合の処理
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  const width = parseInt(args[0], 10);
  const height = parseInt(args[1], 10);

  if (isNaN(width) || isNaN(height)) {
    console.error('Usage: npm run generate <width> <height>');
    process.exit(1);
  }

  const url = generateUrl(width, height);
  console.log(url);
}
