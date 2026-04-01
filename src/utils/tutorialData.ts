import { Direction } from '../types/maze';
import type { Lesson } from '../types/tutorial';

export const TUTORIAL_LESSONS: Lesson[] = [
  {
    id: 'basics',
    title: 'tutorial.basics.title',
    steps: [
      {
        id: 'welcome',
        title: 'tutorial.basics.step1.title',
        text: 'tutorial.basics.step1.text',
        highlightCells: [{ x: 0, y: 0, color: 'rgba(76, 175, 80, 0.5)' }],
        autoSetup: { seed: 42, mazeSize: 8 }
      },
      {
        id: 'goal',
        title: 'tutorial.basics.step2.title',
        text: 'tutorial.basics.step2.text',
        highlightCells: [{ x: 3, y: 3, color: 'rgba(255, 215, 0, 0.5)' }],
        autoSetup: { mousePos: { x: 0, y: 0, dir: Direction.North } }
      },
      {
        id: 'manual_move',
        title: 'tutorial.basics.step3.title',
        text: 'tutorial.basics.step3.text',
        targetAction: 'move',
      }
    ]
  },
  {
    id: 'lefthand',
    title: 'tutorial.lefthand.title',
    steps: [
      {
        id: 'lh_concept',
        title: 'tutorial.lefthand.step1.title',
        text: 'tutorial.lefthand.step1.text',
        autoSetup: { algo: 'LeftHand', seed: 42, mazeSize: 16 }
      },
      {
        id: 'lh_step-by-step',
        title: 'tutorial.lefthand.step2.title',
        text: 'tutorial.lefthand.step2.text',
        highlightCells: [{ x: 0, y: 0, color: 'rgba(255, 82, 82, 0.3)' }],
        targetAction: 'next'
      },
      {
        id: 'lh_quiz',
        title: 'tutorial.lefthand.quiz1.title',
        text: 'tutorial.lefthand.quiz1.text',
        quiz: {
          question: 'tutorial.lefthand.quiz1.question',
          options: [
            { text: 'tutorial.lefthand.quiz1.opt1', isCorrect: true },
            { text: 'tutorial.lefthand.quiz1.opt2', isCorrect: false },
            { text: 'tutorial.lefthand.quiz1.opt3', isCorrect: false }
          ],
          hint: 'tutorial.lefthand.quiz1.hint'
        }
      }
    ]
  }
];
