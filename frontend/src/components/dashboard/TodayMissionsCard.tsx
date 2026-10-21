/**
 * Purpose: Today's Journey 3-mission tracker component for Child Dashboard.
 *          Built as an illustrated Discovery Parchment panel (Level 2 Island)
 *          with distinct visual states (COMPLETED, CURRENT, LOCKED),
 *          zero text truncation, and celebratory mystery chest trigger.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { BigTouchTarget } from '../BigTouchTarget';
import { IslandPanel } from '../IslandPanel';
import { SectionHeader } from '../SectionHeader';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../../theme/tokens';
import { TodayMission } from '../../services/dashboardService';

interface TodayMissionsCardProps {
  missions: TodayMission[];
  onSelectMission?: (mission: TodayMission) => void;
  onPressReward?: () => void;
}

export const TodayMissionsCard: React.FC<TodayMissionsCardProps> = ({
  missions,
  onSelectMission,
  onPressReward,
}) => {
  const { t } = useTranslation();
  const completedCount = missions.filter((m) => m.status === 'completed').length;
  const totalMissions = missions.length || 3;
  const isAllCompleted = completedCount >= totalMissions;

  return (
    <IslandPanel
      variant="parchment"
      elevation="floating"
      style={styles.questBoard}
      padding="md"
    >
      {/* Quest Board Header */}
      <SectionHeader
        title={t('dashboard.todaysAdventure')}
        icon="🗺️"
        badge={`🌟 ${completedCount} / ${totalMissions} ${t('dashboard.quests')}`}
      />

      {/* Mystery Reward Chest Banner */}
      <BigTouchTarget
        onPress={onPressReward}
        style={[
          styles.rewardBanner,
          isAllCompleted ? styles.rewardBannerCelebration : styles.rewardBannerStandard,
        ]}
        accessibilityLabel="Open mystery reward chest"
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.rewardBannerText,
            isAllCompleted && styles.rewardBannerTextCelebration,
          ]}
        >
          {isAllCompleted
            ? '🎉 ALL 3 QUESTS DONE! TAP TO OPEN MYSTERY CHEST! 🎁'
            : `🎯 ${t('dashboard.mysteryChestPrompt')}`}
        </Text>
      </BigTouchTarget>

      {/* 3 Quest Tiles with Distinct Visual States */}
      <View style={styles.missionsList}>
        {missions.map((mission, index) => {
          const isCompleted = mission.status === 'completed';
          const isCurrent = mission.status === 'current';
          const isLocked = !isCompleted && !isCurrent;

          return (
            <BigTouchTarget
              key={mission.id || index}
              onPress={() => {
                if (!isLocked && onSelectMission) {
                  onSelectMission(mission);
                }
              }}
              style={[
                styles.questTile,
                isCompleted && styles.questTileCompleted,
                isCurrent && styles.questTileCurrent,
                isLocked && styles.questTileLocked,
              ]}
              accessibilityLabel={`${mission.title}, status: ${mission.status}`}
              accessibilityRole="button"
              disabled={isLocked}
            >
              {/* Left Step Status Node */}
              <View
                style={[
                  styles.statusNode,
                  isCompleted && styles.statusNodeCompleted,
                  isCurrent && styles.statusNodeCurrent,
                  isLocked && styles.statusNodeLocked,
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.nodeCheck}>✓</Text>
                ) : isCurrent ? (
                  <Text style={styles.nodeCurrentNum}>{index + 1}</Text>
                ) : (
                  <Text style={styles.nodeLock}>🔒</Text>
                )}
              </View>

              {/* Quest Details (Free-flowing, NO truncation) */}
              <View style={styles.questDetails}>
                <View style={styles.questTitleRow}>
                  <Text style={styles.questIcon}>{mission.icon || '🎮'}</Text>
                  <Text
                    style={[
                      styles.questTitle,
                      isCompleted && styles.questTitleCompleted,
                      isCurrent && styles.questTitleCurrent,
                      isLocked && styles.questTitleLocked,
                    ]}
                    numberOfLines={2}
                  >
                    {mission.title}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.questStatusSubtext,
                    isCompleted && styles.subtextCompleted,
                    isCurrent && styles.subtextCurrent,
                    isLocked && styles.subtextLocked,
                  ]}
                >
                  {isCompleted
                    ? `✓ ${t('dashboard.completed')}`
                    : isCurrent
                    ? t('dashboard.tapToPlay')
                    : `🔒 ${t('dashboard.locked')}`}
                </Text>
              </View>

              {/* Right Action Badge for Current Quest */}
              {isCurrent && (
                <View style={styles.playActionPill}>
                  <LinearGradient
                    colors={['#4F46E5', '#4338CA']}
                    style={styles.playGradient}
                  >
                    <Text style={styles.playActionText}>{t('common.play')}</Text>
                  </LinearGradient>
                </View>
              )}
            </BigTouchTarget>
          );
        })}
      </View>
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  questBoard: {
    marginBottom: WorldSpacing.sm,
  },

  /* Mystery Reward Banner */
  rewardBanner: {
    borderRadius: WorldRadii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBannerStandard: {
    backgroundColor: 'rgba(254, 240, 138, 0.6)',
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  rewardBannerCelebration: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rewardBannerText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
    textAlign: 'center',
  },
  rewardBannerTextCelebration: {
    color: '#B45309',
    fontSize: 12,
  },

  /* Quests List */
  missionsList: {
    gap: 8,
  },
  questTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: WorldRadii.md,
    borderWidth: 2,
  },

  /* State 1: Completed */
  questTileCompleted: {
    backgroundColor: 'rgba(240, 253, 244, 0.9)',
    borderColor: '#86EFAC',
  },
  statusNodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  nodeCheck: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  questTitleCompleted: {
    color: '#166534',
  },
  subtextCompleted: {
    color: '#15803D',
    fontWeight: '700',
  },

  /* State 2: Current (Hero Quest) */
  questTileCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  statusNodeCurrent: {
    backgroundColor: '#4F46E5',
    borderColor: '#3730A3',
  },
  nodeCurrentNum: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  questTitleCurrent: {
    color: WorldPalettes.text.primary,
    fontWeight: '700',
  },
  subtextCurrent: {
    color: '#4F46E5',
    fontWeight: '700',
  },

  /* State 3: Locked */
  questTileLocked: {
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  statusNodeLocked: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  nodeLock: {
    fontSize: 12,
  },
  questTitleLocked: {
    color: '#64748B',
  },
  subtextLocked: {
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Node Circle */
  statusNode: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: 10,
  },

  /* Quest Content */
  questDetails: {
    flex: 1,
    minWidth: 0,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  questIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  questTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  questStatusSubtext: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    marginTop: 1,
  },

  /* Play Button on Current Quest */
  playActionPill: {
    marginLeft: 8,
    borderRadius: WorldRadii.pill,
    overflow: 'hidden',
  },
  playGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: WorldRadii.pill,
  },
  playActionText: {
    color: '#FFFFFF',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
