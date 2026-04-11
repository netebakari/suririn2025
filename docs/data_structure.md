# スリザーリンク 画面・状態データ構造

スリザーリンクのパズル画面で保持すべきデータ構造を明確に定義しました。
問題の定義から、ユーザーが解いている途中の状態まで、画面を描画するために必要なすべての情報が含まれています。

## TypeScript型定義

`src/types/game.ts` にて以下の型を定義しています。

```typescript
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
```

## 各情報の管理方法の解説

### 1. 盤面のサイズ (`width`, `height`)
パズルの横幅と縦幅を数値で保持します。任意のサイズの盤面に対応できるようにするため、個別に変数として持ちます。

### 2. 盤面のセルの状態 (`puzzleData`)
セルに表示される数字の情報を2次元配列で保持します。
値としては「数字が書かれていない（`null`）」「0」「1」「2」「3」の5通りの状態があります。

### 3. 実線およびバツの場所 (`hLines`, `vLines`)
線はセルの「辺」にあたるため、横方向の辺（`hLines`）と縦方向の辺（`vLines`）の2つに分けて配列で管理します。
- **`hLines` (水平の線):** サイズは `(height + 1) × width`。
- **`vLines` (垂直の線):** サイズは `height × (width + 1)`。
- 値は `EdgeState` 型であり、「`none`（未設定）」「`line`（実線）」「`cross`（バツ）」の3種類の状態を取ります。

### 4. セルの色情報 (`cellColors`)
ユーザーがセルをハイライトするために使用する色情報を管理します。
サイズは盤面と同じ `height × width` の2次元配列です。
- `0`: 無色（初期状態・透明）
- `1`: ピンク色
- `2`: 水色
