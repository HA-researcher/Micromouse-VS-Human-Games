import { Direction } from '../types/maze';
import type { MazeState } from '../types/maze';
import type { MouseState } from '../types/simulator';

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
  moveForward: (mouse: MouseState, maze: MazeState): MouseState => {
    if (!SimulatorEngine.canMoveForward(mouse, maze)) {
      return mouse;
    }

    let { x, y } = mouse;
    if (mouse.direction === Direction.North) y -= 1;
    else if (mouse.direction === Direction.East) x += 1;
    else if (mouse.direction === Direction.South) y += 1;
    else if (mouse.direction === Direction.West) x -= 1;

    const newMouse = { ...mouse, x, y };
    newMouse.history = [
      ...mouse.history,
      { x, y, direction: mouse.direction, timestamp: Date.now() }
    ];
    return newMouse;
  },

  /**
   * Returns a new mouse state after turning left.
   */
  turnLeft: (mouse: MouseState): MouseState => {
    const nextDir = (mouse.direction + 3) % 4; // (dir - 1 + 4) % 4
    return { 
      ...mouse, 
      direction: nextDir as Direction,
      history: [
        ...mouse.history,
        { x: mouse.x, y: mouse.y, direction: nextDir as Direction, timestamp: Date.now() }
      ]
    };
  },

  /**
   * Returns a new mouse state after turning right.
   */
  turnRight: (mouse: MouseState): MouseState => {
    const nextDir = (mouse.direction + 1) % 4;
    return { 
      ...mouse, 
      direction: nextDir as Direction,
      history: [
        ...mouse.history,
        { x: mouse.x, y: mouse.y, direction: nextDir as Direction, timestamp: Date.now() }
      ]
    };
  },
  
  /**
   * Performs one step of a simple Left-hand rule algorithm.
   */
  stepLeftHand: (mouse: MouseState, maze: MazeState): MouseState => {
    // 1. Try to turn left
    const mouseLeft = SimulatorEngine.turnLeft(mouse);
    if (SimulatorEngine.canMoveForward(mouseLeft, maze)) {
      return SimulatorEngine.moveForward(mouseLeft, maze);
    }
    
    // 2. Try to move forward
    if (SimulatorEngine.canMoveForward(mouse, maze)) {
      return SimulatorEngine.moveForward(mouse, maze);
    }
    
    // 3. Try to turn right
    const mouseRight = SimulatorEngine.turnRight(mouse);
    if (SimulatorEngine.canMoveForward(mouseRight, maze)) {
      return SimulatorEngine.moveForward(mouseRight, maze);
    }
    
    // 4. U-turn (turn right twice)
    return SimulatorEngine.turnRight(mouseRight);
  },
  
  /**
   * Initializes the mouse at the start position.
   */
  getInitialState: (): MouseState => ({
    x: 0,
    y: 0,
    direction: Direction.North,
    history: [{ x: 0, y: 0, direction: Direction.North, timestamp: Date.now() }]
  })
};
