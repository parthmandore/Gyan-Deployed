/**
 * Purpose: Recent Activity Feed component for Child Dashboard.
 *          Built as an "Adventure Trail" vertical timeline with connecting path,
 *          milestone nodes, stars, and golden XP badges.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IslandPanel } from '../IslandPanel';
import { SectionHeader } from '../SectionHeader';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../../theme/tokens';
import { RecentActivityItem } from '../../services/dashboardService';

interface RecentActivityListProps {
  activities: RecentActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <IslandPanel
        variant="frosted"
        elevation="floating"
        style={styles.islandContainer}
        padding="md"
      >
        <SectionHeader title="ADVENTURE TRAIL" icon="📜" />
        <View style={styles.emptyTrailBox}>
          <Text style={styles.emptyTrailIcon}>🌱</Text>
          <Text style={styles.emptyTrailTitle}>Your adventure trail begins here!</Text>
          <Text style={styles.emptyTrailSubtext}>
            Complete your first quest today to leave your footprints on the trail! 🐾
          </Text>
        </View>
      </IslandPanel>
    );
  }

  return (
    <IslandPanel
      variant="frosted"
      elevation="floating"
      style={styles.islandContainer}
      padding="md"
    >
      {/* Header */}
      <SectionHeader
        title="ADVENTURE TRAIL"
        icon="📜"
        badge="Recent Quests"
      />

      {/* Vertical Timeline Path */}
      <View style={styles.trailContainer}>
        {activities.map((item, index) => {
          const isLast = index === activities.length - 1;
          const starsCount = Math.max(1, Math.min(3, item.stars || 1));

          return (
            <View key={`${item.game_id}_${index}`} style={styles.trailRow}>
              {/* Left Column: Milestone Node + Vertical Connecting Line */}
              <View style={styles.pathCol}>
                <View style={styles.milestoneNode}>
                  <Text style={styles.milestoneIcon}>{item.icon || '🕹️'}</Text>
                </View>
                {!isLast && <View style={styles.connectingLine} />}
              </View>

              {/* Right Column: Activity Card */}
              <View style={styles.activityCard}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {item.accuracy}% Accuracy • {'⭐'.repeat(starsCount)}
                  </Text>
                </View>

                {/* Golden XP Badge */}
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeText}>+{item.xp_awarded} XP</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  islandContainer: {
    marginBottom: WorldSpacing.sm,
  },
  emptyTrailBox: {
    padding: WorldSpacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    borderRadius: WorldRadii.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  emptyTrailIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTrailTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.body,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    marginBottom: 4,
  },
  emptyTrailSubtext: {
    fontFamily: WorldTypography.fonts.regular,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.muted,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* Vertical Timeline */
  trailContainer: {
    marginTop: 4,
  },
  trailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pathCol: {
    alignItems: 'center',
    width: 36,
    marginRight: 8,
  },
  milestoneNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneIcon: {
    fontSize: 16,
  },
  connectingLine: {
    width: 2,
    height: 36,
    backgroundColor: '#C7D2FE',
    marginVertical: 2,
  },
  activityCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  activityTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 13,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
  },
  activityMeta: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: WorldPalettes.text.muted,
    marginTop: 2,
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: WorldRadii.pill,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  xpBadgeText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
});
