/**
 * Purpose: 8-Skill Category Progress Breakdown component for Child Dashboard.
 *          Built as "My Learning Journey" with colorful distinct skill islands,
 *          clear typography, sleek progress bars, and responsive flex grid.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BigTouchTarget } from '../BigTouchTarget';
import { IslandPanel } from '../IslandPanel';
import { SectionHeader } from '../SectionHeader';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../../theme/tokens';
import { SkillSummary } from '../../services/dashboardService';

interface SkillProgressSectionProps {
  skills: SkillSummary[];
  onSelectSkill?: (skillId: string) => void;
}

const SKILL_THEMES: Record<
  string,
  { bg: string; border: string; accent: string; barFill: string; text: string }
> = {
  letters_phonics: {
    bg: '#EEF2FF',
    border: '#C7D2FE',
    accent: '#4F46E5',
    barFill: '#6366F1',
    text: '#312E81',
  },
  reading_words: {
    bg: '#ECFEFF',
    border: '#A5F3FC',
    accent: '#0891B2',
    barFill: '#06B6D4',
    text: '#164E63',
  },
  vocabulary: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    accent: '#059669',
    barFill: '#10B981',
    text: '#065F46',
  },
  speech_pronunciation: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    accent: '#D97706',
    barFill: '#F59E0B',
    text: '#78350F',
  },
  mathematics: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    accent: '#2563EB',
    barFill: '#3B82F6',
    text: '#1E3A8A',
  },
  reasoning_logic: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    accent: '#7C3AED',
    barFill: '#8B5CF6',
    text: '#4C1D95',
  },
  shapes_colours: {
    bg: '#FDF2F8',
    border: '#FBCFE8',
    accent: '#DB2777',
    barFill: '#EC4899',
    text: '#831843',
  },
  grammar_syntax: {
    bg: '#FEFCE8',
    border: '#FEF08A',
    accent: '#CA8A04',
    barFill: '#EAB308',
    text: '#713F12',
  },
};

const DEFAULT_THEME = {
  bg: '#F8FAFC',
  border: '#E2E8F0',
  accent: '#475569',
  barFill: '#3B82F6',
  text: '#1E293B',
};

export const SkillProgressSection: React.FC<SkillProgressSectionProps> = ({
  skills,
  onSelectSkill,
}) => {
  return (
    <IslandPanel
      variant="frosted"
      elevation="floating"
      style={styles.islandContainer}
      padding="md"
    >
      {/* Section Header */}
      <SectionHeader
        title="MY LEARNING JOURNEY"
        icon="🌟"
        badge={`${skills.length || 8} Skills`}
      />

      {/* Responsive Skill Islands Grid */}
      <View style={styles.skillsGrid}>
        {skills.map((skill) => {
          const theme = SKILL_THEMES[skill.skill_id] || DEFAULT_THEME;
          const accuracyClamped = Math.min(100, Math.max(0, skill.accuracy || 0));

          return (
            <BigTouchTarget
              key={skill.skill_id}
              onPress={() => onSelectSkill && onSelectSkill(skill.skill_id)}
              style={[
                styles.skillTile,
                {
                  backgroundColor: theme.bg,
                  borderColor: theme.border,
                },
              ]}
              accessibilityLabel={`${skill.title}, mastery: ${skill.mastery}, accuracy: ${accuracyClamped}%`}
              accessibilityRole="button"
            >
              {/* Header: Emoji Icon + Mastery Chip */}
              <View style={styles.tileHeader}>
                <Text style={styles.skillIcon}>{skill.icon || '⭐'}</Text>
                <View
                  style={[
                    styles.masteryPill,
                    { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
                  ]}
                >
                  <Text style={[styles.masteryText, { color: theme.accent }]}>
                    {skill.mastery || 'Explorer'}
                  </Text>
                </View>
              </View>

              {/* Skill Title */}
              <Text
                style={[styles.skillTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {skill.title}
              </Text>

              {/* Progress Track & Accuracy */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.max(6, accuracyClamped)}%`,
                        backgroundColor: theme.barFill,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.accuracyLabel, { color: theme.accent }]}>
                  {accuracyClamped}%
                </Text>
              </View>
            </BigTouchTarget>
          );
        })}
      </View>
    </IslandPanel>
  );
};

const styles = StyleSheet.create({
  islandContainer: {
    marginBottom: WorldSpacing.sm,
  },

  /* Skills 2-Column Responsive Grid */
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  skillTile: {
    width: '48.5%',
    minWidth: 135,
    borderRadius: WorldRadii.md,
    borderWidth: 1.5,
    padding: 10,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skillIcon: {
    fontSize: 22,
  },
  masteryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: WorldRadii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  masteryText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  skillTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  accuracyLabel: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    fontWeight: '700',
  },
});
