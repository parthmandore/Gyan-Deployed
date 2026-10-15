/**
 * Purpose: Reusable Learning Companion Avatar for Gyannn ("The Living Learning World").
 *          Provides child avatar presentation with glowing halo rings, size presets,
 *          and playful subtle float animations.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { WorldRadii, WorldShadows } from '../theme/tokens';

export type BuddySize = 'sm' | 'md' | 'lg' | 'hero';
export type BuddyHaloVariant = 'gold' | 'emerald' | 'royal' | 'rainbow';

export interface LearningBuddyAvatarProps {
  avatar?: string;
  size?: BuddySize;
  variant?: BuddyHaloVariant;
  animated?: boolean;
  levelBadge?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const LearningBuddyAvatar: React.FC<LearningBuddyAvatarProps> = React.memo(
  ({
    avatar = '🦁',
    size = 'md',
    variant = 'gold',
    animated = true,
    levelBadge,
    onPress,
    accessibilityLabel,
    style,
  }) => {
    const floatY = useSharedValue(0);
    const [reduceMotion, setReduceMotion] = useState(false);

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

    useEffect(() => {
      if (animated && !reduceMotion) {
        floatY.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
            withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );
      } else {
        floatY.value = 0;
      }
    }, [animated, reduceMotion]);

    const animatedStyle = useAnimatedStyle(() => {
      if (reduceMotion || !animated) return {};
      return {
        transform: [{ translateY: floatY.value }],
      };
    });

    // Dimension scales
    let ringSize: number;
    let emojiSize: number;
    let badgeSize: number;

    switch (size) {
      case 'sm':
        ringSize = 40;
        emojiSize = 22;
        badgeSize = 16;
        break;
      case 'lg':
        ringSize = 72;
        emojiSize = 40;
        badgeSize = 22;
        break;
      case 'hero':
        ringSize = 92;
        emojiSize = 52;
        badgeSize = 26;
        break;
      case 'md':
      default:
        ringSize = 56;
        emojiSize = 30;
        badgeSize = 18;
        break;
    }

    // Halo colors
    let gradientColors: [string, string, ...string[]];
    switch (variant) {
      case 'emerald':
        gradientColors = ['#A7F3D0', '#34D399', '#059669'];
        break;
      case 'royal':
        gradientColors = ['#C7D2FE', '#818CF8', '#4338CA'];
        break;
      case 'rainbow':
        gradientColors = ['#F472B6', '#FBBF24', '#34D399', '#60A5FA'];
        break;
      case 'gold':
      default:
        gradientColors = ['#FEF08A', '#FDE047', '#F59E0B'];
        break;
    }

    const content = (
      <Animated.View style={[styles.wrapper, animatedStyle, style]}>
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.haloRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
            },
            variant === 'gold' && WorldShadows.card,
          ]}
        >
          <View
            style={[
              styles.innerCircle,
              {
                width: ringSize - 6,
                height: ringSize - 6,
                borderRadius: (ringSize - 6) / 2,
              },
            ]}
          >
            <Text style={[styles.avatarEmoji, { fontSize: emojiSize }]}>
              {avatar}
            </Text>
          </View>
        </LinearGradient>

        {levelBadge !== undefined && (
          <View
            style={[
              styles.levelBadge,
              {
                minWidth: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
              },
            ]}
          >
            <Text style={styles.levelBadgeText}>{levelBadge}</Text>
          </View>
        )}
      </Animated.View>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `Avatar ${avatar}`}
          style={({ pressed }) => pressed && styles.pressed}
        >
          {content}
        </Pressable>
      );
    }

    return content;
  }
);

LearningBuddyAvatar.displayName = 'LearningBuddyAvatar';

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#312E81',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
