import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { generateMaze } from './utils/mazeGenerator';
import { importMaz, exportMaz } from './utils/mazParser';
import MazeRenderer from './components/MazeRenderer';
import { useSimulation } from './hooks/useSimulation';
import { translations } from './i18n/translations';
import type { Language } from './i18n/translations';
import { SimulatorEngine } from './utils/simulatorEngine';
import type { MouseState } from './types/simulator';
import { Direction, type MazeState } from './types/maze';
import { DEFAULT_MAZE_SIZE } from './utils/constants';

function App() {
  const [seed, setSeed] = useState(42);
  const [lang, setLang] = useState<Language>('ja');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  const [mazeSize, setMazeSize] = useState<number>(DEFAULT_MAZE_SIZE);
  const [maze, setMaze] = useState<MazeState>(() => generateMaze(mazeSize, mazeSize, seed));

  useEffect(() => {
    setMaze(generateMaze(mazeSize, mazeSize, seed));
  }, [seed, mazeSize]);

  const [mouse, setMouse] = useState<MouseState>(SimulatorEngine.getInitialState());
  const t = translations[lang];

  const onTick = useCallback(() => {
    setMouse(prev => SimulatorEngine.stepLeftHand(prev, maze, { straightCost, turnCost }));
  }, [maze, straightCost, turnCost]);

  const handleWallToggle = useCallback((x: number, y: number, direction: Direction) => {
    if (!isEditMode) return;

    setMaze(prev => {
      const newWalls = new Uint8Array(prev.walls);
      
      const toggleWall = (cx: number, cy: number, dir: Direction) => {
        if (cx < 0 || cx >= prev.width || cy < 0 || cy >= prev.height) return;
        const idx = cy * prev.width + cx;
        newWalls[idx] ^= (1 << dir);
      };

      // Toggle clicked wall
      toggleWall(x, y, direction);

      // Toggle adjacent cell's corresponding wall
      if (direction === Direction.North) toggleWall(x, y - 1, Direction.South);
      else if (direction === Direction.South) toggleWall(x, y + 1, Direction.North);
      else if (direction === Direction.East) toggleWall(x + 1, y, Direction.West);
      else if (direction === Direction.West) toggleWall(x - 1, y, Direction.East);

      return { ...prev, walls: newWalls };
    });
  }, [isEditMode]);

  const { 
    isPlaying, speed, setSpeed, step, togglePlay, reset, stepForward, stepBackward 
  } = useSimulation(onTick, 1);

  const handleReset = useCallback(() => {
    reset();
    setMouse(SimulatorEngine.getInitialState());
  }, [reset]);

  const handleGenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    handleReset();
  }, [handleReset]);

  const handleImportMaz = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newMaze = importMaz(text);
        setMaze(newMaze);
        handleReset();
      } catch {
        alert(t.invalidMaz);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleExportMaz = () => {
    if (!maze) return;
    const text = exportMaz(maze);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maze_${maze.width}x${maze.height}_s${seed}.maz`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Manual drive keyboard support (F-10 foundation)
  useEffect(() => {
    if (!maze || isPlaying) return;

    const params = { straightCost, turnCost };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
          setMouse(prev => SimulatorEngine.moveForward(prev, maze, params));
          break;
        case 'ArrowLeft':
          setMouse(prev => SimulatorEngine.turnLeft(prev, params));
          break;
        case 'ArrowRight':
          setMouse(prev => SimulatorEngine.turnRight(prev, params));
          break;
        case 'ArrowDown':
          // U-Turn logic (Turn Right twice)
          setMouse(prev => SimulatorEngine.turnRight(SimulatorEngine.turnRight(prev, params), params));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maze, isPlaying, straightCost, turnCost]);

  const toggleLang = () => setLang(l => l === 'en' ? 'ja' : 'en');

  return (
    <div className="App">
      <header className="app-header">
        <h1>{t.title}</h1>
        <button onClick={toggleLang} className="lang-toggle">
          {lang === 'en' ? '日本語' : 'English'}
        </button>
      </header>
      
      {maze && <MazeRenderer 
        maze={maze} 
        mouse={mouse} 
        onWallToggle={isEditMode ? handleWallToggle : undefined} 
      />}
      
      <div className="controls">
        <div className="simulation-info">
          <span className="step-count">{t.step}: {step}</span>
          <span className="step-count" style={{marginLeft: '10px'}}>{t.totalCost}: {mouse.totalCost}</span>
          <span className="status-badge" data-playing={isPlaying}>
            {isPlaying ? t.statusRunning : t.statusPaused}
          </span>
        </div>

        <div className="button-group">
          <button onClick={stepBackward} className="btn-secondary" title={t.stepBackward}>⏮</button>
          <button onClick={togglePlay} className="btn-primary">
            {isPlaying ? t.pause : t.play}
          </button>
          <button onClick={stepForward} className="btn-secondary" title={t.stepForward} onClickCapture={onTick}>⏭</button>
          <button onClick={handleReset} className="btn-outline">{t.reset}</button>
          <button onClick={handleGenerate} className="btn-outline">{t.generateMaze}</button>
        </div>

        <div className="button-group io-controls">
          <button 
            onClick={() => setIsEditMode(!isEditMode)} 
            className={isEditMode ? "btn-primary" : "btn-outline"}
            title={lang === 'ja' ? "クリックで壁を編集できます" : "Click walls to toggle them"}
          >
            {isEditMode ? t.editModeOff : t.editModeOn}
          </button>
          <label className="btn-outline file-upload">
            <input type="file" accept=".maz,.txt" onChange={handleImportMaz} style={{ display: 'none' }} />
            {t.importMaz}
          </label>
          <button onClick={handleExportMaz} className="btn-outline">{t.exportMaz}</button>
        </div>

        <div className="manual-hint">
          ⌨️ {lang === 'ja' ? '矢印キーで自由に機体を操作可能' : 'Playable with Arrow Keys'}
        </div>

        <div className="speed-control">
          <label>{t.mazeSize}: </label>
          <select 
            value={mazeSize} 
            onChange={(e) => {
              setMazeSize(Number(e.target.value));
              handleReset();
            }}
            className="size-select"
          >
            <option value={8}>{t.mazeSize8}</option>
            <option value={16}>{t.mazeSize16}</option>
            <option value={32}>{t.mazeSize32}</option>
          </select>
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
