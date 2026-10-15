/**
 * Purpose: Service layer for fetching reward/XP summary dynamically from local store or Backend API.
 * Module: Services
 * Folder: frontend/src/services
 */

import { useProgressStore } from '../state/useProgressStore';
import { calculateLevelProgress } from '../config/xpConfig';

export interface RewardsSummaryData {
  xp_total: number;
  level: number;
  xp_earned_in_level: number;
  xp_to_next_level: number;
}

export interface RewardsSummaryResponse {
  success: boolean;
  data: RewardsSummaryData;
}

/**
 * Returns the current student's XP and Level summary directly from local storage.
 * Eliminates unnecessary offline network round-trips and console error noise.
 */
export const fetchRewardsSummary = async (): Promise<RewardsSummaryResponse> => {
  const store = useProgressStore.getState();
  const info = calculateLevelProgress(store.totalXp);

  return {
    success: true,
    data: {
      xp_total: info.totalXp,
      level: info.currentLevel,
      xp_earned_in_level: info.xpInCurrentLevel,
      xp_to_next_level: info.xpToNextLevel,
    },
  };
};
