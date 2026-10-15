/**
 * Purpose: Unified, child-friendly Game Intro Card for Gyannn ("The Living Learning World").
 *          Provides clear, age-appropriate 3-step learning guidance:
 *          1. What to do (objective)
 *          2. How to play (interaction gesture)
 *          3. How to win (success state & rewards)
 *          Includes accessible back button, companion mascot, and tactile 3D start CTA.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BigTouchTarget } from './BigTouchTarget';
import { CartoonBackground, CartoonBackgroundTheme } from './CartoonBackground';
import { ResponsiveContainer } from './ResponsiveContainer';
import { IslandPanel } from './IslandPanel';
import { PrimaryAdventureButton } from './PrimaryAdventureButton';
import { MascotCharacter } from './MascotCharacter';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import { audioManager } from '../services/audioManager';

export interface GameIntroCardProps {
  gameTitle: string;
  gameDescription: string;
  realmName?: string;
  realmIcon?: string;
  whatToDo: string;
  howToPlay: string;
  howToWin: string;
  onStart: () => void;
  onBack?: () => void;
  onOpenTutorial?: () => void;
  bgTheme?: CartoonBackgroundTheme;
}

export const GameIntroCard: React.FC<GameIntroCardProps> = React.memo(
  ({
    gameTitle,
    gameDescription,
    realmName,
    realmIcon,
    whatToDo,
    howToPlay,
    howToWin,
    onStart,
    onBack,
    onOpenTutorial,
    bgTheme = 'hub',
  }) => {
    const { t } = useTranslation();

    const handleStartPress = () => {
      audioManager.playTapSound();
      onStart();
    };

    const handleBackPress = () => {
      audioManager.playTapSound();
      if (onBack) onBack();
    };

    const handleTutorialPress = () => {
      audioManager.playTapSound();
      if (onOpenTutorial) onOpenTutorial();
    };

    return (
      <View style={styles.rootContainer}>
        {/* Living World Background */}
        <CartoonBackground theme={bgTheme} />

        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#0E7490" />

          <ResponsiveContainer maxWidth="standard" padding="sm">
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              {onBack && (
                <BigTouchTarget
                  onPress={handleBackPress}
                  accessibilityLabel={t('common.back', 'Back')}
                  accessibilityRole="button"
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← {t('common.back', 'Back')}</Text>
                </BigTouchTarget>
              )}

              {realmName && (
                <View style={styles.realmPill}>
                  <Text style={styles.realmPillText}>
                    {realmIcon ? `${realmIcon} ` : ''}{realmName}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Frosted Island Presentation */}
              <IslandPanel
                variant="frosted"
                elevation="floating"
                style={styles.introIsland}
                padding="md"
              >
                {/* Companion Mascot */}
                <View style={styles.mascotWrapper}>
                  <MascotCharacter state="encouraging" style={styles.mascot} />
                </View>

                {/* Title & Description */}
                <Text style={styles.titleText}>{gameTitle}</Text>
                <Text style={styles.descriptionText}>{gameDescription}</Text>

                {/* 3-Step Child Guidance Cards */}
                <View style={styles.guidanceBox}>
                  {/* Step 1: Objective */}
                  <View style={styles.stepRow}>
                    <View style={[styles.stepIconBubble, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={styles.stepIcon}>🎯</Text>
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text style={styles.stepHeading}>
                        {t('intro.goal', 'Goal')}
                      </Text>
                      <Text style={styles.stepBody}>{whatToDo}</Text>
                    </View>
                  </View>

                  {/* Step 2: How to Interact */}
                  <View style={styles.stepRow}>
                    <View style={[styles.stepIconBubble, { backgroundColor: '#ECFDF5' }]}>
                      <Text style={styles.stepIcon}>👆</Text>
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text style={styles.stepHeading}>
                        {t('intro.howToPlay', 'How to Play')}
                      </Text>
                      <Text style={styles.stepBody}>{howToPlay}</Text>
                    </View>
                  </View>

                  {/* Step 3: Success & Reward */}
                  <View style={styles.stepRow}>
                    <View style={[styles.stepIconBubble, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={styles.stepIcon}>⭐</Text>
                    </View>
                    <View style={styles.stepTextCol}>
                      <Text style={styles.stepHeading}>
                        {t('intro.success', 'Success')}
                      </Text>
                      <Text style={styles.stepBody}>{howToWin}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions: Start Quest & Optional Tutorial */}
                <View style={styles.actionButtonsCol}>
                  <PrimaryAdventureButton
                    label={`▶ ${t('game.play', 'Start Quest')}`}
                    onPress={handleStartPress}
                    variant="primary"
                    accessibilityLabel={t('game.play', 'Start Quest')}
                    style={styles.startBtn}
                  />

                  {onOpenTutorial && (
                    <BigTouchTarget
                      onPress={handleTutorialPress}
                      accessibilityLabel={t('capitalSmallMatch.howToPlay', 'How to Play')}
                      accessibilityRole="button"
                      style={styles.tutorialButton}
                    >
                      <Text style={styles.tutorialButtonText}>
                        📖 {t('capitalSmallMatch.howToPlay', 'How to Play Tutorial')}
                      </Text>
                    </BigTouchTarget>
                  )}
                </View>
              </IslandPanel>
            </ScrollView>
          </ResponsiveContainer>
        </SafeAreaView>
      </View>
    );
  }
);

GameIntroCard.displayName = 'GameIntroCard';

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0E7490',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: WorldSpacing.xs,
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: WorldRadii.sm,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.primary,
  },
  realmPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  realmPillText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    color: WorldPalettes.text.primary,
  },
  scrollContent: {
    paddingBottom: WorldSpacing.xl,
    alignItems: 'center',
  },
  introIsland: {
    width: '100%',
    alignItems: 'center',
    marginTop: WorldSpacing.xs,
  },
  mascotWrapper: {
    width: 90,
    height: 90,
    marginBottom: WorldSpacing.xs,
  },
  mascot: {
    width: 90,
    height: 90,
  },
  titleText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 22,
    color: WorldPalettes.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  descriptionText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 13,
    color: WorldPalettes.text.secondary,
    textAlign: 'center',
    marginBottom: WorldSpacing.md,
    lineHeight: 18,
  },
  guidanceBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: WorldRadii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    padding: WorldSpacing.sm,
    gap: 10,
    marginBottom: WorldSpacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  stepIcon: {
    fontSize: 18,
  },
  stepTextCol: {
    flex: 1,
    minWidth: 0,
  },
  stepHeading: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    color: WorldPalettes.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepBody: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 12,
    color: WorldPalettes.text.secondary,
    lineHeight: 16,
  },
  actionButtonsCol: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  startBtn: {
    width: '100%',
  },
  tutorialButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tutorialButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    color: WorldPalettes.text.secondary,
  },
});
