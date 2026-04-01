import { Direction } from './maze';

export interface TutorialQuiz {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  hint: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  highlightCells?: { x: number; y: number; color?: string }[];
  targetAction?: 'play' | 'next' | 'reset' | 'move' | 'edit';
  autoSetup?: {
    seed?: number;
    mazeSize?: number;
    algo?: string;
    mousePos?: { x: number; y: number; dir: Direction };
    walls?: { x: number; y: number; dir: Direction; exists: boolean }[];
  };
  quiz?: TutorialQuiz;
}

export interface Lesson {
  id: string;
  title: string;
  steps: TutorialStep[];
}
