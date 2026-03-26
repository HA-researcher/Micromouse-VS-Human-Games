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
    phase: 'Phase 1: Foundation & Core Simulation',
    importMaz: '📁 Load .maz',
    exportMaz: '💾 Save .maz',
    invalidMaz: 'Invalid .maz file format.'
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
    phase: 'フェーズ 1: 基盤とコア・シミュレーション',
    importMaz: '📁 .maz 読込',
    exportMaz: '💾 .maz 保存',
    invalidMaz: '無効な .maz ファイル形式です。'
  }
};
