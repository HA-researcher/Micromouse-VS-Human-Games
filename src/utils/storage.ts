export interface SaveData {
  campaign_progress: string[]; // List of cleared stage IDs
  best_costs: Record<string, number>; // stageId -> bestCost
}

const SAVE_KEY = 'mm_visualizer_v2_save_data';

export const loadSaveData = (): SaveData => {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return { campaign_progress: [], best_costs: {} };
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse save data:', e);
    return { campaign_progress: [], best_costs: {} };
  }
};

export const saveProgress = (stageId: string, cost: number): SaveData => {
  const data = loadSaveData();
  
  if (!data.campaign_progress.includes(stageId)) {
    data.campaign_progress.push(stageId);
  }

  const currentBest = data.best_costs[stageId];
  if (currentBest === undefined || cost < currentBest) {
    data.best_costs[stageId] = cost;
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  return data;
};
