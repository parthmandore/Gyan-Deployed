/**
 * Purpose: Celebratory Level-Up Modal shown strictly when a child achieves a genuine level advancement.
 *          Features animated mascot celebration, level transition badges, real milestone metrics,
 *          and haptic audio fanfare.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MascotCharacter } from './MascotCharacter';
import { PrimaryAdventureButton } from './PrimaryAdventureButton';
import { audioManager } from '../services/audioManager';
import { WorldRadii, WorldTypography, WorldShadows } from '../theme/tokens';

export interface LevelUpCelebrationModalProps {
  visible: boolean;
  newLevel: number;
  totalXp: number;
  onDismiss: () => void;
}

const LEVEL_TITLES: Record<number, { title: string; perk: string; icon: string }> = {
  2: {
    title: 'Word Adventurer',
    perk: 'Unlocked new word & phonics quests!',
    icon: '🔤',
  },
  3: {
    title: 'Logic & Math Pathfinder',
    perk: 'Unlocked intermediate reasoning realms!',
    icon: '🧩',
  },
  4: {
    title: 'Master Quest Hero',
    perk: 'Mastered core foundations across all realms!',
    icon: '🛡️',
  },
  5: {
    title: 'Gyan Grand Champion',
    perk: 'Achieved mastery status across the Living Learning World!',
    icon: '🏆',
  },
};

export const LevelUpCelebrationModal: React.FC<LevelUpCelebrationModalProps> = React.memo(
  ({ visible, newLevel, totalXp, onDismiss }) => {
    const [reduceMotion, setReduceMotion] = useState(false);

    const cardScale = useSharedValue(0.6);
    const cardOpacity = useSharedValue(0);
    const starScale = useSharedValue(0.5);

    const levelDetails = LEVEL_TITLES[newLevel] || {
      title: 'Grand Explorer',
      perk: 'Keep exploring to reach higher milestones!',
      icon: '⭐',
    };

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
      if (visible) {
        audioManager.playCelebrationSound();

        if (reduceMotion) {
          cardScale.value = 1;
          cardOpacity.value = 1;
          starScale.value = 1;
          return;
        }

        cardOpacity.value = withTiming(1, { duration: 200 });
        cardScale.value = withSequence(
          withSpring(1.1, { damping: 7, stiffness: 220 }),
          withSpring(1.0, { damping: 10, stiffness: 160 })
        );
        starScale.value = withSequence(
          withTiming(0.4, { duration: 0 }),
          withSpring(1.25, { damping: 6, stiffness: 220 }),
          withSpring(1.0, { damping: 8, stiffness: 180 })
        );
      } else {
        cardScale.value = 0.6;
        cardOpacity.value = 0;
        starScale.value = 0.5;
      }
    }, [visible, reduceMotion, cardScale, cardOpacity, starScale]);

    const cardAnimatedStyle = useAnimatedStyle(() => {
      if (reduceMotion) return {};
      return {
        opacity: cardOpacity.value,
        transform: [{ scale: cardScale.value }],
      };
    });

    const starAnimatedStyle = useAnimatedStyle(() => {
      if (reduceMotion) return {};
      return {
        transform: [{ scale: starScale.value }],
      };
    });

    if (!visible) return null;

    const previousLevel = Math.max(1, newLevel - 1);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onDismiss}
      >
        <View style={styles.backdrop}>
          <Animated.View style={[styles.card, cardAnimatedStyle]}>
            {/* Top Celebrating Mascot */}
            <View style={styles.mascotWrapper}>
              <MascotCharacter state="celebrating" size={88} />
            </View>

            {/* Level Up Golden Badge */}
            <LinearGradient
              colors={['#FEF08A', '#FDE047', '#F59E0B']}
              style={styles.bannerBadge}
            >
              <Text style={styles.bannerText}>🎉 LEVEL UP! 🎉</Text>
            </LinearGradient>

            {/* Level Transition Pill: Level (N-1) ➔ Level N */}
            <View style={styles.transitionPill}>
              <View style={styles.prevLevelBox}>
                <Text style={styles.prevLevelText}>Level {previousLevel}</Text>
              </View>

              <Text style={styles.arrowText}>➔</Text>

              <Animated.View style={[styles.newLevelBox, starAnimatedStyle]}>
                <Text style={styles.newLevelText}>Level {newLevel} ⭐</Text>
              </Animated.View>
            </View>

            {/* Level Title and Perk */}
            <Text style={styles.heroTitle}>{levelDetails.title} {levelDetails.icon}</Text>
            <Text style={styles.heroSubtitle}>{levelDetails.perk}</Text>

            {/* Total XP Metric */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total Lifetime Adventure XP</Text>
              <Text style={styles.metricValue}>⭐ {totalXp} XP</Text>
            </View>

            {/* Action CTA */}
            <View style={styles.ctaWrapper}>
              <PrimaryAdventureButton
                variant="reward"
                label="CONTINUE QUEST 🚀"
                onPress={onDismiss}
                accessibilityLabel={`Celebrated reaching Level ${newLevel}. Continue your quest.`}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  }
);

LevelUpCelebrationModal.displayName = 'LevelUpCelebrationModal';

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FEF08A',
    borderBottomWidth: 6,
    borderBottomColor: '#F59E0B',
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  mascotWrapper: {
    marginTop: -44,
    marginBottom: 6,
  },
  bannerBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: WorldRadii.pill,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#78350F',
    letterSpacing: 1,
  },
  transitionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  prevLevelBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  prevLevelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
  },
  newLevelBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  newLevelText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#92400E',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  metricCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  ctaWrapper: {
    width: '100%',
  },
});
