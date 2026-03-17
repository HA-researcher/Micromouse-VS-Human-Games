export type Language = 'en' | 'ja';

export const translations = {
  en: {
    title: 'Micromouse Visualizer V2',
    generateMaze: '🎲 Random Maze',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    stepForward: 'Next',
    stepBackward: 'Back',
    speed: 'Speed',
    step: 'Step',
    currentSeed: 'Current Seed',
    statusRunning: '▶ RUNNING',
    statusPaused: '⏸ PAUSED',
    phase: 'Phase 1: Foundation & Core Simulation'
  },
  ja: {
    title: 'マイクロマウス・ビジュアライザ V2',
    generateMaze: '🎲 迷路再生成',
    play: '再生',
    pause: '停止',
    reset: 'リセット',
    stepForward: 'コマ送り',
    stepBackward: '戻る',
    speed: '再生速度',
    step: 'ステップ',
    currentSeed: '現在のシード値',
    statusRunning: '▶ 実行中',
    statusPaused: '⏸ 停止中',
    phase: 'フェーズ 1: 基盤とコア・シミュレーション'
  }
};
