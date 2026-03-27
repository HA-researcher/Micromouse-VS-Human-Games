import { SimulatorEngine } from '../utils/simulatorEngine';
import { Direction } from '../types/maze';

self.onmessage = (e) => {
  const { id, code, mouse, maze, params } = e.data;
  
  try {
    const userFunc = new Function('mouse', 'maze', 'Direction', 'SimulatorEngine', 'params', code);
    const result = userFunc(mouse, maze, Direction, SimulatorEngine, params);
    
    if (!result || typeof result.x !== 'number' || typeof result.y !== 'number') {
      throw new Error('Custom algorithm must return a valid MouseState object.');
    }
    
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: (error as Error).message || String(error) });
  }
};
