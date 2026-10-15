/**
 * Shared typography configuration for Gyan application
 * Maps explicit Expo Google Font keys for every weight to prevent system font fallback.
 */

export const Typography = {
  fonts: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semibold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
  },
  fontFamily: 'Lexend_400Regular',
  sizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 28,
    xl: 36,
    display: 48,
    tile: 64,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  displayMedium: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 24,
    fontWeight: '700' as const,
  },
  titleMedium: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 15,
    fontWeight: '600' as const,
  },
};
