import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { generateMaze } from './utils/mazeGenerator';
import MazeRenderer from './components/MazeRenderer';
import { useSimulation } from './hooks/useSimulation';
import { translations, Language } from './i18n/translations';
import type { MazeState } from './types/maze';
import { DEFAULT_MAZE_SIZE } from './utils/constants';

function App() {
  const [maze, setMaze] = useState<MazeState | null>(null);
  const [seed, setSeed] = useState(42);
  const [lang, setLang] = useState<Language>('ja');
  
  const t = translations[lang];

  const { 
    isPlaying, speed, setSpeed, step, togglePlay, reset, stepForward, stepBackward 
  } = useSimulation(undefined, 1);

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    reset();
  }, [reset]);

  useEffect(() => {
    const newMaze = generateMaze(DEFAULT_MAZE_SIZE, DEFAULT_MAZE_SIZE, seed);
    setMaze(newMaze);
  }, [seed]);

  const toggleLang = () => setLang(l => l === 'en' ? 'ja' : 'en');

  return (
    <div className="App">
      <header className="app-header">
        <h1>{t.title}</h1>
        <button onClick={toggleLang} className="lang-toggle">
          {lang === 'en' ? '日本語' : 'English'}
        </button>
      </header>
      
      {maze && <MazeRenderer maze={maze} />}
      
      <div className="controls">
        <div className="simulation-info">
          <span className="step-count">{t.step}: {step}</span>
          <span className="status-badge" data-playing={isPlaying}>
            {isPlaying ? t.statusRunning : t.statusPaused}
          </span>
        </div>

        <div className="button-group">
          <button onClick={stepBackward} className="btn-secondary" title={t.stepBackward}>⏮</button>
          <button onClick={togglePlay} className="btn-primary">
            {isPlaying ? t.pause : t.play}
          </button>
          <button onClick={stepForward} className="btn-secondary" title={t.stepForward}>⏭</button>
          <button onClick={reset} className="btn-outline">{t.reset}</button>
          <button onClick={handleGenerate} className="btn-outline">{t.generateMaze}</button>
        </div>

        <div className="speed-control">
          <label>{t.speed}: </label>
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

        <div className="seed-info">{t.currentSeed}: {seed}</div>
      </div>

      <footer className="app-footer">
        {t.phase}
      </footer>
    </div>
  );
}

export default App;
