import { useState, useCallback, useEffect, useRef } from 'react';
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
import Editor from '@monaco-editor/react';
import { executeCustomAlgorithm } from './utils/customAlgorithmRunner';
import { calculateOptimalCost } from './utils/pathFinder';
import { serializeRun, deserializeRun } from './utils/urlSerializer';
import { STAGES } from './utils/stages';
import { loadSaveData, saveProgress } from './utils/storage';
import type { SaveData } from './utils/storage';

const MONACO_EXTRA_LIBS = `
  enum Direction { North = 0, East = 1, South = 2, West = 3 }
  interface MazeState {
    width: number;
    height: number;
    walls: Uint8Array;
    discovered: Uint8Array;
    goalX: number;
    goalY: number;
    goalWidth: number;
    goalHeight: number;
  }
  interface MoveLog {
    x: number;
    y: number;
    direction: Direction;
    timestamp: number;
  }
  interface MachineParameters {
    straightCost: number;
    turnCost: number;
  }
  interface MouseState {
    x: number;
    y: number;
    direction: Direction;
    history: MoveLog[];
    totalCost: number;
  }
  
  /** Current state of the mouse. */
  declare const mouse: MouseState;
  /** Current state of the maze. */
  declare const maze: MazeState;
  /** Direction constants. */
  declare const Direction: {
    North: number;
    East: number;
    South: number;
    West: number;
  };
  /** Machine cost parameters. */
  declare const params: MachineParameters;
  /** Simulation engine methods. */
  declare const SimulatorEngine: {
    canMoveForward: (mouse: MouseState, maze: MazeState) => boolean;
    moveForward: (mouse: MouseState, maze: MazeState, params?: MachineParameters) => MouseState;
    turnLeft: (mouse: MouseState, params?: MachineParameters) => MouseState;
    turnRight: (mouse: MouseState, params?: MachineParameters) => MouseState;
  };
`;

export type AlgorithmMode = 'LeftHand' | 'RightHand' | 'Custom';
const DEFAULT_CUSTOM_CODE = `// Custom Algorithm (JavaScript)
// Available globally: mouse, maze, Direction, SimulatorEngine, params
// Must return a new MouseState object.

// Example: Move Forward if possible, else Turn Left
if (SimulatorEngine.canMoveForward(mouse, maze)) {
  return SimulatorEngine.moveForward(mouse, maze, params);
}
return SimulatorEngine.turnLeft(mouse, params);
`;

function App() {
  const [seed, setSeed] = useState(42);
  const [lang, setLang] = useState<Language>('ja');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSurvivalMode, setIsSurvivalMode] = useState<boolean>(false);
  const [straightCost, setStraightCost] = useState<number>(1);
  const [turnCost, setTurnCost] = useState<number>(3);
  const [isCampaignMode, setIsCampaignMode] = useState<boolean>(false);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [showGoalMessage, setShowGoalMessage] = useState<boolean>(false);
  
  const [mazeSize, setMazeSize] = useState<number>(DEFAULT_MAZE_SIZE);
  const [maze, setMaze] = useState<MazeState>(() => generateMaze(mazeSize, mazeSize, seed));

  useEffect(() => {
    const newMaze = generateMaze(mazeSize, mazeSize, seed);
    setMaze(newMaze);
    setOptimalCost(calculateOptimalCost(newMaze, { straightCost, turnCost }));
  }, [seed, mazeSize, straightCost, turnCost]);

  const [mouse1, setMouse1] = useState<MouseState>(SimulatorEngine.getInitialState());
  const [mouse2, setMouse2] = useState<MouseState>(SimulatorEngine.getInitialState());
  const [ghostPath, setGhostPath] = useState<Direction[] | null>(null);
  const [ghostMouse, setGhostMouse] = useState<MouseState | null>(null);
  const t = translations[lang];

  const [algo1, setAlgo1] = useState<AlgorithmMode>('LeftHand');
  const [algo2, setAlgo2] = useState<AlgorithmMode>('RightHand');
  const [customCode1, setCustomCode1] = useState(DEFAULT_CUSTOM_CODE);
  const [customCode2, setCustomCode2] = useState(DEFAULT_CUSTOM_CODE);
  const [error1, setError1] = useState<string | null>(null);
  const [error2, setError2] = useState<string | null>(null);
  const [duration1, setDuration1] = useState<number | null>(null);
  const [duration2, setDuration2] = useState<number | null>(null);
  const [optimalCost, setOptimalCost] = useState<number>(0);

  const mouse1Ref = useRef(mouse1);
  const mouse2Ref = useRef(mouse2);
  const ghostMouseRef = useRef(ghostMouse);
  useEffect(() => { mouse1Ref.current = mouse1; }, [mouse1]);
  useEffect(() => { mouse2Ref.current = mouse2; }, [mouse2]);
  useEffect(() => { ghostMouseRef.current = ghostMouse; }, [ghostMouse]);

  // Sync isPlaying to Ref to avoid stale closure in onTick
  const isPlayingRef = useRef<boolean>(false);

  // Load Ghost from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghostData = params.get('g');
    if (ghostData) {
      const decoded = deserializeRun(ghostData);
      if (decoded) {
        setMazeSize(decoded.width);
        // We set the seed but generateMaze is in another useEffect, so we might need careful sequencing.
        // Actually, setMazeSize + setSeed will trigger the maze generation.
        setSeed(decoded.seed);
        setGhostPath(decoded.path);
        setGhostMouse(SimulatorEngine.getInitialState());
      }
    }
  }, []);

  const onTick = useCallback(async (currentStep: number) => {
    if (currentStep === 0) return; // Skip logic on reset tick

    const params = { straightCost, turnCost };
    
    const runAlgo = async (algo: AlgorithmMode, mouseData: MouseState, code: string, setError: (e: string|null) => void, setDuration: (d: number|null) => void) => {
      try {
        if (algo === 'LeftHand') {
          setDuration(null);
          return SimulatorEngine.stepLeftHand(mouseData, maze, params);
        }
        if (algo === 'RightHand') {
          setDuration(null);
          return SimulatorEngine.stepRightHand(mouseData, maze, params);
        }
        if (algo === 'Custom') {
          const instanceId = mouseData === mouse1Ref.current ? 'mouse1' : 'mouse2';
          const { result, duration } = await executeCustomAlgorithm(instanceId, mouseData, maze, params, code);
          setError(null);
          setDuration(duration);
          return result;
        }
      } catch (e) {
        setError((e as Error).message || String(e));
        setDuration(null);
      }
      return mouseData; // on error, return unchanged mouse
    };

    const next1 = await runAlgo(algo1, mouse1Ref.current, customCode1, setError1, setDuration1);
    setMouse1(next1);

    const next2 = await runAlgo(algo2, mouse2Ref.current, customCode2, setError2, setDuration2);
    setMouse2(next2);

    // Campaign Progress
    if (isCampaignMode && currentStageId) {
      const isAtGoal = (m: MouseState) => 
        m.x >= maze.goalX && m.x < maze.goalX + maze.goalWidth &&
        m.y >= maze.goalY && m.y < maze.goalY + maze.goalHeight;

      if (isAtGoal(next1) || isAtGoal(next2)) {
        const cost = isAtGoal(next1) ? next1.totalCost : next2.totalCost;
        const newData = saveProgress(currentStageId, cost);
        setSaveData(newData);
        if (isPlayingRef.current) {
          togglePlay(); // Stop simulation on goal
          setShowGoalMessage(true);
        }
      }
    }

    // Ghost movement
    if (ghostPath && ghostMouseRef.current) {
      const stepIdx = currentStep - 1; // currentStep is 1-based, path is 0-based
      if (stepIdx >= 0 && stepIdx < ghostPath.length) {
        let g = ghostMouseRef.current;
        const targetDir = ghostPath[stepIdx];
        
        if (g.direction !== targetDir) {
          // If direction is different, it's a turn.
          // In reality, a single step might have been a turn OR a move.
          // Since we only saved one direction per tick, we'll just set it.
          g = { ...g, direction: targetDir };
        } else {
          // If direction is same, it was a move forward.
          g = SimulatorEngine.moveForward(g, maze, params);
        }
        setGhostMouse(g);
      }
    }
  }, [maze, straightCost, turnCost, algo1, algo2, customCode1, customCode2, ghostPath]);

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

  // Sync ref
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const handleReset = useCallback(() => {
    reset();
    setMouse1(SimulatorEngine.getInitialState());
    setMouse2(SimulatorEngine.getInitialState());
    setDuration1(null);
    setDuration2(null);
    if (ghostPath) {
      setGhostMouse(SimulatorEngine.getInitialState());
    } else {
      setGhostMouse(null);
    }
    setShowGoalMessage(false);
  }, [reset, ghostPath]);

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

  const handleShareRun = () => {
    if (mouse1.history.length === 0) return;
    const data = serializeRun(seed, maze.width, maze.height, mouse1.history);
    const url = new URL(window.location.href);
    url.searchParams.set('g', data);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert(lang === 'ja' ? '共有用URLをクリップボードにコピーしました！' : 'Share URL copied to clipboard!');
    });
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

      const moveInDirection = (targetDir: Direction) => {
        setMouse1(prev => {
          let curr = prev;
          // Rotate until facing targetDir
          while (curr.direction !== targetDir) {
            // Find shortest turn
            const diff = (targetDir - curr.direction + 4) % 4;
            if (diff === 3) curr = SimulatorEngine.turnLeft(curr, params);
            else curr = SimulatorEngine.turnRight(curr, params);
          }
          // Then move forward
          return SimulatorEngine.moveForward(curr, maze, params);
        });
        
        setMouse2(prev => {
          let curr = prev;
          while (curr.direction !== targetDir) {
            const diff = (targetDir - curr.direction + 4) % 4;
            if (diff === 3) curr = SimulatorEngine.turnLeft(curr, params);
            else curr = SimulatorEngine.turnRight(curr, params);
          }
          return SimulatorEngine.moveForward(curr, maze, params);
        });
      };

      switch (e.key) {
        case 'ArrowUp':    moveInDirection(Direction.North); break;
        case 'ArrowRight': moveInDirection(Direction.East);  break;
        case 'ArrowDown':  moveInDirection(Direction.South); break;
        case 'ArrowLeft':  moveInDirection(Direction.West);  break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maze, isPlaying, straightCost, turnCost, togglePlay]);

  const handleStageSelect = (stageId: string) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;
    
    setIsCampaignMode(true);
    setCurrentStageId(stage.id);
    setMazeSize(stage.size);
    setSeed(stage.seed);
    setIsEditMode(false);
    setIsSurvivalMode(false);
    handleReset();
  };

  const handleEditorBeforeMount = (monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(MONACO_EXTRA_LIBS, 'ts:lib/maze_api.d.ts');
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
    });
  };

  const toggleLang = () => setLang(l => l === 'en' ? 'ja' : 'en');

  return (
    <div className="App">
      <header className="app-header">
        <h1>{t.title}</h1>
        <button onClick={toggleLang} className="lang-toggle">
          {lang === 'en' ? '日本語' : 'English'}
        </button>
      </header>
      
      {showGoalMessage && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 215, 0, 0.9)', color: '#000', padding: '20px 40px',
          borderRadius: '12px', fontSize: '24px', fontWeight: 'bold', zIndex: 1000,
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)', animation: 'bounce 1s infinite'
        }}>
          {t.stageClear}
        </div>
      )}
      
      <div className="split-screen-container" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div className="simulator-panel" style={{ flex: '1 1 45%', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{color: '#fff', fontSize: '1rem', margin: 0}}>Algorithm 1</h3>
            <select value={algo1} onChange={(e) => setAlgo1(e.target.value as AlgorithmMode)} className="size-select">
              <option value="LeftHand">Left-Hand</option>
              <option value="RightHand">Right-Hand</option>
              <option value="Custom">Custom (JS)</option>
            </select>
          </div>
          {algo1 === 'Custom' && (
            <div style={{height: '250px', marginBottom: '10px', border: '1px solid #444', borderRadius: '4px', overflow: 'hidden'}}>
              <Editor 
                defaultLanguage="javascript" 
                theme="vs-dark" 
                value={customCode1} 
                onChange={(v: string | undefined) => setCustomCode1(v || '')} 
                options={{minimap: {enabled: false}, fontSize: 13, scrollBeyondLastLine: false}} 
                beforeMount={handleEditorBeforeMount}
              />
            </div>
          )}
          {error1 && <div style={{color: '#ff5252', fontSize: '12px', marginBottom: '10px', padding: '5px', backgroundColor: 'rgba(255,0,0,0.1)'}}>{error1}</div>}
          
          {maze && <MazeRenderer 
            maze={maze} 
            mouse={mouse1} 
            ghost={ghostMouse || undefined}
            onWallToggle={isEditMode ? handleWallToggle : undefined} 
            isSurvivalMode={isSurvivalMode}
          />}
          <div className="simulation-info" style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span className="step-count"><strong>{t.totalCost}: {mouse1.totalCost}</strong></span>
              {duration1 !== null && <span style={{fontSize: '12px', color: '#888'}}>⚡ {duration1.toFixed(2)}ms</span>}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc'}}>
              <span>{t.steps}: {mouse1.stepCount} | {t.turns}: {mouse1.turnCount}</span>
              <span>{t.efficiency}: {mouse1.totalCost > 0 ? ((optimalCost / mouse1.totalCost) * 100).toFixed(1) : 0}%</span>
            </div>
            <div style={{fontSize: '11px', color: '#888', textAlign: 'right'}}>
              {t.optimalCost}: {optimalCost}
            </div>
          </div>
        </div>
        
        <div className="simulator-panel" style={{ flex: '1 1 45%', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{color: '#fff', fontSize: '1rem', margin: 0}}>Algorithm 2</h3>
            <select value={algo2} onChange={(e) => setAlgo2(e.target.value as AlgorithmMode)} className="size-select">
              <option value="LeftHand">Left-Hand</option>
              <option value="RightHand">Right-Hand</option>
              <option value="Custom">Custom (JS)</option>
            </select>
          </div>
          {algo2 === 'Custom' && (
            <div style={{height: '250px', marginBottom: '10px', border: '1px solid #444', borderRadius: '4px', overflow: 'hidden'}}>
              <Editor 
                defaultLanguage="javascript" 
                theme="vs-dark" 
                value={customCode2} 
                onChange={(v: string | undefined) => setCustomCode2(v || '')} 
                options={{minimap: {enabled: false}, fontSize: 13, scrollBeyondLastLine: false}} 
                beforeMount={handleEditorBeforeMount}
              />
            </div>
          )}
          {error2 && <div style={{color: '#ff5252', fontSize: '12px', marginBottom: '10px', padding: '5px', backgroundColor: 'rgba(255,0,0,0.1)'}}>{error2}</div>}
          
          {maze && <MazeRenderer 
            maze={maze} 
            mouse={mouse2} 
            ghost={ghostMouse || undefined}
            onWallToggle={isEditMode ? handleWallToggle : undefined} 
            isSurvivalMode={isSurvivalMode}
          />}
          <div className="simulation-info" style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span className="step-count"><strong>{t.totalCost}: {mouse2.totalCost}</strong></span>
              {duration2 !== null && <span style={{fontSize: '12px', color: '#888'}}>⚡ {duration2.toFixed(2)}ms</span>}
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc'}}>
              <span>{t.steps}: {mouse2.stepCount} | {t.turns}: {mouse2.turnCount}</span>
              <span>{t.efficiency}: {mouse2.totalCost > 0 ? ((optimalCost / mouse2.totalCost) * 100).toFixed(1) : 0}%</span>
            </div>
            <div style={{fontSize: '11px', color: '#888', textAlign: 'right'}}>
              {t.optimalCost}: {optimalCost}
            </div>
          </div>
        </div>
      </div>

      <div className="campaign-panel" style={{marginTop: '20px', padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px', border: '1px solid #444'}}>
        <h3 style={{color: '#FFD700', marginTop: 0, marginBottom: '15px'}}>{t.campaignMode}</h3>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center'}}>
          {STAGES.map((stage, index) => {
            const isUnlocked = index === 0 || saveData.campaign_progress.includes(STAGES[index-1].id);
            const isCleared = saveData.campaign_progress.includes(stage.id);
            const best = saveData.best_costs[stage.id];
            
            return (
              <button 
                key={stage.id}
                onClick={() => isUnlocked && handleStageSelect(stage.id)}
                className={currentStageId === stage.id ? "btn-primary" : "btn-outline"}
                disabled={!isUnlocked}
                style={{
                  minWidth: '150px',
                  opacity: isUnlocked ? 1 : 0.5,
                  flexDirection: 'column',
                  height: 'auto',
                  padding: '10px',
                  border: currentStageId === stage.id ? '2px solid #FFD700' : undefined
                }}
              >
                <div style={{fontWeight: 'bold'}}>{stage.name[lang]}</div>
                <div style={{fontSize: '11px', marginTop: '4px'}}>
                  {isCleared ? `✅ ${t.bestCost}: ${best}` : (isUnlocked ? t.stage : t.locked)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="controls" style={{marginTop: '20px'}}>
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
          <button onClick={handleReset} className="btn-outline">{t.reset}</button>
          <button onClick={handleGenerate} className="btn-outline">{t.generateMaze}</button>
        </div>

        <div className="button-group io-controls">
          <button 
            onClick={() => {
              const newSurvival = !isSurvivalMode;
              setIsSurvivalMode(newSurvival);
              if (newSurvival) setIsEditMode(false);
            }} 
            className={isSurvivalMode ? "btn-primary" : "btn-outline"}
          >
            {isSurvivalMode ? t.survivalModeOff : t.survivalModeOn}
          </button>
          <button 
            onClick={() => {
              const newEdit = !isEditMode;
              setIsEditMode(newEdit);
              if (newEdit) setIsSurvivalMode(false);
            }} 
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
          <button onClick={handleShareRun} className="btn-primary" title="Share your run as a Ghost">
            {lang === 'ja' ? '🚀 走りを共有' : '🚀 Share Run'}
          </button>
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
          <label>{t.straightCost}: </label>
          <input type="number" value={straightCost} onChange={e => setStraightCost(Number(e.target.value))} className="size-select" style={{width: '60px'}} />
          <label style={{marginLeft: '10px'}}>{t.turnCost}: </label>
          <input type="number" value={turnCost} onChange={e => setTurnCost(Number(e.target.value))} className="size-select" style={{width: '60px'}} />
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
