/**
 * Purpose: Level 2 Floating Island Surface for Gyannn ("The Living Learning World").
 *          Provides cohesive floating cards with frosted glass, parchment, emerald,
 *          or twilight themes, eliminating generic harsh white cards.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  WorldPalettes,
  WorldRadii,
  WorldShadows,
  WorldSpacing,
} from '../theme/tokens';

export type IslandVariant =
  | 'frosted'
  | 'parchment'
  | 'twilight'
  | 'emerald'
  | 'sunshine';

export type IslandElevation = 'flat' | 'floating' | 'glowing';

export interface IslandPanelProps {
  children: React.ReactNode;
  /** Visual variant matching learning realm or environmental zone */
  variant?: IslandVariant;
  /** Depth and shadow elevation */
  elevation?: IslandElevation;
  /** Internal padding scale */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Content style */
  contentStyle?: StyleProp<ViewStyle>;
  /** Optional border radius override */
  borderRadius?: number;
}

export const IslandPanel: React.FC<IslandPanelProps> = ({
  children,
  variant = 'frosted',
  elevation = 'floating',
  padding = 'md',
  style,
  contentStyle,
  borderRadius = WorldRadii.island,
}) => {
  // Determine variant background & border colors
  let backgroundColor: string;
  let borderColor: string;

  switch (variant) {
    case 'parchment':
      backgroundColor = WorldPalettes.surfaces.level2_parchmentBg;
      borderColor = WorldPalettes.surfaces.level2_parchmentBorder;
      break;
    case 'twilight':
      backgroundColor = WorldPalettes.surfaces.level2_twilightBg;
      borderColor = WorldPalettes.surfaces.level2_twilightBorder;
      break;
    case 'emerald':
      backgroundColor = '#ECFDF5';
      borderColor = '#A7F3D0';
      break;
    case 'sunshine':
      backgroundColor = '#FFFBEB';
      borderColor = '#FDE68A';
      break;
    case 'frosted':
    default:
      backgroundColor = WorldPalettes.surfaces.level2_islandFrosted;
      borderColor = WorldPalettes.surfaces.level2_islandBorder;
      break;
  }

  // Determine padding
  let padValue: number;
  switch (padding) {
    case 'none':
      padValue = 0;
      break;
    case 'sm':
      padValue = WorldSpacing.sm;
      break;
    case 'lg':
      padValue = WorldSpacing.lg;
      break;
    case 'xl':
      padValue = WorldSpacing.xl;
      break;
    case 'md':
    default:
      padValue = WorldSpacing.md;
      break;
  }

  // Determine shadow style
  let shadowStyle: ViewStyle;
  switch (elevation) {
    case 'flat':
      shadowStyle = {};
      break;
    case 'glowing':
      shadowStyle = {
        ...WorldShadows.glowPrimary,
      };
      break;
    case 'floating':
    default:
      shadowStyle = {
        ...WorldShadows.island,
      };
      break;
  }

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor,
          borderColor,
          borderRadius,
          padding: padValue,
        },
        shadowStyle,
        style,
      ]}
    >
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    width: '100%',
  },
});
