/**
 * Purpose: Service layer for fetching achievement/badge data dynamically from local store.
 *          Calculates real badges earned based on actual child gameplay and milestones.
 * Module: Services
 * Folder: frontend/src/services
 */

import { useProgressStore } from '../state/useProgressStore';

export interface EarnedBadge {
  badge_id: string;
  earned_at: string; // ISO 8601 date string
}

export interface AvailableBadge {
  badge_id: string;
  description_key: string;
}

export interface AchievementsData {
  earned: EarnedBadge[];
  available: AvailableBadge[];
}

export interface AchievementsResponse {
  success: boolean;
  data: AchievementsData;
}

/**
 * Returns real earned and available achievements calculated from the child's actual progress.
 */
export const fetchAchievements = async (userId?: string): Promise<AchievementsResponse> => {
  const store = useProgressStore.getState();
  const history = store.history || [];
  const completedGames = store.completedGamesCount || 0;
  const totalXp = store.totalXp || 0;
  const totalStars = store.totalStars || 0;

  const earned: EarnedBadge[] = [];

  // 1. First Game Completed
  if (completedGames >= 1) {
    const firstSession = history[history.length - 1];
    earned.push({
      badge_id: 'first_game',
      earned_at: firstSession ? new Date(firstSession.timestamp).toISOString() : new Date().toISOString(),
    });
  }

  // 2. Perfect Round (100% accuracy in any session)
  const perfectSession = history.find((h) => h.accuracy >= 100);
  if (perfectSession) {
    earned.push({
      badge_id: 'perfect_round',
      earned_at: new Date(perfectSession.timestamp).toISOString(),
    });
  }

  // 3. Quick Learner (50+ XP earned)
  if (totalXp >= 50) {
    earned.push({
      badge_id: 'quick_learner',
      earned_at: new Date().toISOString(),
    });
  }

  // 4. Star Collector (15+ Stars earned)
  if (totalStars >= 15) {
    earned.push({
      badge_id: 'star_collector',
      earned_at: new Date().toISOString(),
    });
  }

  // 5. Letter Master (3+ Letter/Alphabet games completed)
  const letterGames = history.filter(
    (h) => h.gameId.includes('alphabet') || h.gameId.includes('letter') || h.gameId.includes('word')
  );
  if (letterGames.length >= 3) {
    earned.push({
      badge_id: 'letter_master',
      earned_at: new Date().toISOString(),
    });
  }

  const earnedIds = new Set(earned.map((b) => b.badge_id));

  const allPossibleBadges: AvailableBadge[] = [
    { badge_id: 'first_game', description_key: 'badge.first_game' },
    { badge_id: 'perfect_round', description_key: 'badge.perfect_round' },
    { badge_id: 'quick_learner', description_key: 'badge.quick_learner' },
    { badge_id: 'star_collector', description_key: 'badge.star_collector' },
    { badge_id: 'letter_master', description_key: 'badge.letter_master' },
    { badge_id: 'reading_streak_7', description_key: 'badge.reading_streak_7' },
    { badge_id: 'math_whiz', description_key: 'badge.math_whiz' },
    { badge_id: 'champion', description_key: 'badge.champion' },
  ];

  const available = allPossibleBadges.filter((b) => !earnedIds.has(b.badge_id));

  return {
    success: true,
    data: {
      earned,
      available,
    },
  };
};
