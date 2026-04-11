// セルに書かれている数字（null は数字が書かれていないことを示す）
export type CellNumber = null | 0 | 1 | 2 | 3;

// 辺（線）の状態
export type EdgeState = 'none' | 'line' | 'cross';

// セルの背景色（0: 無色, 1: ピンク, 2: 水色）
export type CellColor = 0 | 1 | 2;

export interface GameState {
  /**
   * 盤面のサイズ（横）
   */
  width: number;

  /**
   * 盤面のサイズ（縦）
   */
  height: number;

  /**
   * 盤面の各セルに設定された数字データ
   * 2次元配列: [y（行）][x（列）]
   * サイズ: height × width
   */
  puzzleData: CellNumber[][];

  /**
   * 水平方向の辺の状態（実線・バツ・なし）
   * セルの上下の辺を表すため、行数はセルの行数より1多い
   * サイズ: (height + 1) × width
   */
  hLines: EdgeState[][];

  /**
   * 垂直方向の辺の状態（実線・バツ・なし）
   * セルの左右の辺を表すため、列数はセルの列数より1多い
   * サイズ: height × (width + 1)
   */
  vLines: EdgeState[][];

  /**
   * 各セルの背景色情報
   * サイズ: height × width
   */
  cellColors: CellColor[][];
}
