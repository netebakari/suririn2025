export const BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function decodeData(data: string, width: number, height: number): (number | null)[][] {
  const cells: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    const val = BASE64URL.indexOf(data[i]);
    if (val === -1) continue;
    const c1 = val >> 3;
    const c2 = val & 7;
    cells.push(c1 === 0 ? null : c1 - 1);
    cells.push(c2 === 0 ? null : c2 - 1);
  }
  
  const grid: (number | null)[][] = [];
  for (let y = 0; y < height; y++) {
    const row = cells.slice(y * width, (y + 1) * width);
    // Pad row if not enough cells
    while (row.length < width) row.push(null);
    grid.push(row);
  }
  return grid;
}
