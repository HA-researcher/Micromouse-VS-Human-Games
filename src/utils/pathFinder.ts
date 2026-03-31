import type { MazeState } from '../types/maze';
import { Direction } from '../types/maze';
import type { MachineParameters } from '../types/simulator';

/**
 * Calculates the theoretical optimal cost to reach the goal from (0,0).
 * Uses Dijkstra's algorithm.
 */
export const calculateOptimalCost = (maze: MazeState, params: MachineParameters): number => {
  const { width, height, walls, goalX, goalY, goalWidth, goalHeight } = maze;
  
  // State: x, y, direction
  // Distances array: [y * width + x][direction]
  const dist = new Float32Array(width * height * 4).fill(Infinity);
  
  // Priority Queue: [cost, x, y, direction]
  // Since the maze is small, we can use a simple array and sort it, 
  // or just a basic BFS if costs were uniform. Here we use a sorted array as a simple PQ.
  const pq: [number, number, number, Direction][] = [];

  // Initial states: at (0,0), can be facing any direction initially without cost?
  // Usually, Micromouse starts facing North.
  const startX = 0;
  const startY = 0;
  const startDir = Direction.North;
  
  dist[(startY * width + startX) * 4 + startDir] = 0;
  pq.push([0, startX, startY, startDir]);

  const isGoal = (x: number, y: number) => {
    return x >= goalX && x < goalX + goalWidth && y >= goalY && y < goalY + goalHeight;
  };

  while (pq.length > 0) {
    // Sort by cost (descending) and pop the smallest
    pq.sort((a, b) => b[0] - a[0]);
    const [d, cx, cy, cd] = pq.pop()!;

    if (d > dist[(cy * width + cx) * 4 + cd]) continue;
    if (isGoal(cx, cy)) return d;

    // Option 1: Move Forward
    const currentWalls = walls[cy * width + cx];
    if (!(currentWalls & (1 << cd))) {
      let nx = cx, ny = cy;
      if (cd === Direction.North) ny -= 1;
      else if (cd === Direction.East) nx += 1;
      else if (cd === Direction.South) ny += 1;
      else if (cd === Direction.West) nx -= 1;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nextDist = d + params.straightCost;
        if (nextDist < dist[(ny * width + nx) * 4 + cd]) {
          dist[(ny * width + nx) * 4 + cd] = nextDist;
          pq.push([nextDist, nx, ny, cd]);
        }
      }
    }

    // Option 2: Turn Left
    const leftDir = (cd + 3) % 4;
    const nextDistL = d + params.turnCost;
    if (nextDistL < dist[(cy * width + cx) * 4 + leftDir]) {
      dist[(cy * width + cx) * 4 + leftDir] = nextDistL;
      pq.push([nextDistL, cx, cy, leftDir as Direction]);
    }

    // Option 3: Turn Right
    const rightDir = (cd + 1) % 4;
    const nextDistR = d + params.turnCost;
    if (nextDistR < dist[(cy * width + cx) * 4 + rightDir]) {
      dist[(cy * width + cx) * 4 + rightDir] = nextDistR;
      pq.push([nextDistR, cx, cy, rightDir as Direction]);
    }
  }

  return Infinity;
};
