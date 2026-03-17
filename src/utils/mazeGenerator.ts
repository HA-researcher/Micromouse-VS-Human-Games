import { Direction } from '../types/maze';
import type { MazeState } from '../types/maze';

/**
 * Simple Seeded Random Number Generator (LCG)
 */
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed % 2147483647;
    if (this.state <= 0) this.state += 2147483646;
  }
  next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/**
 * Generates a maze using the Recursive Backtracker algorithm.
 * @param width Height of the maze.
 * @param height Width of the maze.
 * @param seed Seed for randomization.
 */
export const generateMaze = (width: number, height: number, seed: number): MazeState => {
  const rng = new SeededRandom(seed);
  const walls = new Uint8Array(width * height).fill(0);
  const discovered = new Uint8Array(width * height).fill(0);
  const visited = new Uint8Array(width * height).fill(0);

  // Bitmasks for walls: bit 0: North, 1: East, 2: South, 3: West
  // Wall state: 1 means wall exists, 0 means path.
  // Initially all cells are surrounded by walls.
  for (let i = 0; i < walls.length; i++) {
    walls[i] = 0b1111;
  }

  const stack: [number, number][] = [];
  const startX = 0;
  const startY = 0;
  stack.push([startX, startY]);
  visited[startY * width + startX] = 1;

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors: [number, number, Direction][] = [];

    // Check neighbors
    if (cy > 0 && !visited[(cy - 1) * width + cx]) neighbors.push([cx, cy - 1, Direction.North]);
    if (cx < width - 1 && !visited[cy * width + (cx + 1)]) neighbors.push([cx + 1, cy, Direction.East]);
    if (cy < height - 1 && !visited[(cy + 1) * width + cx]) neighbors.push([cx, cy + 1, Direction.South]);
    if (cx > 0 && !visited[cy * width + (cx - 1)]) neighbors.push([cx - 1, cy, Direction.West]);

    if (neighbors.length > 0) {
      const [nx, ny, dir] = neighbors[rng.nextInt(0, neighbors.length - 1)];
      
      // Remove wall between current and neighbor
      const currentIdx = cy * width + cx;
      const nextIdx = ny * width + nx;
      
      if (dir === Direction.North) {
        walls[currentIdx] &= ~(1 << Direction.North);
        walls[nextIdx] &= ~(1 << Direction.South);
      } else if (dir === Direction.East) {
        walls[currentIdx] &= ~(1 << Direction.East);
        walls[nextIdx] &= ~(1 << Direction.West);
      } else if (dir === Direction.South) {
        walls[currentIdx] &= ~(1 << Direction.South);
        walls[nextIdx] &= ~(1 << Direction.North);
      } else if (dir === Direction.West) {
        walls[currentIdx] &= ~(1 << Direction.West);
        walls[nextIdx] &= ~(1 << Direction.East);
      }

      visited[nextIdx] = 1;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }

  // Official Goal Spec: 2x2 area
  // For a 16x16 maze, goal is usually around (7,7), (7,8), (8,7), (8,8)
  const goalWidth = 2;
  const goalHeight = 2;
  const goalX = Math.floor(width / 2) - 1;
  const goalY = Math.floor(height / 2) - 1;

  // Clear inner walls of the 2x2 goal area
  // (Specific goal logic might vary by competition, but typical is 2x2)
  const g1 = goalY * width + goalX;
  const g2 = goalY * width + (goalX + 1);
  const g3 = (goalY + 1) * width + goalX;
  const g4 = (goalY + 1) * width + (goalX + 1);

  // Remove internal walls in goal 2x2
  walls[g1] &= ~(1 << Direction.East);
  walls[g1] &= ~(1 << Direction.South);
  walls[g2] &= ~(1 << Direction.West);
  walls[g2] &= ~(1 << Direction.South);
  walls[g3] &= ~(1 << Direction.North);
  walls[g3] &= ~(1 << Direction.East);
  walls[g4] &= ~(1 << Direction.North);
  walls[g4] &= ~(1 << Direction.West);

  return {
    width,
    height,
    walls,
    discovered,
    goalX,
    goalY,
    goalWidth,
    goalHeight,
  };
};
