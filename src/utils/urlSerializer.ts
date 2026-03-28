import * as LZString from 'lz-string';
import { Direction } from '../types/maze';
import type { MoveLog } from '../types/simulator';

/**
 * Serializes a movement log into a compressed string for URL sharing.
 * Format: seed,width,height,RLE_log
 * RLE_log example: N3E2S1 (North 3 times, East 2 times, South 1 time)
 */
export const serializeRun = (seed: number, width: number, height: number, log: MoveLog[]): string => {
  if (log.length === 0) return '';

  const directions = log.map(entry => {
    switch (entry.direction) {
      case Direction.North: return 'N';
      case Direction.East: return 'E';
      case Direction.South: return 'S';
      case Direction.West: return 'W';
      default: return '';
    }
  }).join('');

  // Simple RLE
  let rle = '';
  if (directions.length > 0) {
    let char = directions[0];
    let count = 1;
    for (let i = 1; i <= directions.length; i++) {
      if (directions[i] === char) {
        count++;
      } else {
        rle += char + (count > 1 ? count : '');
        char = directions[i];
        count = 1;
      }
    }
  }

  const raw = `${seed},${width},${height},${rle}`;
  return LZString.compressToEncodedURIComponent(raw);
};

export interface DecodedRun {
  seed: number;
  width: number;
  height: number;
  path: Direction[];
}

/**
 * Deserializes a run from a compressed string.
 */
export const deserializeRun = (data: string): DecodedRun | null => {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(data);
    if (!decompressed) return null;

    const [seedStr, widthStr, heightStr, rle] = decompressed.split(',');
    const seed = parseInt(seedStr);
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);
    
    // Decompress RLE
    const path: Direction[] = [];
    const matches = rle.matchAll(/([NESW])(\d*)/g);
    for (const match of matches) {
      const char = match[1];
      const count = match[2] ? parseInt(match[2]) : 1;
      const dir = char === 'N' ? Direction.North :
                  char === 'E' ? Direction.East :
                  char === 'S' ? Direction.South :
                  Direction.West;
      
      for (let i = 0; i < count; i++) {
        path.push(dir);
      }
    }

    return { seed, width, height, path };
  } catch (e) {
    console.error('Failed to deserialize run:', e);
    return null;
  }
};
