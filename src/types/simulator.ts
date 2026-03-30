import type { Direction } from './maze';

/**
 * Represents a single move in the simulation history.
 */
export interface MoveLog {
  x: number;
  y: number;
  direction: Direction;
  timestamp: number;
}

/**
 * Machine parameter inputs for cost calculation.
 */
export interface MachineParameters {
  straightCost: number;
  turnCost: number;
}

/**
 * State of the mouse in the simulation.
 */
export interface MouseState {
  x: number;
  y: number;
  direction: Direction;
  history: MoveLog[];
  totalCost: number;
  stepCount: number;
  turnCount: number;
}
