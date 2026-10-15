/**
 * Purpose: Celebration overlay shown after a correct answer or full round completion,
 *          featuring an offline-first particle starburst, sound fanfare, and congratulatory text.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { audioManager } from '../services/audioManager';

export interface CelebrationOverlayProps {
  visible: boolean;
  onAnimationComplete?: () => void;
  titleText?: string;
  subtitleText?: string;
  isBigCelebration?: boolean;
  style?: ViewStyle;
}

// 8 particles for standard round, 14 for big celebration
interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  emoji?: string;
}

const PARTICLE_COLORS = ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#F97316'];
const PARTICLE_EMOJIS = ['✨', '⭐', '🎉', '🌟', '💫'];

const AnimatedParticle: React.FC<{
  particle: Particle;
  progress: SharedValue<number>;
}> = React.memo(({ particle, progress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const rad = (particle.angle * Math.PI) / 180;
    const currentDist = particle.distance * progress.value;
    const x = Math.cos(rad) * currentDist;
    const y = Math.sin(rad) * currentDist;
    const scale = Math.max(0, 1 - progress.value * 0.4);
    const opacity = progress.value < 0.2 ? progress.value * 5 : Math.max(0, 1 - (progress.value - 0.2) * 1.25);

    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      {particle.emoji ? (
        <Text style={{ fontSize: particle.size }}>{particle.emoji}</Text>
      ) : (
        <View
          style={{
            width: particle.size,
            height: particle.size,
            borderRadius: particle.size / 2,
            backgroundColor: particle.color,
          }}
        />
      )}
    </Animated.View>
  );
});

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = React.memo(
  ({ visible, onAnimationComplete, titleText, subtitleText, isBigCelebration = false, style }) => {
    const { t } = useTranslation();
    const [reduceMotion, setReduceMotion] = useState(false);

    const starScale = useSharedValue(0);
    const starOpacity = useSharedValue(0);
    const textScale = useSharedValue(0.5);
    const textOpacity = useSharedValue(0);
    const particleProgress = useSharedValue(0);

    const particles: Particle[] = useMemo(() => {
      const count = isBigCelebration ? 14 : 8;
      const list: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (360 / count) * i + (i % 2 === 0 ? 12 : -12);
        list.push({
          id: i,
          angle,
          distance: isBigCelebration ? 130 + (i % 3) * 25 : 85 + (i % 2) * 20,
          size: i % 2 === 0 ? 18 : 10,
          color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
          emoji: i % 2 === 0 ? PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length] : undefined,
        });
      }
      return list;
    }, [isBigCelebration]);

    useEffect(() => {
      let isMounted = true;
      AccessibilityInfo.isReduceMotionEnabled().then((isReduced) => {
        if (isMounted) setReduceMotion(isReduced);
      });
      return () => {
        isMounted = false;
      };
    }, []);

    useEffect(() => {
      if (!visible) {
        starScale.value = 0;
        starOpacity.value = 0;
        textScale.value = 0.5;
        textOpacity.value = 0;
        particleProgress.value = 0;
        return;
      }

      // Sound feedback (debounce-protected in AudioManager)
      if (isBigCelebration) {
        audioManager.playCelebrationSound();
      } else {
        audioManager.playCorrectSound();
      }

      if (reduceMotion) {
        starScale.value = 1;
        starOpacity.value = 1;
        textScale.value = 1;
        textOpacity.value = 1;
        particleProgress.value = 0;

        const timer = setTimeout(() => {
          onAnimationComplete?.();
        }, 800);
        return () => clearTimeout(timer);
      }

      // Star-burst entrance
      starOpacity.value = withTiming(1, { duration: 160 });
      starScale.value = withSequence(
        withSpring(isBigCelebration ? 1.6 : 1.35, { damping: 7, stiffness: 220 }),
        withSpring(isBigCelebration ? 1.2 : 1.05, { damping: 10, stiffness: 160 })
      );

      // Text pop-in
      textOpacity.value = withTiming(1, { duration: 200 });
      textScale.value = withSequence(
        withTiming(0.4, { duration: 0 }),
        withSpring(1.08, { damping: 10, stiffness: 200 }),
        withSpring(1.0, { damping: 14, stiffness: 140 })
      );

      // Offline-first particle dispersion
      particleProgress.value = 0;
      particleProgress.value = withTiming(1, {
        duration: 750,
        easing: Easing.out(Easing.cubic),
      });

      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 950);

      return () => clearTimeout(timer);
    }, [visible, reduceMotion, isBigCelebration, onAnimationComplete]);

    const starAnimatedStyle = useAnimatedStyle(() => ({
      opacity: starOpacity.value,
      transform: [{ scale: starScale.value }],
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
      opacity: textOpacity.value,
      transform: [{ scale: textScale.value }],
    }));

    if (!visible) return null;

    const displayTitle = titleText || (isBigCelebration ? 'Round Complete!' : t('game.correct', 'Awesome!'));

    return (
      <View
        style={[styles.overlay, style]}
        accessibilityLabel={displayTitle}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        {/* Offline Particle Starburst */}
        {!reduceMotion && (
          <View style={styles.particlesContainer} pointerEvents="none">
            {particles.map((p) => (
              <AnimatedParticle key={p.id} particle={p} progress={particleProgress} />
            ))}
          </View>
        )}

        <Animated.View style={[styles.starBurst, starAnimatedStyle]}>
          <Text style={styles.starEmoji}>{isBigCelebration ? '🌟 ⭐ 🌟' : '⭐'}</Text>
        </Animated.View>

        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.correctText}>{displayTitle}</Text>
          {subtitleText ? (
            <Text style={styles.subtitleText}>{subtitleText}</Text>
          ) : (
            <Text style={styles.checkmarkText}>✓</Text>
          )}
        </Animated.View>
      </View>
    );
  }
);

CelebrationOverlay.displayName = 'CelebrationOverlay';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    zIndex: 100,
  },
  particlesContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  particle: {
    position: 'absolute',
  },
  starBurst: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 102,
  },
  starEmoji: {
    fontSize: 54,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    zIndex: 102,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FCD34D',
    borderBottomWidth: 5,
    borderBottomColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  correctText: {
    fontFamily: Typography.fonts.bold,
    fontSize: 22,
    fontWeight: '900',
    color: '#047857',
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: Typography.fonts.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
    marginTop: 4,
    textAlign: 'center',
  },
  checkmarkText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
  },
});
