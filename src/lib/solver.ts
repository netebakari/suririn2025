import { GameState, EdgeState, CellNumber, CellColor } from '@/types/game';

/**
 * 指定したセルの数字の条件を満たしているかチェックする
 */
export function isSatisfied(x: number, y: number, num: number, hLines: EdgeState[][], vLines: EdgeState[][]): boolean {
  let count = 0;
  if (hLines[y][x] === 'line') count++;
  if (hLines[y + 1][x] === 'line') count++;
  if (vLines[y][x] === 'line') count++;
  if (vLines[y][x + 1] === 'line') count++;
  return count === num;
}



function hasContradiction(state: GameState): boolean {
  // 1. セルの数字と線の矛盾チェック
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const num = state.puzzleData[y][x];
      if (num !== null) {
        let lines = 0, crosses = 0;
        if (state.hLines[y][x] === 'line') lines++; else if (state.hLines[y][x] === 'cross') crosses++;
        if (state.hLines[y + 1][x] === 'line') lines++; else if (state.hLines[y + 1][x] === 'cross') crosses++;
        if (state.vLines[y][x] === 'line') lines++; else if (state.vLines[y][x] === 'cross') crosses++;
        if (state.vLines[y][x + 1] === 'line') lines++; else if (state.vLines[y][x + 1] === 'cross') crosses++;
        
        if (lines > num) return true; // 実線が多すぎる
        if (4 - crosses < num) return true; // 実線を引ける余地が足りない
      }
    }
  }

  // 2. ドット（頂点）の線の数の矛盾チェック
  const adj = new Map<string, string[]>();
  for (let y = 0; y <= state.height; y++) {
    for (let x = 0; x <= state.width; x++) {
      adj.set(`${x},${y}`, []);
    }
  }
  let totalLines = 0;
  for (let y = 0; y <= state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      if (state.hLines[y][x] === 'line') {
        adj.get(`${x},${y}`)!.push(`${x + 1},${y}`);
        adj.get(`${x + 1},${y}`)!.push(`${x},${y}`);
        totalLines++;
      }
    }
  }
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x <= state.width; x++) {
      if (state.vLines[y][x] === 'line') {
        adj.get(`${x},${y}`)!.push(`${x},${y + 1}`);
        adj.get(`${x},${y + 1}`)!.push(`${x},${y}`);
        totalLines++;
      }
    }
  }

  for (let y = 0; y <= state.height; y++) {
    for (let x = 0; x <= state.width; x++) {
      const neighbors = adj.get(`${x},${y}`)!;
      if (neighbors.length > 2) return true; // 分岐（3本以上の線が交差）
      
      if (neighbors.length === 1) {
        let noneCount = 0;
        if (y > 0 && state.vLines[y - 1][x] === 'none') noneCount++;
        if (y < state.height && state.vLines[y][x] === 'none') noneCount++;
        if (x > 0 && state.hLines[y][x - 1] === 'none') noneCount++;
        if (x < state.width && state.hLines[y][x] === 'none') noneCount++;
        if (noneCount === 0) return true; // 行き止まり（もう線を伸ばせない）
      }
    }
  }

  // 4. 色塗り（Inside/Outside）の矛盾チェック
  const getColor = (cx: number, cy: number) => {
    if (cx < 0 || cx >= state.width || cy < 0 || cy >= state.height) return 1 as CellColor;
    return state.cellColors[cy][cx];
  }

  for (let y = 0; y <= state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const edge = state.hLines[y][x];
      const c1 = getColor(x, y - 1);
      const c2 = getColor(x, y);
      if (c1 !== 0 && c2 !== 0) {
        if (edge === 'line' && c1 === c2) return true;
        if (edge === 'cross' && c1 !== c2) return true;
      }
    }
  }
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x <= state.width; x++) {
      const edge = state.vLines[y][x];
      const c1 = getColor(x - 1, y);
      const c2 = getColor(x, y);
      if (c1 !== 0 && c2 !== 0) {
        if (edge === 'line' && c1 === c2) return true;
        if (edge === 'cross' && c1 !== c2) return true;
      }
    }
  }

  // 3. ループの完成チェック（小さなループができていないか）
  const visited = new Set<string>();
  for (let y = 0; y <= state.height; y++) {
    for (let x = 0; x <= state.width; x++) {
      const startNode = `${x},${y}`;
      if (!visited.has(startNode) && adj.get(startNode)!.length > 0) {
        let isLoop = false;
        const q = [{ node: startNode, parent: null as string | null }];
        const compVisited = new Set<string>();
        compVisited.add(startNode);
        
        while (q.length > 0) {
          const { node, parent } = q.shift()!;
          visited.add(node);
          for (const neighbor of adj.get(node)!) {
            if (neighbor === parent) continue;
            if (compVisited.has(neighbor)) {
              isLoop = true;
            } else {
              compVisited.add(neighbor);
              q.push({ node: neighbor, parent: node });
            }
          }
        }

        if (isLoop) {
          // ループが完成している場合、他に実線があれば矛盾
          if (compVisited.size < totalLines) return true; 
          
          // すべての数字が満たされているか
          let allSatisfied = true;
          for (let cy = 0; cy < state.height; cy++) {
            for (let cx = 0; cx < state.width; cx++) {
              const num = state.puzzleData[cy][cx];
              if (num !== null) {
                let count = 0;
                if (state.hLines[cy][cx] === 'line') count++;
                if (state.hLines[cy + 1][cx] === 'line') count++;
                if (state.vLines[cy][cx] === 'line') count++;
                if (state.vLines[cy][cx + 1] === 'line') count++;
                if (count !== num) {
                  allSatisfied = false;
                  break;
                }
              }
            }
            if (!allSatisfied) break;
          }
          if (!allSatisfied) return true; 
        }
      }
    }
  }

  return false;
}

/**
 * 基本的な推論ロジック（仮定法を含まない）
 */
function applyBasicDeductions(gameState: GameState): GameState {
  let currentState = gameState;
  let changed = true;

  while (changed) {
    changed = false;

    // 1. applyHint を呼び出す
    const nextState = applyHint(currentState);

    // 変更があったかどうかのチェック (文字列比較で簡易的に判定)
    if (
      JSON.stringify(currentState.hLines) !== JSON.stringify(nextState.hLines) ||
      JSON.stringify(currentState.vLines) !== JSON.stringify(nextState.vLines)
    ) {
      changed = true;
    }

    currentState = nextState;

    // 2. 点（ドット）のチェック
    const newHLines = currentState.hLines.map(row => [...row]);
    const newVLines = currentState.vLines.map(row => [...row]);
    const newColors = currentState.cellColors.map(row => [...row]);
    let dotChanged = false;

    for (let y = 0; y <= currentState.height; y++) {
      for (let x = 0; x <= currentState.width; x++) {
        const connectedEdges: { type: 'h' | 'v'; r: number; c: number; state: EdgeState }[] = [];

        // 上の辺
        if (y > 0) connectedEdges.push({ type: 'v', r: y - 1, c: x, state: newVLines[y - 1][x] });
        // 下の辺
        if (y < currentState.height) connectedEdges.push({ type: 'v', r: y, c: x, state: newVLines[y][x] });
        // 左の辺
        if (x > 0) connectedEdges.push({ type: 'h', r: y, c: x - 1, state: newHLines[y][x - 1] });
        // 右の辺
        if (x < currentState.width) connectedEdges.push({ type: 'h', r: y, c: x, state: newHLines[y][x] });

        const lineCount = connectedEdges.filter(e => e.state === 'line').length;
        const crossCount = connectedEdges.filter(e => e.state === 'cross').length;
        const totalEdges = connectedEdges.length;

        // 2方向に実線が伸びている場合、残る方向にはクロスを引く
        if (lineCount === 2) {
          for (const e of connectedEdges) {
            if (e.state === 'none') {
              if (e.type === 'h') newHLines[e.r][e.c] = 'cross';
              if (e.type === 'v') newVLines[e.r][e.c] = 'cross';
              dotChanged = true;
            }
          }
        }

        // ある点から見て、1方向に実線が引かれていて、残りの方向のうち1つを除いてクロス線が引かれている場合、残る1方向に実線を引く
        if (lineCount === 1 && crossCount === totalEdges - 2) {
          for (const e of connectedEdges) {
            if (e.state === 'none') {
              if (e.type === 'h') newHLines[e.r][e.c] = 'line';
              if (e.type === 'v') newVLines[e.r][e.c] = 'line';
              dotChanged = true;
            }
          }
        }

        // ある点から見て、すべての方向のうち1つを除いてクロス線が引かれている場合、残る1方向には実線を引けないためクロスを引く
        if (lineCount === 0 && crossCount === totalEdges - 1) {
          for (const e of connectedEdges) {
            if (e.state === 'none') {
              if (e.type === 'h') newHLines[e.r][e.c] = 'cross';
              if (e.type === 'v') newVLines[e.r][e.c] = 'cross';
              dotChanged = true;
            }
          }
        }
      }
    }

    // 3. '0' と '1' が斜めに配置されている場合のチェック
    for (let y = 1; y < currentState.height; y++) {
      for (let x = 1; x < currentState.width; x++) {
        const tl = currentState.puzzleData[y - 1][x - 1];
        const tr = currentState.puzzleData[y - 1][x];
        const bl = currentState.puzzleData[y][x - 1];
        const br = currentState.puzzleData[y][x];

        const is01 = (a: CellNumber, b: CellNumber) => (a === 0 && b === 1) || (a === 1 && b === 0);

        if (is01(tl, br) || is01(tr, bl)) {
          if (newHLines[y][x - 1] !== 'cross') { newHLines[y][x - 1] = 'cross'; dotChanged = true; }
          if (newHLines[y][x] !== 'cross') { newHLines[y][x] = 'cross'; dotChanged = true; }
          if (newVLines[y - 1][x] !== 'cross') { newVLines[y - 1][x] = 'cross'; dotChanged = true; }
          if (newVLines[y][x] !== 'cross') { newVLines[y][x] = 'cross'; dotChanged = true; }
        }
      }
    }

    // 4. '3' が斜めに配置されている場合のチェック
    for (let y = 1; y < currentState.height; y++) {
      for (let x = 1; x < currentState.width; x++) {
        const tl = currentState.puzzleData[y - 1][x - 1];
        const tr = currentState.puzzleData[y - 1][x];
        const bl = currentState.puzzleData[y][x - 1];
        const br = currentState.puzzleData[y][x];

        if (tl === 3 && br === 3) {
          if (newHLines[y - 1][x - 1] !== 'line') { newHLines[y - 1][x - 1] = 'line'; dotChanged = true; } // tl の上
          if (newVLines[y - 1][x - 1] !== 'line') { newVLines[y - 1][x - 1] = 'line'; dotChanged = true; } // tl の左
          if (newHLines[y + 1][x] !== 'line') { newHLines[y + 1][x] = 'line'; dotChanged = true; } // br の下
          if (newVLines[y][x + 1] !== 'line') { newVLines[y][x + 1] = 'line'; dotChanged = true; } // br の右
        }

        if (tr === 3 && bl === 3) {
          if (newHLines[y - 1][x] !== 'line') { newHLines[y - 1][x] = 'line'; dotChanged = true; } // tr の上
          if (newVLines[y - 1][x + 1] !== 'line') { newVLines[y - 1][x + 1] = 'line'; dotChanged = true; } // tr の右
          if (newHLines[y + 1][x - 1] !== 'line') { newHLines[y + 1][x - 1] = 'line'; dotChanged = true; } // bl の下
          if (newVLines[y][x - 1] !== 'line') { newVLines[y][x - 1] = 'line'; dotChanged = true; } // bl の左
        }
      }
    }

    // 5. '3' のセルに関するルール（隣接・線の伸び）
    for (let y = 0; y < currentState.height; y++) {
      for (let x = 0; x < currentState.width; x++) {
        if (currentState.puzzleData[y][x] === 3) {
          // 隣接する '3' がある場合のルール
          // 横に隣接
          if (x < currentState.width - 1 && currentState.puzzleData[y][x + 1] === 3) {
            if (newVLines[y][x] !== 'line') { newVLines[y][x] = 'line'; dotChanged = true; } // 左辺
            if (newVLines[y][x + 1] !== 'line') { newVLines[y][x + 1] = 'line'; dotChanged = true; } // 共有する中辺
            if (newVLines[y][x + 2] !== 'line') { newVLines[y][x + 2] = 'line'; dotChanged = true; } // 右辺
          }
          // 縦に隣接
          if (y < currentState.height - 1 && currentState.puzzleData[y + 1][x] === 3) {
            if (newHLines[y][x] !== 'line') { newHLines[y][x] = 'line'; dotChanged = true; } // 上辺
            if (newHLines[y + 1][x] !== 'line') { newHLines[y + 1][x] = 'line'; dotChanged = true; } // 共有する中辺
            if (newHLines[y + 2][x] !== 'line') { newHLines[y + 2][x] = 'line'; dotChanged = true; } // 下辺
          }

          // Top-Left (A)からの伸び
          const tlOut1 = y > 0 ? newVLines[y - 1][x] : 'none';
          const tlOut2 = x > 0 ? newHLines[y][x - 1] : 'none';
          if (tlOut1 === 'line' || tlOut2 === 'line') {
            if (newHLines[y + 1][x] !== 'line') { newHLines[y + 1][x] = 'line'; dotChanged = true; }
            if (newVLines[y][x + 1] !== 'line') { newVLines[y][x + 1] = 'line'; dotChanged = true; }
          }

          // Top-Right (B)
          const trOut1 = y > 0 ? newVLines[y - 1][x + 1] : 'none';
          const trOut2 = x < currentState.width - 1 ? newHLines[y][x + 1] : 'none';
          if (trOut1 === 'line' || trOut2 === 'line') {
            if (newHLines[y + 1][x] !== 'line') { newHLines[y + 1][x] = 'line'; dotChanged = true; }
            if (newVLines[y][x] !== 'line') { newVLines[y][x] = 'line'; dotChanged = true; }
          }

          // Bottom-Right (C)
          const brOut1 = y < currentState.height - 1 ? newVLines[y + 1][x + 1] : 'none';
          const brOut2 = x < currentState.width - 1 ? newHLines[y + 1][x + 1] : 'none';
          if (brOut1 === 'line' || brOut2 === 'line') {
            if (newHLines[y][x] !== 'line') { newHLines[y][x] = 'line'; dotChanged = true; }
            if (newVLines[y][x] !== 'line') { newVLines[y][x] = 'line'; dotChanged = true; }
          }

          // Bottom-Left (D)
          const blOut1 = y < currentState.height - 1 ? newVLines[y + 1][x] : 'none';
          const blOut2 = x > 0 ? newHLines[y + 1][x - 1] : 'none';
          if (blOut1 === 'line' || blOut2 === 'line') {
            if (newHLines[y][x] !== 'line') { newHLines[y][x] = 'line'; dotChanged = true; }
            if (newVLines[y][x + 1] !== 'line') { newVLines[y][x + 1] = 'line'; dotChanged = true; }
          }
        }
      }
    }

    // 6. 小さなループ（全体を解決しないループ）の完成を防ぐルール
    const adj = new Map<string, string[]>();
    for (let y = 0; y <= currentState.height; y++) {
      for (let x = 0; x <= currentState.width; x++) {
        adj.set(`${x},${y}`, []);
      }
    }
    for (let y = 0; y <= currentState.height; y++) {
      for (let x = 0; x < currentState.width; x++) {
        if (newHLines[y][x] === 'line') {
          adj.get(`${x},${y}`)!.push(`${x + 1},${y}`);
          adj.get(`${x + 1},${y}`)!.push(`${x},${y}`);
        }
      }
    }
    for (let y = 0; y < currentState.height; y++) {
      for (let x = 0; x <= currentState.width; x++) {
        if (newVLines[y][x] === 'line') {
          adj.get(`${x},${y}`)!.push(`${x},${y + 1}`);
          adj.get(`${x},${y + 1}`)!.push(`${x},${y}`);
        }
      }
    }

    const isConnected = (u: string, v: string) => {
      const visited = new Set<string>();
      const queue = [u];
      visited.add(u);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr === v) return true;
        for (const neighbor of adj.get(curr)!) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      return false;
    };

    const checkPuzzleSolvedWithTempLines = () => {
      for (let cy = 0; cy < currentState.height; cy++) {
        for (let cx = 0; cx < currentState.width; cx++) {
          const num = currentState.puzzleData[cy][cx];
          if (num !== null) {
            let count = 0;
            if (newHLines[cy][cx] === 'line') count++;
            if (newHLines[cy + 1][cx] === 'line') count++;
            if (newVLines[cy][cx] === 'line') count++;
            if (newVLines[cy][cx + 1] === 'line') count++;
            if (count !== num) return false;
          }
        }
      }
      let hasEdges = false;
      let startNode: string | null = null;
      const localAdj = new Map<string, string[]>();
      for (let cy = 0; cy <= currentState.height; cy++) {
        for (let cx = 0; cx <= currentState.width; cx++) {
          let degree = 0;
          const neighbors: string[] = [];
          const nodeId = `${cx},${cy}`;
          if (cy > 0 && newVLines[cy - 1][cx] === 'line') { degree++; neighbors.push(`${cx},${cy - 1}`); }
          if (cy < currentState.height && newVLines[cy][cx] === 'line') { degree++; neighbors.push(`${cx},${cy + 1}`); }
          if (cx > 0 && newHLines[cy][cx - 1] === 'line') { degree++; neighbors.push(`${cx - 1},${cy}`); }
          if (cx < currentState.width && newHLines[cy][cx] === 'line') { degree++; neighbors.push(`${cx + 1},${cy}`); }
          if (degree > 0) {
            if (degree !== 2) return false;
            hasEdges = true;
            startNode = nodeId;
            localAdj.set(nodeId, neighbors);
          }
        }
      }
      if (!hasEdges || !startNode) return false;
      const visited = new Set<string>();
      const queue = [startNode];
      visited.add(startNode);
      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const neighbor of localAdj.get(curr) || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      return visited.size === localAdj.size;
    };

    for (let y = 0; y <= currentState.height; y++) {
      for (let x = 0; x < currentState.width; x++) {
        if (newHLines[y][x] === 'none') {
          if (isConnected(`${x},${y}`, `${x + 1},${y}`)) {
            newHLines[y][x] = 'line';
            const solved = checkPuzzleSolvedWithTempLines();
            newHLines[y][x] = 'none';
            if (!solved) {
              newHLines[y][x] = 'cross';
              dotChanged = true;
            } else {
              newHLines[y][x] = 'line';
              dotChanged = true;
            }
          }
        }
      }
    }
    for (let y = 0; y < currentState.height; y++) {
      for (let x = 0; x <= currentState.width; x++) {
        if (newVLines[y][x] === 'none') {
          if (isConnected(`${x},${y}`, `${x},${y + 1}`)) {
            newVLines[y][x] = 'line';
            const solved = checkPuzzleSolvedWithTempLines();
            newVLines[y][x] = 'none';
            if (!solved) {
              newVLines[y][x] = 'cross';
              dotChanged = true;
            } else {
              newVLines[y][x] = 'line';
              dotChanged = true;
            }
          }
        }
      }
    }

    // 7. In/Out (色塗り) ロジック
    const getCellColor = (cx: number, cy: number) => {
      if (cx < 0 || cx >= currentState.width || cy < 0 || cy >= currentState.height) return 1 as CellColor; // 盤面外はPink (1)
      return newColors[cy][cx];
    };

    const setCellColor = (cx: number, cy: number, color: CellColor) => {
      if (cx >= 0 && cx < currentState.width && cy >= 0 && cy < currentState.height) {
        if (newColors[cy][cx] === 0) {
          newColors[cy][cx] = color;
          dotChanged = true;
        }
      }
    };

    const oppositeColor = (c: CellColor): CellColor => c === 1 ? 2 : (c === 2 ? 1 : 0);

    for (let y = 0; y <= currentState.height; y++) {
      for (let x = 0; x < currentState.width; x++) {
        const edge = newHLines[y][x];
        const colorUp = getCellColor(x, y - 1);
        const colorDown = getCellColor(x, y);

        if (edge === 'line') {
          if (colorUp !== 0) setCellColor(x, y, oppositeColor(colorUp));
          if (colorDown !== 0) setCellColor(x, y - 1, oppositeColor(colorDown));
        } else if (edge === 'cross') {
          if (colorUp !== 0) setCellColor(x, y, colorUp);
          if (colorDown !== 0) setCellColor(x, y - 1, colorDown);
        }

        if (colorUp !== 0 && colorDown !== 0 && edge === 'none') {
          if (colorUp === colorDown) {
            newHLines[y][x] = 'cross';
            dotChanged = true;
          } else {
            newHLines[y][x] = 'line';
            dotChanged = true;
          }
        }
      }
    }

    for (let y = 0; y < currentState.height; y++) {
      for (let x = 0; x <= currentState.width; x++) {
        const edge = newVLines[y][x];
        const colorLeft = getCellColor(x - 1, y);
        const colorRight = getCellColor(x, y);

        if (edge === 'line') {
          if (colorLeft !== 0) setCellColor(x, y, oppositeColor(colorLeft));
          if (colorRight !== 0) setCellColor(x - 1, y, oppositeColor(colorRight));
        } else if (edge === 'cross') {
          if (colorLeft !== 0) setCellColor(x, y, colorLeft);
          if (colorRight !== 0) setCellColor(x - 1, y, colorRight);
        }

        if (colorLeft !== 0 && colorRight !== 0 && edge === 'none') {
          if (colorLeft === colorRight) {
            newVLines[y][x] = 'cross';
            dotChanged = true;
          } else {
            newVLines[y][x] = 'line';
            dotChanged = true;
          }
        }
      }
    }

    if (dotChanged) {
      currentState = {
        ...currentState,
        hLines: newHLines,
        vLines: newVLines,
        cellColors: newColors
      };
      changed = true;
    }
  }

  return currentState;
}

/**
 * 強力なヒント機能：確定できる実線やバツを推論して新しいGameStateを返す。
 * 仮定法（背理法）を用いて、ある辺に実線を引いたときに矛盾が生じるならバツを引く。
 */
export function applySuperHint(gameState: GameState): GameState {
  let currentState = gameState;
  let changed = true;

  while (changed) {
    changed = false;

    // 基本的な推論を限界まで適用
    const nextState = applyBasicDeductions(currentState);
    if (
      JSON.stringify(currentState.hLines) !== JSON.stringify(nextState.hLines) ||
      JSON.stringify(currentState.vLines) !== JSON.stringify(nextState.vLines)
    ) {
      currentState = nextState;
      changed = true;
    }

    // 基本推論で進展がなかった場合、背理法を適用する
    if (!changed) {
      const newHLines = currentState.hLines.map(row => [...row]);
      const newVLines = currentState.vLines.map(row => [...row]);
      let hypoChanged = false;

      for (let y = 0; y <= currentState.height; y++) {
        for (let x = 0; x < currentState.width; x++) {
          if (newHLines[y][x] === 'none') {
            const testState = {
              ...currentState,
              hLines: newHLines.map(row => [...row]),
              vLines: newVLines.map(row => [...row])
            };
            testState.hLines[y][x] = 'line';
            const resultState = applyBasicDeductions(testState);
            if (hasContradiction(resultState)) {
              newHLines[y][x] = 'cross';
              hypoChanged = true;
            }
          }
        }
      }

      for (let y = 0; y < currentState.height; y++) {
        for (let x = 0; x <= currentState.width; x++) {
          if (newVLines[y][x] === 'none') {
            const testState = {
              ...currentState,
              hLines: newHLines.map(row => [...row]),
              vLines: newVLines.map(row => [...row])
            };
            testState.vLines[y][x] = 'line';
            const resultState = applyBasicDeductions(testState);
            if (hasContradiction(resultState)) {
              newVLines[y][x] = 'cross';
              hypoChanged = true;
            }
          }
        }
      }

      if (hypoChanged) {
        currentState = {
          ...currentState,
          hLines: newHLines,
          vLines: newVLines
        };
        changed = true;
      }
    }
  }

  return currentState;
}

/**
 * ヒント機能：確定できる実線やバツを推論して新しいGameStateを返す
 */
export function applyHint(gameState: GameState): GameState {
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

  return {
    ...gameState,
    hLines: newHLines,
    vLines: newVLines
  };
}

/**
 * 現在の状態が正解であるかどうかを判定する
 */
export function isPuzzleSolved(gameState: GameState): boolean {
  // 1. すべての数字が条件を満たしているかチェック
  for (let y = 0; y < gameState.height; y++) {
    for (let x = 0; x < gameState.width; x++) {
      const num = gameState.puzzleData[y][x];
      if (num !== null) {
        if (!isSatisfied(x, y, num, gameState.hLines, gameState.vLines)) return false;
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
        if (degree !== 2) return false; // 枝分かれまたは途切れがある
        hasEdges = true;
        startNode = nodeId;
        adj.set(nodeId, neighbors);
      }
    }
  }

  if (!hasEdges || !startNode) return false;

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
  return visited.size === adj.size;
}
