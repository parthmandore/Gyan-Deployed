/**
 * Purpose: Viewport-aware responsive container for Gyannn ("The Living Learning World").
 *          Clamps screen layouts to prevent horizontal blowout on desktop and tablets
 *          while giving edge-to-edge breathing room on compact mobile devices (320px - 430px).
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { WorldSpacing } from '../theme/tokens';

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  /** Maximum container width (defaults to 460 for mobile games, or 'wide' for catalogs) */
  maxWidth?: number | 'standard' | 'wide' | 'full';
  /** Padding preset */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to center horizontally */
  center?: boolean;
  /** Additional custom style */
  style?: StyleProp<ViewStyle>;
  /** Content container style */
  contentStyle?: StyleProp<ViewStyle>;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'standard',
  padding = 'md',
  center = true,
  style,
  contentStyle,
}) => {
  const { width: windowWidth } = useWindowDimensions();

  // Determine numeric maxWidth cap
  let maxW: number;
  if (typeof maxWidth === 'number') {
    maxW = maxWidth;
  } else if (maxWidth === 'full') {
    maxW = windowWidth;
  } else if (maxWidth === 'wide') {
    maxW = Math.min(windowWidth, 980);
  } else {
    // 'standard'
    maxW = Math.min(windowWidth, 480);
  }

  // Determine horizontal padding
  let horizontalPadding: number;
  switch (padding) {
    case 'none':
      horizontalPadding = 0;
      break;
    case 'xs':
      horizontalPadding = WorldSpacing.xs;
      break;
    case 'sm':
      horizontalPadding = WorldSpacing.sm;
      break;
    case 'lg':
      horizontalPadding = WorldSpacing.lg;
      break;
    case 'md':
    default:
      horizontalPadding = windowWidth <= 360 ? WorldSpacing.xs : WorldSpacing.md;
      break;
  }

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.inner,
          {
            maxWidth: maxW,
            paddingHorizontal: horizontalPadding,
            alignSelf: center ? 'center' : 'stretch',
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    flex: 1,
  },
  inner: {
    width: '100%',
    flex: 1,
  },
});
