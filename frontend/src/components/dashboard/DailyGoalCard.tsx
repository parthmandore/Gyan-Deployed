/**
 * Purpose: Gentle Daily Goal Card showing progress towards 3 daily activities without pressure.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BigTouchTarget } from '../BigTouchTarget';
import { Typography } from '../../theme/typography';
import { DailyGoalInfo } from '../../services/dashboardService';

interface DailyGoalCardProps {
  goal: DailyGoalInfo;
  onPressReward?: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ goal, onPressReward }) => {
  const target = goal.target || 3;
  const completed = goal.completed || 0;
  const isMet = goal.is_met;

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <Text style={[Typography.titleMedium, styles.goalTitle]}>
            Gentle Daily Goal 🎯
          </Text>
          <Text style={styles.goalSubtitle}>
            {isMet
              ? 'Superstar! Goal completed for today! 🌟'
              : `${completed} of ${target} activities explored today`}
          </Text>
          {isMet && onPressReward && (
            <BigTouchTarget
              onPress={onPressReward}
              style={styles.claimGoalBadge}
              accessibilityLabel="Claim completed goal reward"
              accessibilityRole="button"
            >
              <Text style={styles.claimGoalText}>🎁 CLAIM GOAL PERK!</Text>
            </BigTouchTarget>
          )}
        </View>

        {/* 3 Stars Progress Meter */}
        <View style={styles.starsRow}>
          {[1, 2, 3].map((starIndex) => {
            const hasStar = completed >= starIndex;
            return (
              <View
                key={starIndex}
                style={[styles.starBadge, hasStar && styles.starBadgeEarned]}
              >
                <Text style={styles.starIcon}>{hasStar ? '⭐' : '⚪'}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  goalTitle: {
    color: '#0F2042',
    fontWeight: '800',
  },
  goalSubtitle: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  starBadgeEarned: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  starIcon: {
    fontSize: 18,
  },
  claimGoalBadge: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignSelf: 'flex-start',
  },
  claimGoalText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
