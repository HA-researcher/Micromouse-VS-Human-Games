import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import { generateMaze } from './utils/mazeGenerator';
import { importMaz, exportMaz } from './utils/mazParser';
import MazeRenderer from './components/MazeRenderer';
import MazeRenderer3D from './components/MazeRenderer3D';
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
import FaceController from './components/FaceController';
import TutorialCard from './components/TutorialCard';
import { TUTORIAL_LESSONS } from './utils/tutorialData';
import type { Lesson } from './types/tutorial';

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
    stepCount: number;
    turnCount: number;
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

export type AlgorithmMode = 'LeftHand' | 'RightHand' | 'FloodFill' | 'Centripetal' | 'Custom';
const DEFAULT_CUSTOM_CODE = `// Custom Algorithm (JavaScript)
// Available globally: mouse, maze, Direction, SimulatorEngine, params
// Must return a new MouseState object.

// Example: Move Forward if possible, else Turn Left
if (SimulatorEngine.canMoveForward(mouse, maze)) {
  return SimulatorEngine.moveForward(mouse, maze, params);
}
return SimulatorEngine.turnLeft(mouse, params);
`;

interface AlgoInstance {
  id: string;
  mouse: MouseState;
  algo: AlgorithmMode;
  customCode: string;
  error: string | null;
  duration: number | null;
  viewMode: '2D' | '3D';
}

const createInstance = (id: string, algo: AlgorithmMode = 'LeftHand'): AlgoInstance => ({
  id,
  mouse: SimulatorEngine.getInitialState(),
  algo,
  customCode: DEFAULT_CUSTOM_CODE,
  error: null,
  duration: null,
  viewMode: '2D'
});

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
  
  // Tutorial State
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [mazeSize, setMazeSize] = useState<number>(DEFAULT_MAZE_SIZE);
  const [maze, setMaze] = useState<MazeState>(() => generateMaze(mazeSize, mazeSize, seed));
  const [isFaceControlEnabled, setIsFaceControlEnabled] = useState<boolean>(false);
  const faceCommandRef = useRef<'left' | 'right' | 'forward' | 'none'>('none');

  useEffect(() => {
    const newMaze = generateMaze(mazeSize, mazeSize, seed);
    setMaze(newMaze);
    setOptimalCost(calculateOptimalCost(newMaze, { straightCost, turnCost }));
  }, [seed, mazeSize, straightCost, turnCost]);

  const [ghostPath, setGhostPath] = useState<Direction[] | null>(null);
  const [ghostMouse, setGhostMouse] = useState<MouseState | null>(null);
  const t = translations[lang];

  const [instances, setInstances] = useState<AlgoInstance[]>([createInstance('1', 'LeftHand')]);
  const [optimalCost, setOptimalCost] = useState<number>(0);

  const instancesRef = useRef(instances);
  const ghostMouseRef = useRef(ghostMouse);
  useEffect(() => { instancesRef.current = instances; }, [instances]);
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
        setSeed(decoded.seed);
        setGhostPath(decoded.path);
        setGhostMouse(SimulatorEngine.getInitialState());
      }
    }
  }, []);

  const addInstance = () => {
    if (instances.length >= 4) return;
    setInstances(prev => [...prev, createInstance(Math.random().toString(36).substr(2, 9))]);
  };

  const removeInstance = (id: string) => {
    if (instances.length <= 1) return;
    setInstances(prev => prev.filter(inst => inst.id !== id));
  };

  const updateInstance = (id: string, updates: Partial<AlgoInstance>) => {
    setInstances(prev => prev.map(inst => inst.id === id ? { ...inst, ...updates } : inst));
  };

  const onTick = useCallback(async (currentStep: number) => {
    if (currentStep === 0) return; // Skip logic on reset tick
    const params = { straightCost, turnCost };
    
    const updateCell = (m: MouseState, currMaze: MazeState): MazeState => {
      const idx = m.y * currMaze.width + m.x;
      if (currMaze.discovered[idx] === currMaze.walls[idx]) return currMaze;
      const newD = new Uint8Array(currMaze.discovered);
      newD[idx] = currMaze.walls[idx];
      const w = currMaze.walls[idx];
      if (m.y > 0) {
        if (w & (1 << Direction.North)) newD[(m.y-1)*currMaze.width + m.x] |= (1 << Direction.South);
        else newD[(m.y-1)*currMaze.width + m.x] &= ~(1 << Direction.South);
      }
      if (m.x < currMaze.width - 1) {
        if (w & (1 << Direction.East)) newD[m.y*currMaze.width + (m.x+1)] |= (1 << Direction.West);
        else newD[m.y*currMaze.width + (m.x+1)] &= ~(1 << Direction.West);
      }
      if (m.y < currMaze.height - 1) {
        if (w & (1 << Direction.South)) newD[(m.y+1)*currMaze.width + m.x] |= (1 << Direction.North);
        else newD[(m.y+1)*currMaze.width + m.x] &= ~(1 << Direction.North);
      }
      if (m.x > 0) {
        if (w & (1 << Direction.West)) newD[m.y*currMaze.width + (m.x-1)] |= (1 << Direction.East);
        else newD[m.y*currMaze.width + (m.x-1)] &= ~(1 << Direction.East);
      }
      return { ...currMaze, discovered: newD };
    };

    // Step 1: Update Discovery for all mice
    setMaze(prev => {
      let nextMaze = prev;
      instancesRef.current.forEach(inst => {
        nextMaze = updateCell(inst.mouse, nextMaze);
      });
      return nextMaze;
    });

    // Step 2: Run algorithms for all instances
    const nextInstances = await Promise.all(instancesRef.current.map(async (inst) => {
      let error: string | null = null;
      let duration: number | null = null;
      let nextMouse = inst.mouse;

      try {
        if (inst.algo === 'LeftHand') {
          nextMouse = SimulatorEngine.stepLeftHand(inst.mouse, maze, params);
        } else if (inst.algo === 'RightHand') {
          nextMouse = SimulatorEngine.stepRightHand(inst.mouse, maze, params);
        } else if (inst.algo === 'FloodFill') {
          nextMouse = SimulatorEngine.stepFloodFill(inst.mouse, maze, params);
        } else if (inst.algo === 'Centripetal') {
          nextMouse = SimulatorEngine.stepCentripetal(inst.mouse, maze, params);
        } else if (inst.algo === 'Custom') {
          const { result, duration: d } = await executeCustomAlgorithm(inst.id, inst.mouse, maze, params, inst.customCode);
          nextMouse = result;
          duration = d;
        }
      } catch (e) {
        error = (e as Error).message || String(e);
      }
      return { ...inst, mouse: nextMouse, error, duration };
    }));

    setInstances(nextInstances);

    // Ghost movement
    if (ghostPath && ghostMouseRef.current) {
      const stepIdx = currentStep - 1;
      if (stepIdx >= 0 && stepIdx < ghostPath.length) {
        let g = ghostMouseRef.current;
        const targetDir = ghostPath[stepIdx];
        if (g.direction !== targetDir) g = { ...g, direction: targetDir };
        else g = SimulatorEngine.moveForward(g, maze, params);
        setGhostMouse(g);
      }
    }
  }, [maze, straightCost, turnCost, ghostPath]);

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
    setInstances(prev => prev.map(inst => ({
      ...inst,
      mouse: SimulatorEngine.getInitialState(),
      duration: null,
      error: null
    })));
    if (ghostPath) {
      setGhostMouse(SimulatorEngine.getInitialState());
    } else {
      setGhostMouse(null);
    }
    setShowGoalMessage(false);
  }, [reset, ghostPath]);

  // Reactive Goal Detection (Handles manual movement and algo)
  useEffect(() => {
    if (!maze || showGoalMessage || instances.length === 0) return;

    const isAtGoal = (m: MouseState) => 
      m.x >= maze.goalX && m.x < maze.goalX + maze.goalWidth &&
      m.y >= maze.goalY && m.y < maze.goalY + maze.goalHeight;

    const reachingInst = instances.find(inst => isAtGoal(inst.mouse));

    if (reachingInst) {
      setShowGoalMessage(true);
      if (isPlayingRef.current) {
        togglePlay();
      }

      // Campaign Progress (Only if campaign mode)
      if (isCampaignMode && currentStageId) {
        const cost = reachingInst.mouse.totalCost;
        const newData = saveProgress(currentStageId, cost);
        setSaveData(newData);
      }
    }
  }, [instances, maze, isCampaignMode, currentStageId, showGoalMessage, togglePlay]);

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
    if (instances.length === 0 || instances[0].mouse.history.length === 0) return;
    const data = serializeRun(seed, maze.width, maze.height, instances[0].mouse.history);
    const url = new URL(window.location.href);
    url.searchParams.set('g', data);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert(lang === 'ja' ? '共有用URLをクリップボードにコピーしました！' : 'Share URL copied to clipboard!');
    });
  };

  const moveStep = useCallback((curr: MouseState, targetDir: Direction) => {
    let next = curr;
    // Rotate until facing targetDir
    while (next.direction !== targetDir) {
      const diff = (targetDir - next.direction + 4) % 4;
      if (diff === 3) next = SimulatorEngine.turnLeft(next, { straightCost, turnCost });
      else next = SimulatorEngine.turnRight(next, { straightCost, turnCost });
    }
    // Then move forward
    return SimulatorEngine.moveForward(next, maze, { straightCost, turnCost });
  }, [maze, straightCost, turnCost]);

  // Manual drive keyboard support (F-10 foundation)
  useEffect(() => {
    if (!maze || isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if an input, textarea, or the Monaco editor is focused
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.closest('.monaco-editor')
      ) {
        return;
      }

      // Prevent scrolling with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const getTargetDirByView = (curr: MouseState, key: string, is3D: boolean) => {
        if (is3D) {
          // Relative movement in 3D: Up=Forward, Right=Right, Down=Back, Left=Left
          const offset = 
            key === 'ArrowUp' ? 0 : 
            key === 'ArrowRight' ? 1 : 
            key === 'ArrowDown' ? 2 : 
            3; // ArrowLeft
          return (curr.direction + offset) % 4 as Direction;
        } else {
          // Absolute movement in 2D: Up=North, Right=East, Down=South, Left=West
          if (key === 'ArrowUp') return Direction.North;
          if (key === 'ArrowRight') return Direction.East;
          if (key === 'ArrowDown') return Direction.South;
          return Direction.West;
        }
      };

      if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.key)) {
        setInstances(prev => prev.map(inst => {
          const is3D = inst.viewMode === '3D';
          if (is3D) {
            // 3D Mode (Relative): Separation of rotation and movement
            let nextMouse = inst.mouse;
            if (e.key === 'ArrowUp') {
              nextMouse = SimulatorEngine.moveForward(inst.mouse, maze, { straightCost, turnCost });
            } else if (e.key === 'ArrowLeft') {
              nextMouse = SimulatorEngine.turnLeft(inst.mouse, { straightCost, turnCost });
            } else if (e.key === 'ArrowRight') {
              nextMouse = SimulatorEngine.turnRight(inst.mouse, { straightCost, turnCost });
            } else if (e.key === 'ArrowDown') {
              // U-turn (Turn 180 degrees - 2 turn actions)
              const firstTurn = SimulatorEngine.turnRight(inst.mouse, { straightCost, turnCost });
              nextMouse = SimulatorEngine.turnRight(firstTurn, { straightCost, turnCost });
            }
            return { ...inst, mouse: nextMouse };
          } else {
            // 2D Mode (Absolute): Traditional 'Press key to go that direction'
            return {
              ...inst,
              mouse: moveStep(inst.mouse, getTargetDirByView(inst.mouse, e.key, false))
            };
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maze, isPlaying, moveStep]);

  // Face Control Loop
  useEffect(() => {
    if (!isFaceControlEnabled || isPlaying) return;

    const interval = setInterval(() => {
      const cmd = faceCommandRef.current;
      if (cmd === 'none') return;

      setInstances(prev => prev.map(inst => {
        const is3D = inst.viewMode === '3D';
        if (is3D) {
          if (cmd === 'left') return { ...inst, mouse: SimulatorEngine.turnLeft(inst.mouse, { straightCost, turnCost }) };
          if (cmd === 'right') return { ...inst, mouse: SimulatorEngine.turnRight(inst.mouse, { straightCost, turnCost }) };
          if (cmd === 'forward') return { ...inst, mouse: SimulatorEngine.moveForward(inst.mouse, maze, { straightCost, turnCost }) };
          return inst;
        } else {
          // 2D Mode: Absolute turn and move (Forward command moves in current direction)
          let targetDir = inst.mouse.direction;
          if (cmd === 'left') targetDir = (inst.mouse.direction + 3) % 4;
          if (cmd === 'right') targetDir = (inst.mouse.direction + 1) % 4;
          return { ...inst, mouse: moveStep(inst.mouse, targetDir) };
        }
      }));
    }, 800 / speed); // Speed adjusted interval

    return () => clearInterval(interval);
  }, [isFaceControlEnabled, isPlaying, maze, straightCost, turnCost, speed, moveStep]);

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

  // Tutorial logic
  useEffect(() => {
    if (!activeLesson) return;
    const step = activeLesson.steps[currentStepIndex];
    if (!step.autoSetup) return;

    if (step.autoSetup.seed !== undefined) setSeed(step.autoSetup.seed);
    if (step.autoSetup.mazeSize !== undefined) {
      setMazeSize(step.autoSetup.mazeSize);
      handleReset();
    }
    if (step.autoSetup.algo !== undefined) {
      setInstances(prev => prev.map((inst, i) => i === 0 ? { ...inst, algo: step.autoSetup!.algo as any } : inst));
    }
    if (step.autoSetup.mousePos !== undefined) {
      setInstances(prev => prev.map((inst, i) => i === 0 ? { 
        ...inst, 
        mouse: { ...inst.mouse, x: step.autoSetup!.mousePos!.x, y: step.autoSetup!.mousePos!.y, direction: step.autoSetup!.mousePos!.dir } 
      } : inst));
    }
  }, [activeLesson, currentStepIndex]);

  const startTutorial = (lessonId: string) => {
    const lesson = TUTORIAL_LESSONS.find(l => l.id === lessonId);
    if (lesson) {
      setActiveLesson(lesson);
      setCurrentStepIndex(0);
      setIsCampaignMode(false);
      setIsEditMode(false);
      setIsSurvivalMode(false);
    }
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
      
      <div className="split-screen-container" data-count={instances.length}>
        {instances.map((inst, index) => (
          <div key={inst.id} className="simulator-panel glass">
            <div className="panel-header">
              <div style={{display: 'flex', alignItems: 'baseline', gap: '10px'}}>
                <h3 style={{color: '#fff', fontSize: '1rem', margin: 0}}>Algo {index + 1}</h3>
                <div style={{display: 'flex', gap: '4px'}}>
                  {instances.length < 4 && index === instances.length - 1 && (
                    <button onClick={addInstance} className="btn-outline" title={t.addAlgo || "Add"} style={{padding: '0px 6px', fontSize: '14px', height: '20px', lineHeight: '18px'}}>+</button>
                  )}
                  {instances.length > 1 && (
                    <button onClick={() => removeInstance(inst.id)} className="btn-outline" title={t.removeAlgo || "Remove"} style={{padding: '0px 6px', fontSize: '14px', height: '20px', lineHeight: '18px'}}>×</button>
                  )}
                </div>
              </div>
              
              <select 
                value={inst.algo} 
                onChange={(e) => updateInstance(inst.id, { algo: e.target.value as AlgorithmMode })} 
                className="size-select"
              >
                <option value="LeftHand">Left-Hand</option>
                <option value="RightHand">Right-Hand</option>
                <option value="FloodFill">{t.floodFill || 'Flood Fill'}</option>
                <option value="Centripetal">{t.centripetal || 'Centripetal'}</option>
                <option value="Custom">Custom (JS)</option>
              </select>
              <button 
                onClick={() => updateInstance(inst.id, { viewMode: inst.viewMode === '2D' ? '3D' : '2D' })} 
                className="btn-outline" 
                style={{padding: '2px 8px', fontSize: '11px', marginLeft: '8px'}}
              >
                {inst.viewMode === '2D' ? t.view3D : t.view2D}
              </button>
            </div>

            {inst.algo === 'Custom' && (
              <div style={{height: '250px', marginBottom: '10px', border: '1px solid #444', borderRadius: '4px', overflow: 'hidden'}}>
                <Editor 
                  defaultLanguage="javascript" 
                  theme="vs-dark" 
                  value={inst.customCode} 
                  onChange={(v: string | undefined) => updateInstance(inst.id, { customCode: v || '' })} 
                  options={{minimap: {enabled: false}, fontSize: 13, scrollBeyondLastLine: false}} 
                  beforeMount={handleEditorBeforeMount}
                />
              </div>
            )}

            {inst.error && <div style={{color: '#ff5252', fontSize: '12px', marginBottom: '10px', padding: '5px', backgroundColor: 'rgba(255,0,0,0.1)'}}>{inst.error}</div>}
            
            {maze && (inst.viewMode === '2D' ? (
              <MazeRenderer 
                maze={maze} 
                mouse={inst.mouse} 
                ghost={ghostMouse || undefined}
                onWallToggle={isEditMode ? handleWallToggle : undefined} 
                isSurvivalMode={isSurvivalMode}
                highlightCells={index === 0 && activeLesson ? activeLesson.steps[currentStepIndex].highlightCells : undefined}
              />
            ) : (
              <MazeRenderer3D 
                maze={maze} 
                mouse={inst.mouse} 
                ghost={ghostMouse || undefined}
                isSurvivalMode={isSurvivalMode}
              />
            ))}

            <div className="simulation-info">
              <div className="telemetry-main">
                <div className="stat-item">
                  <span className="stat-label">{t.totalCost}</span>
                  <span className="step-count">{inst.mouse.totalCost}</span>
                </div>
                {inst.duration !== null && <span className="duration-badge">⚡ {inst.duration.toFixed(2)}ms</span>}
              </div>
              
              <div className="telemetry-grid">
                <div className="stat-item mini">
                  <span className="stat-label">{t.steps}</span>
                  <span className="stat-value">{inst.mouse.stepCount}</span>
                </div>
                <div className="stat-item mini">
                  <span className="stat-label">{t.turns}</span>
                  <span className="stat-value">{inst.mouse.turnCount}</span>
                </div>
                <div className="stat-item mini">
                  <span className="stat-label">{t.efficiency}</span>
                  <span className="stat-value">{inst.mouse.totalCost > 0 ? ((optimalCost / inst.mouse.totalCost) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="stat-item mini optimal">
                  <span className="stat-label">{t.optimalCost}</span>
                  <span className="stat-value">{optimalCost}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
          <button 
            onClick={() => setIsFaceControlEnabled(!isFaceControlEnabled)} 
            className={isFaceControlEnabled ? "btn-primary" : "btn-outline"}
            style={{ position: 'relative' }}
          >
            {isFaceControlEnabled ? t.faceControlOn : t.faceControlOff}
            {isFaceControlEnabled && <span className="pulse-dot" style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff5252' }} />}
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
          <label>{t.speed} (TPS): </label>
          <input 
            type="number" 
            min={1} 
            max={100} 
            value={Math.round(speed)} 
            onChange={(e) => setSpeed(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="speed-select"
            style={{width: '80px'}}
          />
        </div>

        <div className="seed-info">{t.currentSeed}: {seed}</div>
      </div>

      <footer className="app-footer">
        {t.phase}
      </footer>

      <FaceController 
        enabled={isFaceControlEnabled} 
        lang={lang} 
        onCommand={(cmd) => { faceCommandRef.current = cmd; }} 
      />

      {activeLesson && (
        <TutorialCard 
          lesson={activeLesson}
          stepIndex={currentStepIndex}
          lang={lang}
          onNext={() => setCurrentStepIndex(prev => Math.min(prev + 1, activeLesson.steps.length - 1))}
          onBack={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
          onClose={() => setActiveLesson(null)}
          onJumpToStep={(idx) => setCurrentStepIndex(idx)}
        />
      )}

      <div style={{ position: 'fixed', bottom: '20px', left: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => startTutorial('basics')} 
          className="btn-primary" 
          style={{ borderRadius: '50px', padding: '10px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
        >
          {lang === 'ja' ? '🎓 チュートリアル：基本' : '🎓 Tutorial: Basics'}
        </button>
        <button 
          onClick={() => startTutorial('lefthand')} 
          className="btn-outline" 
          style={{ borderRadius: '50px', padding: '10px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          {lang === 'ja' ? '🎓 左手法' : '🎓 Left-Hand'}
        </button>
      </div>
    </div>
  );
}

export default App;
