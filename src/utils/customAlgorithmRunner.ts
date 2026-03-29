import type { MazeState } from '../types/maze';
import type { MouseState, MachineParameters } from '../types/simulator';

const workers = new Map<string, Worker>();
let currentMessageId = 0;

export const executeCustomAlgorithm = (
  instanceId: string,
  mouse: MouseState, 
  maze: MazeState, 
  params: MachineParameters, 
  code: string
): Promise<MouseState> => {
  return new Promise((resolve, reject) => {
    let worker = workers.get(instanceId);
    if (!worker) {
      worker = new Worker(new URL('../workers/algorithmWorker.ts', import.meta.url), { type: 'module' });
      workers.set(instanceId, worker);
    }

    const messageId = ++currentMessageId;
    
    const timeout = setTimeout(() => {
      // If it takes more than 3s, terminate the specific worker to kill infinite loops
      const w = workers.get(instanceId);
      if (w) {
        w.terminate();
        workers.delete(instanceId);
      }
      reject(new Error(`Algorithm execution timed out (3000ms) for ${instanceId}. Infinite loop detected.`));
    }, 3000);

    const onMessage = (e: MessageEvent) => {
      if (e.data.id === messageId) {
        clearTimeout(timeout);
        const w = workers.get(instanceId);
        if (w) {
          w.removeEventListener('message', onMessage);
        }
        
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({ id: messageId, code, mouse, maze, params });
  });
};
