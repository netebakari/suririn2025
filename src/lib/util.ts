export const BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function decodeData(data: string): (number | null)[][] {
  if (data.length < 2) throw new Error("Invalid data length");

  let width = BASE64URL.indexOf(data[0]);
  let height = BASE64URL.indexOf(data[1]);
  if (width <= 0) width = 8;
  if (height <= 0) height = 8;

  const expectedDataLength = Math.ceil((width * height) / 2);
  if (data.length - 2 !== expectedDataLength) {
    throw new Error("Invalid data length");
  }

  const payload = data.substring(2);
  const cells: (number | null)[] = [];
  for (let i = 0; i < payload.length; i++) {
    const val = BASE64URL.indexOf(payload[i]);
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

export function encode(grid: string[]): string {
  if (grid.length === 0) return "";
  const height = grid.length;
  const width = grid[0].length;
  
  let result = BASE64URL[width] + BASE64URL[height];

  const cells: (number | null)[] = [];
  for (const row of grid) {
    for (const char of row) {
      if (char === '.' || char === ' ') {
        cells.push(null);
      } else {
        cells.push(parseInt(char, 10));
      }
    }
  }

  for (let i = 0; i < cells.length; i += 2) {
    const cell1 = cells[i];
    const cell2 = i + 1 < cells.length ? cells[i + 1] : null;
    
    const v1 = cell1 === null ? 0 : cell1 + 1;
    const v2 = cell2 === null ? 0 : cell2 + 1;
    
    const val = (v1 << 3) | v2;
    result += BASE64URL[val];
  }
  return result;
}
