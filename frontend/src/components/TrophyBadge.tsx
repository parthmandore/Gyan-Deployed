/**
 * Purpose: Collectible Achievement / Trophy Badge Component for Gyannn ("The Living Learning World").
 *          Presents unlocked achievements with radiant celebration aura and locked items
 *          with friendly curious silhouettes, eliminating repetitive plain white cards.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  WorldPalettes,
  WorldRadii,
  WorldShadows,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';

export interface TrophyBadgeProps {
  icon: string;
  title: string;
  description?: string;
  unlocked: boolean;
  xpReward?: number;
  unlockedAt?: string;
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TrophyBadge: React.FC<TrophyBadgeProps> = ({
  icon,
  title,
  description,
  unlocked,
  xpReward,
  size = 'md',
  onPress,
  style,
}) => {
  const iconSize = size === 'sm' ? 24 : 34;
  const badgeDiameter = size === 'sm' ? 44 : 58;

  const content = (
    <View
      style={[
        styles.cardContainer,
        unlocked ? styles.cardUnlocked : styles.cardLocked,
        unlocked && WorldShadows.card,
        style,
      ]}
    >
      {/* Badge Icon Slot */}
      <View style={styles.badgeWrapper}>
        {unlocked ? (
          <LinearGradient
            colors={['#FEF08A', '#FDE047', '#F59E0B']}
            style={[
              styles.iconCircle,
              {
                width: badgeDiameter,
                height: badgeDiameter,
                borderRadius: badgeDiameter / 2,
              },
            ]}
          >
            <Text style={[styles.iconText, { fontSize: iconSize }]}>{icon}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.iconCircleLocked,
              {
                width: badgeDiameter,
                height: badgeDiameter,
                borderRadius: badgeDiameter / 2,
              },
            ]}
          >
            <Text style={[styles.iconTextLocked, { fontSize: iconSize }]}>🔒</Text>
          </View>
        )}
      </View>

      {/* Title & Description Info */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.badgeTitle,
              unlocked ? styles.titleUnlocked : styles.titleLocked,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {xpReward !== undefined && (
            <View
              style={[
                styles.xpTag,
                unlocked ? styles.xpTagUnlocked : styles.xpTagLocked,
              ]}
            >
              <Text
                style={[
                  styles.xpTagText,
                  unlocked ? styles.xpTagTextUnlocked : styles.xpTagTextLocked,
                ]}
              >
                +{xpReward} XP
              </Text>
            </View>
          )}
        </View>

        {description ? (
          <Text
            style={[
              styles.badgeDesc,
              unlocked ? styles.descUnlocked : styles.descLocked,
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${unlocked ? 'Unlocked' : 'Locked'}`}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: WorldSpacing.sm,
    borderRadius: WorldRadii.lg,
    borderWidth: 1.5,
    marginVertical: 4,
    gap: WorldSpacing.sm,
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#FDE047',
  },
  cardLocked: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderColor: '#E2E8F0',
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  iconCircleLocked: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  iconText: {
    textAlign: 'center',
  },
  iconTextLocked: {
    opacity: 0.6,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  badgeTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.body,
    fontWeight: '700',
    flexShrink: 1,
  },
  titleUnlocked: {
    color: WorldPalettes.text.primary,
  },
  titleLocked: {
    color: WorldPalettes.text.muted,
  },
  badgeDesc: {
    fontFamily: WorldTypography.fonts.regular,
    fontSize: WorldTypography.sizes.subtext,
    marginTop: 2,
  },
  descUnlocked: {
    color: WorldPalettes.text.secondary,
  },
  descLocked: {
    color: '#94A3B8',
  },
  xpTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: WorldRadii.pill,
    borderWidth: 1,
  },
  xpTagUnlocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE047',
  },
  xpTagLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  xpTagText: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 10,
    fontWeight: '600',
  },
  xpTagTextUnlocked: {
    color: '#B45309',
  },
  xpTagTextLocked: {
    color: '#94A3B8',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
