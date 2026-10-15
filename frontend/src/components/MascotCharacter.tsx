/**
 * Purpose: Animated mascot companion component with child avatar support,
 *          offline-first Reanimated spring physics, 6 expressive educational states,
 *          and interactive encouraging speech bubble.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  AccessibilityInfo,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useChildProfileStore } from '../state/childProfileStore';
import { audioManager } from '../services/audioManager';

export type MascotState =
  | 'idle'
  | 'welcoming'
  | 'encouraging'
  | 'listening'
  | 'celebrating'
  | 'supporting';

export interface MascotCharacterProps {
  state?: MascotState;
  avatar?: string;
  name?: string;
  speechText?: string;
  showBubble?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  size?: number;
}

const CHILD_PROMPTS = [
  "Ready for today's adventure? Let's go! 🌟",
  "You're doing amazing! Tap for a high five! ✋",
  "Mistakes help our brain muscles grow! 💪",
  "Let's play and collect shiny stars today! ⭐",
  "You're super smart! Keep exploring! 🚀",
  "Every game makes you stronger! 🦁",
];

export const MascotCharacter: React.FC<MascotCharacterProps> = React.memo(
  ({
    state = 'idle',
    avatar,
    name,
    speechText,
    showBubble = false,
    onPress,
    accessibilityLabel,
    style,
    size = 80,
  }) => {
    const { t } = useTranslation();
    const storeProfile = useChildProfileStore();
    const effectiveAvatar = avatar || storeProfile.avatar || '🦁';
    const effectiveName = name || storeProfile.name || 'Friend';

    const [reduceMotion, setReduceMotion] = useState(false);
    const [promptIndex, setPromptIndex] = useState(0);

    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const pulseOpacity = useSharedValue(0.4);

    const prevStateRef = useRef<MascotState>(state);

    useEffect(() => {
      let isMounted = true;
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        if (isMounted) setReduceMotion(enabled);
      });
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (enabled) => {
          if (isMounted) setReduceMotion(enabled);
        }
      );
      return () => {
        isMounted = false;
        subscription.remove();
      };
    }, []);

    // Play celebration sound strictly when transitioning into 'celebrating'
    useEffect(() => {
      if (state === 'celebrating' && prevStateRef.current !== 'celebrating') {
        audioManager.playCelebrationSound();
      }
      prevStateRef.current = state;
    }, [state]);

    useEffect(() => {
      if (reduceMotion) {
        scale.value = 1;
        translateY.value = 0;
        rotation.value = 0;
        pulseOpacity.value = 0.5;
        return;
      }

      switch (state) {
        case 'celebrating':
          scale.value = withSequence(
            withSpring(1.25, { damping: 5, stiffness: 220 }),
            withSpring(1.1, { damping: 8, stiffness: 180 })
          );
          translateY.value = withSequence(
            withTiming(-16, { duration: 250 }),
            withSpring(0, { damping: 6, stiffness: 180 })
          );
          rotation.value = withSequence(
            withTiming(-6, { duration: 120 }),
            withTiming(6, { duration: 140 }),
            withTiming(0, { duration: 100 })
          );
          break;

        case 'encouraging':
          scale.value = withSpring(1.12, { damping: 8, stiffness: 200 });
          translateY.value = withSequence(
            withTiming(-8, { duration: 180 }),
            withSpring(0, { damping: 7, stiffness: 180 })
          );
          rotation.value = withSequence(
            withTiming(-4, { duration: 100 }),
            withTiming(4, { duration: 100 }),
            withTiming(0, { duration: 80 })
          );
          break;

        case 'welcoming':
          scale.value = withSequence(
            withSpring(1.18, { damping: 6, stiffness: 200 }),
            withSpring(1.05, { damping: 8, stiffness: 160 })
          );
          translateY.value = withSequence(
            withTiming(-10, { duration: 220 }),
            withSpring(0, { damping: 7, stiffness: 180 })
          );
          rotation.value = withSequence(
            withTiming(-8, { duration: 150 }),
            withTiming(8, { duration: 150 }),
            withTiming(0, { duration: 120 })
          );
          break;

        case 'listening':
          // Attentive lean forward with gentle radiant halo pulse
          scale.value = withSpring(1.08, { damping: 9, stiffness: 180 });
          translateY.value = withTiming(-4, { duration: 250 });
          rotation.value = withTiming(0, { duration: 150 });
          pulseOpacity.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
              withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          );
          break;

        case 'supporting':
          // Gentle comforting tilt without failure indication
          scale.value = withSpring(1.04, { damping: 9, stiffness: 170 });
          translateY.value = withSequence(
            withTiming(-4, { duration: 200 }),
            withSpring(0, { damping: 8, stiffness: 160 })
          );
          rotation.value = withSequence(
            withTiming(-5, { duration: 220 }),
            withSpring(0, { damping: 7, stiffness: 150 })
          );
          break;

        case 'idle':
        default:
          // Calm, rhythmic floating breathing motion
          scale.value = withSpring(1, { damping: 10, stiffness: 150 });
          rotation.value = withTiming(0, { duration: 200 });
          translateY.value = withRepeat(
            withSequence(
              withTiming(-6, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
              withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
          );
          break;
      }
    }, [state, reduceMotion, translateY, scale, rotation, pulseOpacity]);

    const handleTap = useCallback(() => {
      audioManager.playTapSound();

      if (!reduceMotion) {
        scale.value = withSequence(
          withSpring(1.22, { damping: 4, stiffness: 260 }),
          withSpring(1, { damping: 8, stiffness: 180 })
        );
        rotation.value = withSequence(
          withTiming(-8, { duration: 100 }),
          withTiming(8, { duration: 120 }),
          withTiming(0, { duration: 100 })
        );
      }

      setPromptIndex((prev) => (prev + 1) % CHILD_PROMPTS.length);

      if (onPress) {
        onPress();
      }
    }, [reduceMotion, scale, rotation, onPress]);

    const animatedStyle = useAnimatedStyle(() => {
      if (reduceMotion) return {};
      return {
        transform: [
          { translateY: translateY.value },
          { scale: scale.value },
          { rotate: `${rotation.value}deg` },
        ],
      };
    });

    const haloAnimatedStyle = useAnimatedStyle(() => {
      if (reduceMotion || state !== 'listening') return { opacity: 0 };
      return {
        opacity: pulseOpacity.value,
        transform: [{ scale: 1.18 }],
      };
    });

    // Determine speech bubble text
    let activeSpeech = speechText;
    if (!activeSpeech) {
      if (state === 'supporting') {
        activeSpeech = "You're doing great! Let's try again together! 💪";
      } else if (state === 'listening') {
        activeSpeech = "I'm listening carefully! Speak clearly! 🎙️";
      } else if (state === 'welcoming') {
        activeSpeech = `Welcome back ${effectiveName}! Ready to explore? 👋`;
      } else if (promptIndex === 0 && effectiveName) {
        activeSpeech = `Hi ${effectiveName}! ${CHILD_PROMPTS[0]}`;
      } else {
        activeSpeech = CHILD_PROMPTS[promptIndex];
      }
    }

    const resolvedLabel =
      accessibilityLabel ||
      `${t('accessibility.mascotCompanion', { defaultValue: 'Mascot Companion' })}: ${activeSpeech}`;

    return (
      <View style={[styles.root, style]}>
        {showBubble && (
          <Pressable
            onPress={handleTap}
            style={styles.bubbleContainer}
            accessibilityRole="text"
            accessibilityLabel={activeSpeech}
          >
            <View
              style={[
                styles.speechBubble,
                state === 'supporting' && styles.speechBubbleSupporting,
                state === 'listening' && styles.speechBubbleListening,
              ]}
            >
              <Text style={styles.bubbleText}>{activeSpeech}</Text>
            </View>
            <View
              style={[
                styles.bubbleTail,
                state === 'supporting' && styles.bubbleTailSupporting,
                state === 'listening' && styles.bubbleTailListening,
              ]}
            />
          </Pressable>
        )}

        <Pressable
          onPress={handleTap}
          accessibilityLabel={resolvedLabel}
          accessibilityRole="button"
          accessibilityHint={t('accessibility.tapToRepeatPrompt', {
            defaultValue: 'Tap mascot for encouragement',
          })}
          style={styles.touchTarget}
        >
          {/* Listening Radiant Halo Ring */}
          {state === 'listening' && (
            <Animated.View
              style={[
                styles.listeningHalo,
                { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 },
                haloAnimatedStyle,
              ]}
            />
          )}

          <Animated.View
            style={[
              styles.avatarBadge,
              { width: size, height: size, borderRadius: size / 2 },
              state === 'supporting' && styles.badgeSupporting,
              state === 'listening' && styles.badgeListening,
              animatedStyle,
            ]}
          >
            <Text style={[styles.avatarEmoji, { fontSize: size * 0.58 }]}>
              {effectiveAvatar}
            </Text>

            {/* Accessory badges based on state */}
            {state === 'celebrating' && (
              <View style={styles.accessoryBadge}>
                <Text style={styles.accessoryText}>👑</Text>
              </View>
            )}

            {state === 'supporting' && (
              <View style={[styles.accessoryBadge, styles.heartBadge]}>
                <Text style={styles.accessoryText}>💙</Text>
              </View>
            )}

            {state === 'listening' && (
              <View style={[styles.accessoryBadge, styles.micBadge]}>
                <Text style={styles.accessoryText}>🎙️</Text>
              </View>
            )}
          </Animated.View>
        </Pressable>
      </View>
    );
  }
);

MascotCharacter.displayName = 'MascotCharacter';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchTarget: {
    minWidth: 54,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeSupporting: {
    borderColor: '#93C5FD',
    shadowColor: '#3B82F6',
  },
  badgeListening: {
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
  },
  listeningHalo: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  accessoryBadge: {
    position: 'absolute',
    top: -10,
    right: -4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  heartBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  micBadge: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  accessoryText: {
    fontSize: 14,
  },
  bubbleContainer: {
    alignItems: 'center',
    marginBottom: 8,
    maxWidth: 270,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  speechBubbleSupporting: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  speechBubbleListening: {
    borderColor: '#7DD3FC',
    backgroundColor: '#F0F9FF',
  },
  bubbleText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 19,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    alignSelf: 'center',
    marginTop: -1,
  },
  bubbleTailSupporting: {
    borderTopColor: '#F8FAFC',
  },
  bubbleTailListening: {
    borderTopColor: '#F0F9FF',
  },
});
