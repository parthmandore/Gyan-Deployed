/**
 * Purpose: Personalized Next Game Recommendation Card ("✨ YOUR NEXT QUEST").
 *          Provides high-priority next adventure recommendation based on actual progress.
 *          Styled as a cosmic discovery island with Level 3 PrimaryAdventureButton.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { IslandPanel } from '../IslandPanel';
import { PrimaryAdventureButton } from '../PrimaryAdventureButton';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../../theme/tokens';
import { ContinueLearningInfo } from '../../services/dashboardService';

interface ContinueLearningCardProps {
  recommendation: ContinueLearningInfo;
  onPlayNow: () => void;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({
  recommendation,
  onPlayNow,
}) => {
  const { t } = useTranslation();

  return (
    <IslandPanel
      variant="twilight"
      elevation="glowing"
      style={styles.cardContainer}
      padding="none"
    >
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#3730A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Header Tags */}
        <View style={styles.headerRow}>
          <View style={styles.questTagPill}>
            <Text style={styles.questTagText}>✨ {t('dashboard.nextQuest')}</Text>
          </View>

          <View style={styles.durationPill}>
            <Text style={styles.durationText}>⏱️ {t('dashboard.fiveMins')}</Text>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.bodyRow}>
          {/* Game Icon Halo */}
          <View style={styles.iconHalo}>
            <Text style={styles.gameIcon}>{recommendation.icon || '🎮'}</Text>
          </View>

          {/* Titles & Category */}
          <View style={styles.infoCol}>
            <Text style={styles.skillCategory} numberOfLines={1}>
              {recommendation.skill_title || 'Adventure Quest'}
            </Text>
            <Text style={styles.gameTitle} numberOfLines={2}>
              {recommendation.title}
            </Text>
            <Text style={styles.promptSubtitle}>
              {t('dashboard.tapToPractice')}
            </Text>
          </View>
        </View>

        {/* Level 3 Tactile CTA Button */}
        <View style={styles.actionRow}>
          <PrimaryAdventureButton
            label={t('dashboard.startQuest')}
            variant="success"
            size="md"
            onPress={onPlayNow}
            accessibilityLabel={`Start quest: ${recommendation.title}`}
          />
        </View>
      </LinearGradient>
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: WorldSpacing.sm,
  },
  cardGradient: {
    padding: WorldSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questTagPill: {
    backgroundColor: 'rgba(253, 224, 71, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#FDE047',
  },
  questTagText: {
    color: '#FEF08A',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  durationPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: WorldRadii.pill,
  },
  durationText: {
    color: '#E0E7FF',
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 10,
    fontWeight: '600',
  },

  /* Body Content */
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: '#818CF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gameIcon: {
    fontSize: 28,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  skillCategory: {
    color: '#A5B4FC',
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gameTitle: {
    color: '#FFFFFF',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.cardTitle,
    fontWeight: '700',
    marginTop: 1,
  },
  promptSubtitle: {
    color: '#C7D2FE',
    fontFamily: WorldTypography.fonts.regular,
    fontSize: WorldTypography.sizes.caption,
    marginTop: 2,
  },
  actionRow: {
    width: '100%',
  },
});
