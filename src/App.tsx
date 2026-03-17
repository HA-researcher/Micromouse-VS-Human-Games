import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { generateMaze } from './utils/mazeGenerator';
import MazeRenderer from './components/MazeRenderer';
import { useSimulation } from './hooks/useSimulation';
import type { MazeState } from './types/maze';
import { DEFAULT_MAZE_SIZE } from './utils/constants';

function App() {
  const [maze, setMaze] = useState<MazeState | null>(null);
  const [seed, setSeed] = useState(42);
  
  const { isPlaying, speed, setSpeed, step, togglePlay, reset } = useSimulation(1);

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    reset(); // Reset simulation when generating new maze
  }, [reset]);

  useEffect(() => {
    const newMaze = generateMaze(DEFAULT_MAZE_SIZE, DEFAULT_MAZE_SIZE, seed);
    setMaze(newMaze);
  }, [seed]);

  return (
    <div className="App">
      <h1>Micromouse Visualizer V2</h1>
      
      {maze && <MazeRenderer maze={maze} />}
      
      <div className="controls">
        <div className="simulation-info">
          <span className="step-count">Step: {step}</span>
          <span className="status-badge" data-playing={isPlaying}>
            {isPlaying ? '▶ RUNNING' : '⏸ PAUSED'}
          </span>
        </div>

        <div className="button-group">
          <button onClick={togglePlay} className="btn-primary">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={reset} className="btn-secondary">Reset</button>
          <button onClick={handleGenerate} className="btn-outline">🎲 Random Maze</button>
        </div>

        <div className="speed-control">
          <label>Speed: </label>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="speed-select"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={4}>4.0x</option>
          </select>
        </div>

        <div className="seed-info">Current Seed: {seed}</div>
      </div>

      <footer style={{ marginTop: '3rem', color: '#666', fontSize: '14px' }}>
        Phase 1: Foundation & Core Simulation (Simulation Control)
      </footer>
    </div>
  );
}

export default App;
