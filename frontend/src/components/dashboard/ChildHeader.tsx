/**
 * Purpose: Dashboard header showing Child Avatar, Name greeting, Level Badge, and XP Progress.
 *          Built as a floating Level 2 IslandPanel with animated LearningBuddyAvatar,
 *          safe long-name support, and integrated capsule XP track.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BigTouchTarget } from '../BigTouchTarget';
import { IslandPanel } from '../IslandPanel';
import { LearningBuddyAvatar } from '../LearningBuddyAvatar';
import { AudioControlPill } from '../AudioControlPill';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../../theme/tokens';
import { LevelInfo } from '../../services/dashboardService';

interface ChildHeaderProps {
  name: string;
  avatar: string;
  levelInfo: LevelInfo;
  onPressProfile?: () => void;
  onPressSettings?: () => void;
}

export const ChildHeader: React.FC<ChildHeaderProps> = ({
  name,
  avatar,
  levelInfo,
  onPressProfile,
  onPressSettings,
}) => {
  const currentLevel = levelInfo.level || 1;
  const streak = levelInfo.streak_days || 0;
  const xpInLevel = levelInfo.xp_in_level || 0;
  const levelCost = levelInfo.current_level_cost || 100;
  const progressPercent = Math.min(100, Math.max(5, levelInfo.progress_percent || 0));

  const animatedProgress = useSharedValue(progressPercent);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (isMounted) setReduceMotion(reduced);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      animatedProgress.value = progressPercent;
    } else {
      animatedProgress.value = withTiming(progressPercent, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [progressPercent, reduceMotion, animatedProgress]);

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  return (
    <IslandPanel variant="frosted" elevation="floating" style={styles.islandContainer} padding="md">
      {/* Top Row: Avatar + Greeting + Settings Button */}
      <View style={styles.topRow}>
        {/* Child Companion Avatar */}
        <View style={styles.avatarWrapper}>
          <LearningBuddyAvatar
            avatar={avatar || '🦁'}
            size="md"
            variant="gold"
            animated
            levelBadge={currentLevel}
            onPress={onPressProfile}
            accessibilityLabel="Change avatar or view profile"
          />
        </View>

        {/* Greeting with Safe Name Constraints */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingSubtitle}>Welcome back,</Text>
          <Text
            style={styles.greetingName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name || 'Explorer'}! 👋
          </Text>
        </View>

        {/* Audio Controls (Music & SFX toggles) */}
        <AudioControlPill compact style={styles.audioPill} />

        {/* Settings Gear Button */}
        {onPressSettings && (
          <BigTouchTarget
            onPress={onPressSettings}
            style={styles.settingsTouch}
            accessibilityLabel="Settings and Profile"
            accessibilityRole="button"
          >
            <View style={styles.settingsCircle}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </View>
          </BigTouchTarget>
        )}
      </View>

      {/* Level & XP Capsule Bar (Integrated, NOT a nested card) */}
      <View style={styles.progressSection}>
        <View style={styles.badgesRow}>
          <View style={styles.levelPill}>
            <Text style={styles.levelPillText}>⭐ LEVEL {currentLevel}</Text>
          </View>

          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>
              🔥 {streak} {streak === 1 ? 'DAY' : 'DAYS'}
            </Text>
          </View>

          <View style={styles.xpLabelWrapper}>
            <Text style={styles.xpNumbersText}>
              {xpInLevel} / {levelCost} <Text style={styles.xpUnit}>XP</Text>
            </Text>
          </View>
        </View>

        {/* Progress Track */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrapper, animatedTrackStyle]}>
            <LinearGradient
              colors={['#38BDF8', '#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            >
              <View style={styles.progressShine} />
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  islandContainer: {
    marginBottom: WorldSpacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    marginRight: 10,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  greetingSubtitle: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.caption,
    fontWeight: '600',
    color: WorldPalettes.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingName: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.sectionTitle,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    letterSpacing: 0.2,
  },
  audioPill: {
    marginRight: 6,
  },
  settingsTouch: {
    marginLeft: 6,
  },
  settingsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  settingsIcon: {
    fontSize: 16,
  },

  /* Progress Section */
  progressSection: {
    width: '100%',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  levelPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  levelPillText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  streakPill: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  streakPillText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
    letterSpacing: 0.5,
  },
  xpLabelWrapper: {
    marginLeft: 'auto',
  },
  xpNumbersText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
  },
  xpUnit: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 10,
    color: WorldPalettes.text.muted,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  progressFillWrapper: {
    height: '100%',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 5,
    position: 'relative',
  },
  progressShine: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 1,
  },
});
