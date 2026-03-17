/**
 * Direction enum representing the four cardinal directions.
 */
export enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

/**
 * WallType representing the state of a wall in the maze.
 */
export enum WallType {
  Unknown = 0,
  Wall = 1,
  Path = 2,
}

/**
 * MazeState interface defining the core data structure of the maze.
 * Uses TypedArrays for memory efficiency as per Section 4.2.
 */
export interface MazeState {
  width: number;
  height: number;
  // Walls are stored as a 1D array (Uint8Array)
  // Index = y * width + x
  // Each byte can store bitmask for 4 directions if needed, 
  // or use separate arrays for vertical and horizontal walls.
  // Here we use a bitmask for simplicity: bit 0: North, 1: East, 2: South, 3: West
  walls: Uint8Array;
  
  // Discovery status for the fog of war/exploration
  discovered: Uint8Array;
  
  // Goal area definition
  goalX: number;
  goalY: number;
  goalWidth: number;
  goalHeight: number;
}
