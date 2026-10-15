/**
 * Purpose: Creative Foundation & Cohesive Design System Tokens for Gyannn.
 *          "GYANNN — THE LIVING LEARNING WORLD"
 *          Defines world color palettes, dyslexia-friendly typography, 3-level surfaces,
 *          tactile button bevels, spacing scales, and animation timing.
 * Module: Theme
 * Folder: frontend/src/theme
 */

export const WorldPalettes = {
  // --- Adventure Skies (Living Backdrops) ---
  sky: {
    daybreakTop: '#38BDF8',
    daybreakMid: '#60A5FA',
    daybreakHorizon: '#E0F2FE',
    sunriseTop: '#F59E0B',
    sunriseMid: '#FBBF24',
    sunriseHorizon: '#FEF3C7',
    twilightTop: '#1E1B4B',
    twilightMid: '#312E81',
    twilightHorizon: '#4338CA',
  },

  // --- Living Environment Elements ---
  nature: {
    meadowLight: '#86EFAC',
    meadowMain: '#4ADE80',
    meadowDeep: '#22C55E',
    hillFar: '#A7F3D0',
    hillMid: '#6EE7B7',
    hillNear: '#34D399',
    earthWarm: '#78350F',
    sunCore: '#F59E0B',
    sunGlow: '#FEF08A',
    cloudWhite: '#FFFFFF',
    cloudPuff: 'rgba(255, 255, 255, 0.85)',
  },

  // --- 8 Learning Realm Themes (Categories) ---
  realms: {
    letters_phonics: {
      bg: '#EEF2FF',
      border: '#C7D2FE',
      accent: '#4F46E5',
      barFill: '#6366F1',
      text: '#312E81',
      icon: '🔤',
      name: 'Letters & Phonics',
    },
    reading_words: {
      bg: '#ECFEFF',
      border: '#A5F3FC',
      accent: '#0891B2',
      barFill: '#06B6D4',
      text: '#164E63',
      icon: '📖',
      name: 'Reading & Words',
    },
    vocabulary: {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      accent: '#059669',
      barFill: '#10B981',
      text: '#065F46',
      icon: '📚',
      name: 'Vocabulary',
    },
    speech_pronunciation: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      accent: '#D97706',
      barFill: '#F59E0B',
      text: '#78350F',
      icon: '🗣️',
      name: 'Speech & Pronunciation',
    },
    mathematics: {
      bg: '#EFF6FF',
      border: '#BFDBFE',
      accent: '#2563EB',
      barFill: '#3B82F6',
      text: '#1E3A8A',
      icon: '🔢',
      name: 'Mathematics',
    },
    reasoning_logic: {
      bg: '#F5F3FF',
      border: '#DDD6FE',
      accent: '#7C3AED',
      barFill: '#8B5CF6',
      text: '#4C1D95',
      icon: '🧩',
      name: 'Reasoning & Logic',
    },
    shapes_colours: {
      bg: '#FDF2F8',
      border: '#FBCFE8',
      accent: '#DB2777',
      barFill: '#EC4899',
      text: '#831843',
      icon: '🎨',
      name: 'Shapes & Colours',
    },
    grammar_syntax: {
      bg: '#FEFCE8',
      border: '#FEF08A',
      accent: '#CA8A04',
      barFill: '#EAB308',
      text: '#713F12',
      icon: '✍️',
      name: 'Grammar & Syntax',
    },
  },

  // --- 3 Levels of Living World Surfaces ---
  surfaces: {
    // Level 1: Environmental Backdrop (Sky/Hills)
    level1_environment: '#38BDF8',

    // Level 2: Floating Island Panels (Frosted, Parchment, Twilight)
    level2_islandFrosted: 'rgba(255, 255, 255, 0.88)',
    level2_islandBorder: 'rgba(255, 255, 255, 0.95)',
    level2_parchmentBg: '#FEFCE8',
    level2_parchmentBorder: '#FDE047',
    level2_twilightBg: '#1E1B4B',
    level2_twilightBorder: '#6366F1',

    // Level 3: Tactile Action Controls & Tiles
    level3_tileBg: '#FFFFFF',
    level3_tileBorder: '#E2E8F0',
    level3_tileActiveBorder: '#6366F1',
    level3_buttonPrimary: '#4F46E5',
    level3_buttonPrimaryBevel: '#312E81',
    level3_buttonSuccess: '#10B981',
    level3_buttonSuccessBevel: '#065F46',
    level3_buttonReward: '#F59E0B',
    level3_buttonRewardBevel: '#B45309',
    level3_buttonPortal: '#7C3AED',
    level3_buttonPortalBevel: '#4C1D95',
  },

  // --- Text & High-Contrast Typography ---
  text: {
    primary: '#0F2042', // Deep midnight navy for maximum dyslexia readability
    secondary: '#334155', // Slate
    muted: '#64748B', // Soft caption
    inverse: '#FFFFFF', // High-contrast on dark/colored buttons
    amberHead: '#92400E', // Warning / streak
    greenHead: '#166534', // Success / completed
    indigoHead: '#312E81', // Brand / title
  },

  // --- Feedback & Rewards ---
  feedback: {
    successBg: 'rgba(240, 253, 244, 0.9)',
    successBorder: '#86EFAC',
    successText: '#15803D',
    warningBg: '#FEF9C3',
    warningBorder: '#FDE047',
    warningText: '#854D0E',
    errorBg: '#FEE2E2',
    errorBorder: '#F87171',
    errorText: '#991B1B',
  },
};

export const WorldSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const WorldRadii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  island: 26,
  pill: 32,
  full: 9999,
};

export const WorldShadows = {
  island: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  glowPrimary: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  glowSuccess: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  glowPortal: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const WorldTypography = {
  fontFamily: 'Lexend_400Regular',
  fonts: {
    regular: 'Lexend_400Regular',
    medium: 'Lexend_500Medium',
    semibold: 'Lexend_600SemiBold',
    bold: 'Lexend_700Bold',
  },
  sizes: {
    caption: 11,
    subtext: 12,
    body: 14,
    button: 15,
    cardTitle: 16,
    sectionTitle: 18,
    heroTitle: 22,
    display: 28,
  },
  letterSpacing: {
    tight: 0.2,
    normal: 0.4,
    relaxed: 0.8,
    heading: 1.2,
  },
};

export const WorldMotion = {
  timings: {
    fast: 120,
    normal: 240,
    gentle: 400,
    floatDuration: 2000,
  },
  scales: {
    pressed: 0.96,
    active: 1.02,
    pop: 1.1,
  },
};
