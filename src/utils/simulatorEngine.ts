import { Direction } from '../types/maze';
import type { MazeState } from '../types/maze';
import type { MouseState, MachineParameters } from '../types/simulator';

export type AlgorithmType = 'LeftHand' | 'RightHand' | 'FloodFill' | 'Centripetal';

/**
 * Mechanics for mouse movement and interaction within the maze.
 */
export const SimulatorEngine = {
  /**
   * Checks if the mouse can move in its current direction.
   */
  canMoveForward: (mouse: MouseState, maze: MazeState): boolean => {
    const { x, y, direction } = mouse;
    const { width, height, walls } = maze;
    
    const idx = y * width + x;
    const currentWalls = walls[idx];

    // Check if there is a wall in the current direction
    if (currentWalls & (1 << direction)) {
      return false;
    }

    // Boundary checks (redundant if maze is properly enclosed, but safe)
    if (direction === Direction.North && y <= 0) return false;
    if (direction === Direction.East && x >= width - 1) return false;
    if (direction === Direction.South && y >= height - 1) return false;
    if (direction === Direction.West && x <= 0) return false;

    return true;
  },

  /**
   * Returns a new mouse state after moving forward.
   */
  moveForward: (mouse: MouseState, maze: MazeState, params?: MachineParameters): MouseState => {
    if (!SimulatorEngine.canMoveForward(mouse, maze)) {
      return mouse;
    }

    let { x, y } = mouse;
    if (mouse.direction === Direction.North) y -= 1;
    else if (mouse.direction === Direction.East) x += 1;
    else if (mouse.direction === Direction.South) y += 1;
    else if (mouse.direction === Direction.West) x -= 1;

    const costDelta = params ? params.straightCost : 1;
    const newMouse = { 
      ...mouse, 
      x, 
      y, 
      totalCost: mouse.totalCost + costDelta,
      stepCount: mouse.stepCount + 1
    };
    newMouse.history = [
      ...mouse.history,
      { x, y, direction: mouse.direction, timestamp: Date.now() }
    ];
    return newMouse;
  },

  /**
   * Returns a new mouse state after turning left.
   */
  turnLeft: (mouse: MouseState, params?: MachineParameters): MouseState => {
    const nextDir = (mouse.direction + 3) % 4; // (dir - 1 + 4) % 4
    const costDelta = params ? params.turnCost : 3;
    return { 
      ...mouse, 
      direction: nextDir as Direction,
      totalCost: mouse.totalCost + costDelta,
      turnCount: mouse.turnCount + 1,
      history: [
        ...mouse.history,
        { x: mouse.x, y: mouse.y, direction: nextDir as Direction, timestamp: Date.now() }
      ]
    };
  },

  /**
   * Returns a new mouse state after turning right.
   */
  turnRight: (mouse: MouseState, params?: MachineParameters): MouseState => {
    const nextDir = (mouse.direction + 1) % 4;
    const costDelta = params ? params.turnCost : 3;
    return { 
      ...mouse, 
      direction: nextDir as Direction,
      totalCost: mouse.totalCost + costDelta,
      turnCount: mouse.turnCount + 1,
      history: [
        ...mouse.history,
        { x: mouse.x, y: mouse.y, direction: nextDir as Direction, timestamp: Date.now() }
      ]
    };
  },
  
  /**
   * Performs one step of a simple Left-hand rule algorithm.
   */
  stepLeftHand: (mouse: MouseState, maze: MazeState, params?: MachineParameters): MouseState => {
    // 1. Try to turn left
    const mouseLeft = SimulatorEngine.turnLeft(mouse, params);
    if (SimulatorEngine.canMoveForward(mouseLeft, maze)) {
      return SimulatorEngine.moveForward(mouseLeft, maze, params);
    }
    
    // 2. Try to move forward
    if (SimulatorEngine.canMoveForward(mouse, maze)) {
      return SimulatorEngine.moveForward(mouse, maze, params);
    }
    
    // 3. Try to turn right
    const mouseRight = SimulatorEngine.turnRight(mouse, params);
    if (SimulatorEngine.canMoveForward(mouseRight, maze)) {
      return SimulatorEngine.moveForward(mouseRight, maze, params);
    }
    
    // 4. U-turn (turn right twice)
    return SimulatorEngine.turnRight(SimulatorEngine.turnRight(mouseRight, params), params);
  },

  /**
   * Performs one step of a simple Right-hand rule algorithm.
   */
  stepRightHand: (mouse: MouseState, maze: MazeState, params?: MachineParameters): MouseState => {
    // 1. Try to turn right
    const mouseRight = SimulatorEngine.turnRight(mouse, params);
    if (SimulatorEngine.canMoveForward(mouseRight, maze)) {
      return SimulatorEngine.moveForward(mouseRight, maze, params);
    }
    
    // 2. Try to move forward
    if (SimulatorEngine.canMoveForward(mouse, maze)) {
      return SimulatorEngine.moveForward(mouse, maze, params);
    }
    
    // 3. Try to turn left
    const mouseLeft = SimulatorEngine.turnLeft(mouse, params);
    if (SimulatorEngine.canMoveForward(mouseLeft, maze)) {
      return SimulatorEngine.moveForward(mouseLeft, maze, params);
    }
    
    // 4. U-turn (turn right twice)
    return SimulatorEngine.turnRight(mouseRight, params);
  },

  /**
   * Flood Fill (Adachi Method)
   * Calculates a distance map from the goal to all cells using only DISCOVERED walls.
   */
  calculateDistanceMap: (maze: MazeState, useDiscovered: boolean = true): Int16Array => {
    const { width, height, walls, discovered, goalX, goalY, goalWidth, goalHeight } = maze;
    const map = new Int16Array(width * height).fill(-1);
    const queue: [number, number, number][] = [];

    // Initialize goals
    for (let dy = 0; dy < goalHeight; dy++) {
      for (let dx = 0; dx < goalWidth; dx++) {
        const gx = goalX + dx;
        const gy = goalY + dy;
        const idx = gy * width + gx;
        map[idx] = 0;
        queue.push([gx, gy, 0]);
      }
    }

    let head = 0;
    while (head < queue.length) {
      const [x, y, dist] = queue[head++];
      const currentIdx = y * width + x;
      const wallMask = useDiscovered ? discovered[currentIdx] : walls[currentIdx];

      const neighbors = [
        { dx: 0, dy: -1, dir: Direction.North },
        { dx: 1, dy: 0, dir: Direction.East },
        { dx: 0, dy: 1, dir: Direction.South },
        { dx: -1, dy: 0, dir: Direction.West },
      ];

      for (const n of neighbors) {
        // If there's a wall in this direction, skip
        if (wallMask & (1 << n.dir)) continue;

        const nx = x + n.dx;
        const ny = y + n.dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const nIdx = ny * width + nx;
        if (map[nIdx] === -1) {
          map[nIdx] = dist + 1;
          queue.push([nx, ny, dist + 1]);
        }
      }
    }
    return map;
  },

  stepFloodFill: (mouse: MouseState, maze: MazeState, params?: MachineParameters): MouseState => {
    const distMap = SimulatorEngine.calculateDistanceMap(maze, true);
    const { x, y, width, discovered } = maze; // Wait, maze doesn't have x,y. Mouse does.
    const currentWalls = maze.discovered[mouse.y * maze.width + mouse.x];

    const moves = [
      { dir: Direction.North, dx: 0, dy: -1 },
      { dir: Direction.East, dx: 1, dy: 0 },
      { dir: Direction.South, dx: 0, dy: 1 },
      { dir: Direction.West, dx: -1, dy: 0 },
    ];

    let bestDir = mouse.direction;
    let minDist = 30000;

    // Prioritize direct forward/no turn if distances are equal
    const sortedMoves = [...moves].sort((a, b) => {
      if (a.dir === mouse.direction) return -1;
      if (b.dir === mouse.direction) return 1;
      return 0;
    });

    for (const m of sortedMoves) {
      if (currentWalls & (1 << m.dir)) continue;
      const nx = mouse.x + m.dx;
      const ny = mouse.y + m.dy;
      if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) continue;

      const d = distMap[ny * maze.width + nx];
      if (d !== -1 && d < minDist) {
        minDist = d;
        bestDir = m.dir;
      }
    }

    let nextMouse = mouse;
    while (nextMouse.direction !== bestDir) {
      const diff = (bestDir - nextMouse.direction + 4) % 4;
      if (diff === 3) nextMouse = SimulatorEngine.turnLeft(nextMouse, params);
      else nextMouse = SimulatorEngine.turnRight(nextMouse, params);
    }
    return SimulatorEngine.moveForward(nextMouse, maze, params);
  },

  stepCentripetal: (mouse: MouseState, maze: MazeState, params?: MachineParameters): MouseState => {
    const { goalX, goalY, goalWidth, goalHeight } = maze;
    const gx = goalX + goalWidth / 2 - 0.5;
    const gy = goalY + goalHeight / 2 - 0.5;

    const moves = [
      { dir: Direction.North, dx: 0, dy: -1 },
      { dir: Direction.East, dx: 1, dy: 0 },
      { dir: Direction.South, dx: 0, dy: 1 },
      { dir: Direction.West, dx: -1, dy: 0 },
    ];

    const currentWalls = maze.discovered[mouse.y * maze.width + mouse.x];
    let bestDir = mouse.direction;
    let minManhattan = 30000;

    const sortedMoves = [...moves].sort((a, b) => {
      if (a.dir === mouse.direction) return -1;
      if (b.dir === mouse.direction) return 1;
      return 0;
    });

    for (const m of sortedMoves) {
      if (currentWalls & (1 << m.dir)) continue;
      const nx = mouse.x + m.dx;
      const ny = mouse.y + m.dy;
      if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height) continue;

      const d = Math.abs(nx - gx) + Math.abs(ny - gy);
      if (d < minManhattan) {
        minManhattan = d;
        bestDir = m.dir;
      }
    }

    let nextMouse = mouse;
    while (nextMouse.direction !== bestDir) {
      const diff = (bestDir - nextMouse.direction + 4) % 4;
      if (diff === 3) nextMouse = SimulatorEngine.turnLeft(nextMouse, params);
      else nextMouse = SimulatorEngine.turnRight(nextMouse, params);
    }
    return SimulatorEngine.moveForward(nextMouse, maze, params);
  },
  
  /**
   * Initializes the mouse at the start position.
   */
  getInitialState: (): MouseState => ({
    x: 0,
    y: 0,
    direction: Direction.North,
    history: [{ x: 0, y: 0, direction: Direction.North, timestamp: Date.now() }],
    totalCost: 0,
    stepCount: 0,
    turnCount: 0
  })
};
