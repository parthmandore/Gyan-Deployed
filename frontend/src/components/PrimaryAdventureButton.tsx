/**
 * Purpose: Level 3 Tactile 3D Adventure Button for Gyannn ("The Living Learning World").
 *          Provides chunky, satisfying 3D press feedback with color-coded realms,
 *          subtle bevel edges, dyslexia-friendly typography, and haptic audio cues.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  AccessibilityInfo,
  Platform,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  WorldPalettes,
  WorldRadii,
  WorldShadows,
  WorldTypography,
} from '../theme/tokens';
import { triggerHapticLightImpact } from '../services/hapticsService';
import { audioManager } from '../services/audioManager';

export type ButtonVariant =
  | 'primary'
  | 'success'
  | 'reward'
  | 'portal'
  | 'secondary';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface PrimaryAdventureButtonProps {
  label: string;
  icon?: string | React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}


export const PrimaryAdventureButton: React.FC<PrimaryAdventureButtonProps> = React.memo(
  ({
    label,
    icon,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = true,
    accessibilityLabel,
    accessibilityHint,
    style,
    textStyle,
  }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
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

    // Color definitions
    let bg: string;
    let bevel: string;
    let textColor: string;

    switch (variant) {
      case 'success':
        bg = WorldPalettes.surfaces.level3_buttonSuccess;
        bevel = WorldPalettes.surfaces.level3_buttonSuccessBevel;
        textColor = '#FFFFFF';
        break;
      case 'reward':
        bg = WorldPalettes.surfaces.level3_buttonReward;
        bevel = WorldPalettes.surfaces.level3_buttonRewardBevel;
        textColor = '#FFFFFF';
        break;
      case 'portal':
        bg = WorldPalettes.surfaces.level3_buttonPortal;
        bevel = WorldPalettes.surfaces.level3_buttonPortalBevel;
        textColor = '#FFFFFF';
        break;
      case 'secondary':
        bg = '#F1F5F9';
        bevel = '#CBD5E1';
        textColor = '#334155';
        break;
      case 'primary':
      default:
        bg = WorldPalettes.surfaces.level3_buttonPrimary;
        bevel = WorldPalettes.surfaces.level3_buttonPrimaryBevel;
        textColor = '#FFFFFF';
        break;
    }

    if (disabled) {
      bg = '#94A3B8';
      bevel = '#64748B';
      textColor = '#E2E8F0';
    }

    // Size specs
    let minHeight: number;
    let paddingHorizontal: number;
    let fontSize: number;
    let iconSize: number;

    switch (size) {
      case 'sm':
        minHeight = 44;
        paddingHorizontal = 14;
        fontSize = WorldTypography.sizes.subtext;
        iconSize = 16;
        break;
      case 'lg':
        minHeight = 60;
        paddingHorizontal = 24;
        fontSize = WorldTypography.sizes.sectionTitle;
        iconSize = 24;
        break;
      case 'md':
      default:
        minHeight = 52;
        paddingHorizontal = 20;
        fontSize = WorldTypography.sizes.button;
        iconSize = 20;
        break;
    }

    const animatedStyle = useAnimatedStyle(() => {
      if (reduceMotion) return {};
      return {
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
      };
    });

    const handlePressIn = () => {
      if (!disabled && !loading) {
        triggerHapticLightImpact();
        audioManager.playTapSound();
        if (!reduceMotion) {
          scale.value = withSpring(0.97, { damping: 12, stiffness: 400 });
          translateY.value = withSpring(2, { damping: 12, stiffness: 400 });
        }
      }
    };

    const handlePressOut = () => {
      if (!disabled && !loading && !reduceMotion) {
        scale.value = withSpring(1, { damping: 10, stiffness: 350 });
        translateY.value = withSpring(0, { damping: 10, stiffness: 350 });
      }
    };

    const handlePress = () => {
      if (disabled || loading) return;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        } catch {}
      }
      onPress?.();
    };

    const isWeb = Platform.OS === 'web';

    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={({ pressed }) => [
          styles.pressableWrapper,
          {
            width: fullWidth ? '100%' : 'auto',
            cursor: (disabled || loading ? 'default' : 'pointer') as any,
          },
        ]}
        {...(isWeb ? { onClick: handlePress } : {})}
      >
        <Animated.View
          style={[
            styles.baseButton,
            {
              backgroundColor: bg,
              borderBottomColor: bevel,
              minHeight,
              paddingHorizontal,
              width: fullWidth ? '100%' : 'auto',
            },
            variant === 'primary' && !disabled && (isWeb ? styles.webGlowPrimary : WorldShadows.glowPrimary),
            variant === 'reward' && !disabled && (isWeb ? styles.webCardShadow : WorldShadows.card),
            animatedStyle,
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <View style={styles.contentRow} pointerEvents="none">
              {icon && typeof icon === 'string' ? (
                <Text style={[styles.iconText, { fontSize: iconSize }]}>{icon}</Text>
              ) : (
                icon
              )}
              <Text
                style={[
                  styles.buttonLabel,
                  {
                    color: textColor,
                    fontSize,
                  },
                  textStyle,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }
);

PrimaryAdventureButton.displayName = 'PrimaryAdventureButton';

const styles = StyleSheet.create({
  pressableWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseButton: {
    borderRadius: WorldRadii.pill,
    borderBottomWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  buttonLabel: {
    fontFamily: WorldTypography.fonts.bold,
    fontWeight: '700',
    letterSpacing: WorldTypography.letterSpacing.relaxed,
    textAlign: 'center',
  },
  iconText: {
    marginRight: 2,
  },
  webGlowPrimary: {
    // Clean CSS box-shadow equivalent for web without React Native deprecation warnings
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' } as any)
      : {}),
  },
  webCardShadow: {
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.12)' } as any)
      : {}),
  },
});
