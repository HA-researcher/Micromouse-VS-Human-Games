export interface Stage {
  id: string;
  name: { ja: string; en: string };
  seed: number;
  size: number;
}

export const STAGES: Stage[] = [
  {
    id: 'stage_1',
    name: { ja: 'ステージ 1: はじめての探索', en: 'Stage 1: First Exploration' },
    seed: 42,
    size: 8,
  },
  {
    id: 'stage_2',
    name: { ja: 'ステージ 2: 迷路の森', en: 'Stage 2: Maze Forest' },
    seed: 123,
    size: 16,
  },
  {
    id: 'stage_3',
    name: { ja: 'ステージ 3: 複雑な小道', en: 'Stage 3: Complex Path' },
    seed: 777,
    size: 16,
  },
  {
    id: 'stage_4',
    name: { ja: 'ステージ 4: ハーフサイズへの挑戦', en: 'Stage 4: Half-size Challenge' },
    seed: 456,
    size: 32,
  },
  {
    id: 'stage_5',
    name: { ja: '最終試練: 王の迷宮', en: 'Final Trial: King\'s Labyrinth' },
    seed: 999,
    size: 32,
  },
];
