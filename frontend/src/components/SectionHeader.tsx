/**
 * Purpose: Playful, dyslexia-friendly section title component for Gyannn ("The Living Learning World").
 *          Provides high-contrast headings, emoji badge icons, and multilingual protection
 *          for English, Hindi, and Marathi text strings.
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
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string | number;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftCol}>
        <View style={styles.titleRow}>
          {icon ? (
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>{icon}</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {badge !== undefined && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={rightAction.label}
        >
          <Text style={styles.actionLabel}>{rightAction.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: WorldSpacing.sm,
    gap: WorldSpacing.xs,
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: WorldSpacing.xs,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: WorldRadii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  title: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.sectionTitle,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    letterSpacing: WorldTypography.letterSpacing.normal,
    flexShrink: 1,
  },
  badgePill: {
    backgroundColor: '#FEF08A',
    borderColor: '#FDE047',
    borderWidth: 1,
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.caption,
    fontWeight: '600',
    color: '#854D0E',
  },
  subtitle: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.muted,
    marginTop: 2,
    marginLeft: 2,
  },
  actionButton: {
    paddingHorizontal: WorldSpacing.sm,
    paddingVertical: WorldSpacing.xxs + 2,
    borderRadius: WorldRadii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignSelf: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  actionLabel: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.caption,
    fontWeight: '600',
    color: WorldPalettes.text.primary,
  },
});
