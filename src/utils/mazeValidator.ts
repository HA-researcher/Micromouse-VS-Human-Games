import { MazeState, Direction } from '../types/maze';

/**
 * Validates if the goal area is reachable from the start (0,0).
 * Uses Breadth-First Search (BFS).
 */
export const isGoalReachable = (maze: MazeState): boolean => {
  const { width, height, walls, goalX, goalY, goalWidth, goalHeight } = maze;
  const visited = new Uint8Array(width * height).fill(0);
  const queue: [number, number][] = [[0, 0]];
  visited[0] = 1;

  const isGoal = (x: number, y: number) => {
    return x >= goalX && x < goalX + goalWidth && y >= goalY && y < goalY + goalHeight;
  };

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;

    if (isGoal(cx, cy)) return true;

    const idx = cy * width + cx;
    const currentWalls = walls[idx];

    // Check North
    if (!(currentWalls & (1 << Direction.North)) && cy > 0) {
      if (!visited[(cy - 1) * width + cx]) {
        visited[(cy - 1) * width + cx] = 1;
        queue.push([cx, cy - 1]);
      }
    }
    // Check East
    if (!(currentWalls & (1 << Direction.East)) && cx < width - 1) {
      if (!visited[cy * width + (cx + 1)]) {
        visited[cy * width + (cx + 1)] = 1;
        queue.push([cx + 1, cy]);
      }
    }
    // Check South
    if (!(currentWalls & (1 << Direction.South)) && cy < height - 1) {
      if (!visited[(cy + 1) * width + cx]) {
        visited[(cy + 1) * width + cx] = 1;
        queue.push([cx, cy + 1]);
      }
    }
    // Check West
    if (!(currentWalls & (1 << Direction.West)) && cx > 0) {
      if (!visited[cy * width + (cx - 1)]) {
        visited[cy * width + (cx - 1)] = 1;
        queue.push([cx - 1, cy]);
      }
    }
  }

  return false;
};
