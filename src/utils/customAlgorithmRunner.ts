import type { MazeState } from '../types/maze';
import type { MouseState, MachineParameters } from '../types/simulator';

let activeWorker: Worker | null = null;
let currentMessageId = 0;

export const executeCustomAlgorithm = (
  mouse: MouseState, 
  maze: MazeState, 
  params: MachineParameters, 
  code: string
): Promise<MouseState> => {
  return new Promise((resolve, reject) => {
    if (!activeWorker) {
      activeWorker = new Worker(new URL('../workers/algorithmWorker.ts', import.meta.url), { type: 'module' });
    }

    const messageId = ++currentMessageId;
    
    const timeout = setTimeout(() => {
      // If it takes more than 3s, terminate the worker to kill infinite loops
      if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
      }
      reject(new Error('Algorithm execution timed out (3000ms). Infinite loop detected.'));
    }, 3000);

    const onMessage = (e: MessageEvent) => {
      if (e.data.id === messageId) {
        clearTimeout(timeout);
        activeWorker!.removeEventListener('message', onMessage);
        
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
      }
    };

    activeWorker.addEventListener('message', onMessage);
    activeWorker.postMessage({ id: messageId, code, mouse, maze, params });
  });
};
