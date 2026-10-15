/**
 * Purpose: Unified, accessible, celebratory Game Session Complete View for Gyannn.
 *          Implements Phase 4 standards:
 *          - Accurate score, correct items, accuracy, XP, and level
 *          - Short celebratory animation (CelebrationOverlay)
 *          - Explicit navigation actions: Play Again, Choose Another Game, Return to Dashboard
 *          - ResponsiveContainer, IslandPanel, and WorldTypography tokens
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

import { BigTouchTarget } from './BigTouchTarget';
import { CartoonBackground, CartoonBackgroundTheme } from './CartoonBackground';
import { ResponsiveContainer } from './ResponsiveContainer';
import { IslandPanel } from './IslandPanel';
import { PrimaryAdventureButton } from './PrimaryAdventureButton';
import { CelebrationOverlay } from './CelebrationOverlay';
import { LevelUpCelebrationModal } from './LevelUpCelebrationModal';
import { ProgressStarTrail } from './ProgressStarTrail';
import { AudioControlPill } from './AudioControlPill';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import { useProgressStore } from '../state/useProgressStore';
import { audioManager } from '../services/audioManager';

export interface GameSessionCompleteViewProps {
  gameTitle: string;
  starsEarned: number;
  itemsCorrect: number;
  sessionLength: number;
  accuracy: number;
  xpEarned: number;
  sessionResults?: Array<'correct' | 'wrong' | 'pending'>;
  onPlayAgain: () => void;
  onChooseGame: () => void;
  onReturnToDashboard: () => void;
  onViewReport?: () => void;
  isLoadingRewards?: boolean;
  bgTheme?: CartoonBackgroundTheme;
  leveledUp?: boolean;
}

export const GameSessionCompleteView: React.FC<GameSessionCompleteViewProps> = React.memo(
  ({
    gameTitle,
    starsEarned,
    itemsCorrect,
    sessionLength,
    accuracy,
    xpEarned,
    sessionResults,
    onPlayAgain,
    onChooseGame,
    onReturnToDashboard,
    onViewReport,
    isLoadingRewards = false,
    bgTheme = 'evening',
    leveledUp = false,
  }) => {
    const { t } = useTranslation();
    const { width: screenWidth } = useWindowDimensions();

    const totalXp = useProgressStore((s) => s.totalXp);
    const currentLevel = useProgressStore((s) => s.currentLevel);

    const [showCelebration, setShowCelebration] = useState(true);
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);

    useEffect(() => {
      if (leveledUp) {
        const timer = setTimeout(() => {
          setShowLevelUpModal(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }, [leveledUp]);

    const cardScale = useSharedValue(0.9);
    const cardOpacity = useSharedValue(0);
    const buttonsOpacity = useSharedValue(0);

    useEffect(() => {
      audioManager.playCelebrationSound();
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      buttonsOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));

      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2500);

      return () => clearTimeout(timer);
    }, [cardOpacity, cardScale, buttonsOpacity]);

    const cardAnimStyle = useAnimatedStyle(() => ({
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
    }));

    const buttonsAnimStyle = useAnimatedStyle(() => ({
      opacity: buttonsOpacity.value,
    }));

    const handlePlayAgainPress = () => {
      audioManager.playTapSound();
      onPlayAgain();
    };

    const handleChooseGamePress = () => {
      audioManager.playTapSound();
      onChooseGame();
    };

    const handleReturnToDashboardPress = () => {
      audioManager.playTapSound();
      onReturnToDashboard();
    };

    const starsDisplay =
      starsEarned >= 3 ? '⭐⭐⭐' : starsEarned === 2 ? '⭐⭐' : '⭐';

    const encouragement =
      accuracy >= 80 || starsEarned >= 3
        ? t('sessionComplete.amazingWork', 'Outstanding Work! 🌟')
        : accuracy >= 50
        ? t('sessionComplete.greatEffort', 'Great Effort! 🚀')
        : t('sessionComplete.keepPracticing', 'Keep Exploring! 💡');

    return (
      <View style={styles.rootContainer}>
        {/* Background Environment */}
        <CartoonBackground theme={bgTheme} />

        {/* Celebration Particles */}
        <CelebrationOverlay visible={showCelebration} />

        {/* Level Up Celebration Modal */}
        <LevelUpCelebrationModal
          visible={showLevelUpModal}
          newLevel={currentLevel}
          totalXp={totalXp}
          onDismiss={() => setShowLevelUpModal(false)}
        />

        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#1B2B5A" />

          <ResponsiveContainer maxWidth="standard" padding="sm">
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Animated Main Reward Island */}
              <Animated.View style={[styles.mainWrapper, cardAnimStyle]}>
                {/* Floating Top Audio Controls */}
                <View style={styles.topControlRow}>
                  <AudioControlPill compact />
                </View>

                {/* Header Title & Stars */}
                <View style={styles.headerBox}>
                  <Text style={styles.starsText}>{starsDisplay}</Text>
                  <Text style={styles.praiseTitle} numberOfLines={1}>
                    {encouragement}
                  </Text>
                  <Text style={styles.gameTitleText} numberOfLines={1}>
                    {gameTitle}
                  </Text>
                </View>

                {/* Tactile Frosted Island Panel */}
                <IslandPanel
                  variant="frosted"
                  elevation="floating"
                  style={styles.statsIsland}
                  padding="md"
                >
                  {/* Progress Star Trail */}
                  {sessionResults && sessionResults.length > 0 && (
                    <View style={styles.trailRow}>
                      <ProgressStarTrail
                        current={sessionResults.length}
                        total={sessionLength}
                        roundResults={sessionResults}
                      />
                    </View>
                  )}

                  {/* 3 Core Accuracy & Reward Metrics */}
                  <View style={styles.metricsRow}>
                    {/* XP Earned */}
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>+{xpEarned}</Text>
                      <Text style={styles.metricLabel}>
                        {t('common.xpEarned', 'XP Earned')}
                      </Text>
                    </View>

                    <View style={styles.metricDivider} />

                    {/* Correct Answers */}
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>
                        {itemsCorrect}/{sessionLength}
                      </Text>
                      <Text style={styles.metricLabel}>
                        {t('common.correct', 'Correct')}
                      </Text>
                    </View>

                    <View style={styles.metricDivider} />

                    {/* Accuracy Percentage */}
                    <View style={styles.metricCell}>
                      <Text style={styles.metricValue}>{accuracy}%</Text>
                      <Text style={styles.metricLabel}>
                        {t('common.accuracy', 'Accuracy')}
                      </Text>
                    </View>
                  </View>

                  {/* Level & Total XP Badge Banner */}
                  <View style={styles.levelBanner}>
                    <Text style={styles.levelBannerText}>
                      🏆 Level {currentLevel} • Total {totalXp} XP
                    </Text>
                  </View>
                </IslandPanel>

                {/* Optional Detailed Report Button */}
                {onViewReport && (
                  <BigTouchTarget
                    onPress={onViewReport}
                    accessibilityLabel="View Detailed Question Report"
                    accessibilityRole="button"
                    style={styles.viewReportButton}
                  >
                    <Text style={styles.viewReportButtonText}>
                      📋 {t('common.viewReport', 'View Detailed Report')}
                    </Text>
                  </BigTouchTarget>
                )}

                {/* Required 3 Actions: Play Again, Choose Game, Dashboard */}
                <Animated.View style={[styles.actionsWrapper, buttonsAnimStyle]}>
                  {/* Action 1: Play Again */}
                  <PrimaryAdventureButton
                    label={`▶ ${t('sessionComplete.playAgain', 'Play Again')}`}
                    onPress={handlePlayAgainPress}
                    variant="primary"
                    accessibilityLabel={t('sessionComplete.playAgain', 'Play Again')}
                    style={styles.primaryBtn}
                  />

                  {/* Action 2: Choose Another Game */}
                  <PrimaryAdventureButton
                    label={`🎮 ${t('sessionComplete.chooseGame', 'Choose Another Game')}`}
                    onPress={handleChooseGamePress}
                    variant="secondary"
                    accessibilityLabel={t('sessionComplete.chooseGame', 'Choose Another Game')}
                    style={styles.secondaryBtn}
                  />

                  {/* Action 3: Return to Dashboard */}
                  <BigTouchTarget
                    onPress={handleReturnToDashboardPress}
                    accessibilityLabel={t('navigation.dashboard', 'Return to Dashboard')}
                    accessibilityRole="button"
                    style={styles.dashboardBtn}
                  >
                    <Text style={styles.dashboardBtnText}>
                      🏠 {t('navigation.dashboard', 'Return to Dashboard')}
                    </Text>
                  </BigTouchTarget>
                </Animated.View>
              </Animated.View>
            </ScrollView>
          </ResponsiveContainer>
        </SafeAreaView>
      </View>
    );
  }
);

GameSessionCompleteView.displayName = 'GameSessionCompleteView';

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#1B2B5A',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: WorldSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  mainWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  topControlRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: WorldSpacing.sm,
  },
  starsText: {
    fontSize: 40,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  praiseTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameTitleText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    textAlign: 'center',
  },
  statsIsland: {
    width: '100%',
    marginVertical: WorldSpacing.sm,
    alignItems: 'center',
  },
  trailRow: {
    marginBottom: WorldSpacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: WorldSpacing.xs,
  },
  metricCell: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 20,
    color: WorldPalettes.text.primary,
  },
  metricLabel: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: WorldPalettes.text.muted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  levelBanner: {
    marginTop: WorldSpacing.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  levelBannerText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    color: '#92400E',
  },
  viewReportButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginVertical: WorldSpacing.xs,
  },
  viewReportButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    color: '#1D4ED8',
  },
  actionsWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: WorldSpacing.sm,
  },
  primaryBtn: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
  },
  dashboardBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  dashboardBtnText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 13,
    color: WorldPalettes.text.secondary,
  },
});
