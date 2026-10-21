/**
 * Purpose: Achievements & Badges Gallery for Child Dashboard with tap detail modal.
 *          Built as "🏆 MY TROPHY SHELF" with collectible medal objects,
 *          vibrant unlocked trophies, subtle locked silhouettes, and wooden shelf base.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native';
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
import { AchievementItem } from '../../services/dashboardService';
import { audioManager } from '../../services/audioManager';

interface AchievementsGalleryProps {
  achievements: AchievementItem[];
}

export const AchievementsGallery: React.FC<AchievementsGalleryProps> = ({
  achievements,
}) => {
  const { t } = useTranslation();
  const [selectedBadge, setSelectedBadge] = useState<AchievementItem | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleSelectBadge = (badge: AchievementItem) => {
    if (badge.unlocked) {
      audioManager.playCelebrationSound();
    } else {
      audioManager.playTapSound();
    }
    setSelectedBadge(badge);
  };

  return (
    <IslandPanel
      variant="frosted"
      elevation="floating"
      style={styles.islandContainer}
      padding="md"
    >
      {/* Header */}
      <SectionHeader
        title={t('dashboard.trophyShelf')}
        icon="🏆"
        badge={`⭐ ${unlockedCount} / ${achievements.length} ${t('dashboard.trophies')}`}
      />

      {/* Collectible Trophies Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfList}
      >
        {achievements.map((badge) => {
          const isUnlocked = badge.unlocked;

          return (
            <BigTouchTarget
              key={badge.id}
              onPress={() => handleSelectBadge(badge)}
              style={styles.trophyWrapper}
              accessibilityLabel={`${badge.title}, ${isUnlocked ? 'Unlocked' : 'Locked'}`}
              accessibilityRole="button"
            >
              {/* Collectible Trophy Object */}
              {isUnlocked ? (
                <LinearGradient
                  colors={['#FEF08A', '#FDE047', '#F59E0B']}
                  style={styles.trophyUnlockedRing}
                >
                  <Text style={styles.trophyEmoji}>{badge.icon || '⭐'}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.trophyLockedRing}>
                  <Text style={styles.trophyLockIcon}>🔒</Text>
                </View>
              )}

              {/* Title & Status */}
              <Text
                style={[
                  styles.trophyTitle,
                  !isUnlocked && styles.trophyTitleLocked,
                ]}
                numberOfLines={2}
              >
                {badge.title}
              </Text>

              <Text
                style={[
                  styles.trophyStatus,
                  isUnlocked ? styles.statusUnlocked : styles.statusLocked,
                ]}
              >
                {isUnlocked ? 'Unlocked!' : 'Locked'}
              </Text>
            </BigTouchTarget>
          );
        })}
      </ScrollView>

      {/* Visual Wooden/Golden Shelf Rail */}
      <View style={styles.shelfRail}>
        <LinearGradient
          colors={['#D97706', '#B45309', '#92400E']}
          style={styles.shelfRailGradient}
        />
      </View>

      {/* Trophy Detail Modal */}
      {selectedBadge && (
        <Modal
          visible={!!selectedBadge}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              {selectedBadge.unlocked ? (
                <LinearGradient
                  colors={['#FEF08A', '#FDE047', '#F59E0B']}
                  style={styles.modalMedalGlow}
                >
                  <Text style={styles.modalMedalEmoji}>
                    {selectedBadge.icon || '⭐'}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.modalMedalLocked}>
                  <Text style={styles.modalMedalLockIcon}>🔒</Text>
                </View>
              )}

              <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
              <Text style={styles.modalDescription}>
                {selectedBadge.description}
              </Text>

              <View
                style={[
                  styles.modalStatusBadge,
                  selectedBadge.unlocked
                    ? styles.modalStatusUnlocked
                    : styles.modalStatusLocked,
                ]}
              >
                <Text
                  style={[
                    styles.modalStatusText,
                    selectedBadge.unlocked
                      ? styles.modalStatusTextUnlocked
                      : styles.modalStatusTextLocked,
                  ]}
                >
                  {selectedBadge.unlocked
                    ? '🎉 UNLOCKED & COLLECTED!'
                    : '🔒 KEEP PLAYING TO UNLOCK!'}
                </Text>
              </View>

              <BigTouchTarget
                onPress={() => setSelectedBadge(null)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close trophy details"
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseText}>AWESOME! 🌟</Text>
              </BigTouchTarget>
            </View>
          </View>
        </Modal>
      )}
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  islandContainer: {
    marginBottom: WorldSpacing.sm,
  },

  /* Trophy Carousel */
  shelfList: {
    paddingVertical: 10,
    gap: 12,
  },
  trophyWrapper: {
    width: 84,
    alignItems: 'center',
  },
  trophyUnlockedRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 6,
  },
  trophyEmoji: {
    fontSize: 28,
  },
  trophyLockedRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginBottom: 6,
  },
  trophyLockIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  trophyTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  trophyTitleLocked: {
    color: '#94A3B8',
  },
  trophyStatus: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  statusUnlocked: {
    color: '#D97706',
  },
  statusLocked: {
    color: '#94A3B8',
  },

  /* Shelf Rail */
  shelfRail: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
  },
  shelfRailGradient: {
    flex: 1,
  },

  /* Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.island,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FDE047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalMedalGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  modalMedalEmoji: {
    fontSize: 40,
  },
  modalMedalLocked: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  modalMedalLockIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 18,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalDescription: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  modalStatusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: WorldRadii.pill,
    marginBottom: 16,
  },
  modalStatusUnlocked: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  modalStatusLocked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modalStatusText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    fontWeight: '700',
  },
  modalStatusTextUnlocked: {
    color: '#92400E',
  },
  modalStatusTextLocked: {
    color: '#64748B',
  },
  modalCloseBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: WorldRadii.pill,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
