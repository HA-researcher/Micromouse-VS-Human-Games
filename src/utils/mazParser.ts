import type { MazeState } from '../types/maze';

/**
 * Parses a text-based .maz file (or similar format).
 * Supports 16x16 (or variable size) space/comma-separated wall masks.
 * Each number is a bitmask of walls (North=1, East=2, South=4, West=8).
 */
export const importMaz = (text: string): MazeState => {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));

  if (lines.length === 0) {
    throw new Error('Empty maze data');
  }

  // Determine width by the first line
  const firstLineCells = lines[0].split(/[,\s]+/).filter(Boolean);
  const width = firstLineCells.length;
  const height = lines.length;

  if (width === 0) {
    throw new Error('Invalid maze width');
  }

  const walls = new Uint8Array(width * height);
  const discovered = new Uint8Array(width * height).fill(0); // initially undiscovered in play mode

  for (let y = 0; y < height; y++) {
    const cells = lines[y].split(/[,\s]+/).filter(Boolean);
    for (let x = 0; x < width; x++) {
      let mask = 0;
      if (x < cells.length) {
        // Parse hex or decimal
        mask = parseInt(cells[x], cells[x].startsWith('0x') ? 16 : 10);
        if (isNaN(mask)) mask = 0;
      }
      walls[y * width + x] = mask;
    }
  }

  return {
    width,
    height,
    walls,
    discovered,
    goalX: Math.floor(width / 2) - 1,
    goalY: Math.floor(height / 2) - 1,
    goalWidth: 2,
    goalHeight: 2,
  };
};

/**
 * Converts a MazeState into a space-separated text format.
 */
export const exportMaz = (maze: MazeState): string => {
  const { width, height, walls } = maze;
  const lines: string[] = [];
  
  lines.push(`# Micromouse Maze Data ${width}x${height}`);
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      row.push(walls[y * width + x].toString(10).padStart(2, ' '));
    }
    lines.push(row.join(' '));
  }
  
  return lines.join('\n');
};
