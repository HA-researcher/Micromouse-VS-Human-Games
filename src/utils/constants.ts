/**
 * Global constants for the Micromouse Visualizer.
 */

export const DEFAULT_MAZE_SIZE = 16;
export const OFFICIAL_GOAL_SIZE = 2; // 2x2 goal

// Cost settings for pathfinding (Section 7.2)
export const DEFAULT_COSTS = {
  STRAIGHT: 1,
  TURN_90: 3,
  TURN_180: 5,
};

// Simulation settings
export const FPS = 60;
export const DEFAULT_ANIMATION_SPEED = 1.0;

// Storage keys
export const STORAGE_KEY = 'mm_visualizer_v2_save_data';
