/**
 * スリザーリンクの問題を生成する関数
 * 現在は仮実装として、指定されたサイズの盤面を乱数（nullまたは0〜3）で埋めて返します。
 * 
 * @param width 盤面の幅
 * @param height 盤面の高さ
 * @returns 生成された問題の2次元配列
 */
export function generateProblem(width: number, height: number): (number | null)[][] {
  const grid: (number | null)[][] = [];
  
  for (let y = 0; y < height; y++) {
    const row: (number | null)[] = [];
    for (let x = 0; x < width; x++) {
      // 0〜4の乱数を生成。0の場合はnull（空白）、1〜4の場合は0〜3として扱う
      const rand = Math.floor(Math.random() * 5);
      row.push(rand === 0 ? null : rand - 1);
    }
    grid.push(row);
  }
  
  return grid;
}
