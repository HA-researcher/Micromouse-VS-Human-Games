import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { generateMaze } from './utils/mazeGenerator';
import MazeRenderer from './components/MazeRenderer';
import { MazeState } from './types/maze';
import { DEFAULT_MAZE_SIZE } from './utils/constants';

function App() {
  const [maze, setMaze] = useState<MazeState | null>(null);
  const [seed, setSeed] = useState(42); // Use a fixed initial seed for stability

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
  }, []);

  useEffect(() => {
    const newMaze = generateMaze(DEFAULT_MAZE_SIZE, DEFAULT_MAZE_SIZE, seed);
    setMaze(newMaze);
  }, [seed]);

  return (
    <div className="App">
      <h1>Micromouse Visualizer V2</h1>
      
      {maze && <MazeRenderer maze={maze} />}
      
      <div className="controls">
        <div className="button-group">
          <button onClick={handleGenerate}>🎲 Generate Random Maze</button>
        </div>
        <div className="seed-info">Current Seed: {seed}</div>
      </div>

      <footer style={{ marginTop: '3rem', color: '#666', fontSize: '14px' }}>
        Phase 1: Foundation & Core Simulation (Basic 2D Renderer)
      </footer>
    </div>
  );
}

export default App;
