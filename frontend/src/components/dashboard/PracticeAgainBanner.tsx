/**
 * Purpose: Positive, child-centered Practice Again & Daily Encouragement Banner.
 *          Gently recommends training a developing skill or celebrating mastery
 *          without any discouraging or clinical terminology.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BigTouchTarget } from '../BigTouchTarget';
import { SkillSummary } from '../../services/dashboardService';
import { audioManager } from '../../services/audioManager';

interface PracticeAgainBannerProps {
  skills: SkillSummary[];
  childName?: string;
  onPractice: (skillId: string, title: string) => void;
}

const SKILL_GAME_MAPPING: Record<string, string> = {
  letters_phonics: 'alphabet_matching',
  vocabulary: 'odd_word_out',
  reading_words: 'missing_letter_words',
  speech_pronunciation: 'speech_letters',
  mathematics: 'addition',
  shapes_colours: 'shape_challenge',
  logic_patterns: 'number_pattern',
  comprehension: 'sentence_correction',
};

export const PracticeAgainBanner: React.FC<PracticeAgainBannerProps> = ({
  skills,
  childName = 'Friend',
  onPractice,
}) => {
  // Find skill that could use extra practice (<70% or least practiced)
  const skillsWithAttempts = skills.filter((s) => s.attempts > 0);
  const developingSkill = skillsWithAttempts.find((s) => s.accuracy < 70) ||
    skills.find((s) => s.attempts === 0) ||
    skills[0];

  const isMasterMode = skillsWithAttempts.length >= 3 && skillsWithAttempts.every((s) => s.accuracy >= 70);

  const targetSkill = developingSkill || skills[0];
  const targetGameId = targetSkill ? (SKILL_GAME_MAPPING[targetSkill.skill_id] || 'alphabet_matching') : 'alphabet_matching';

  const handlePress = () => {
    audioManager.playTapSound();
    if (targetSkill) {
      onPractice(targetGameId, targetSkill.title);
    }
  };

  if (!targetSkill) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isMasterMode
            ? ['#F59E0B', '#D97706', '#B45309']
            : ['#6366F1', '#4F46E5', '#3730A3']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top Tag */}
        <View style={styles.tagRow}>
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>
              {isMasterMode ? 'CHAMPION STREAK 🌟' : 'DAILY POWER-UP 💪'}
            </Text>
          </View>
          <Text style={styles.heroEmoji}>{isMasterMode ? '🏆' : '🚀'}</Text>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          <Text style={styles.titleText}>
            {isMasterMode
              ? `You're On Fire, ${childName}! 🔥`
              : `Power Up: ${targetSkill.title}! ⭐`}
          </Text>
          <Text style={styles.messageText}>
            {isMasterMode
              ? "All your skills are shining bright! Ready to play a speed round and earn bonus stars?"
              : `Every game flexes your brain muscles! Let's play ${targetSkill.title} and level up!`}
          </Text>
        </View>

        {/* Big Tactile Action Button */}
        <BigTouchTarget
          onPress={handlePress}
          style={styles.actionButton}
          accessibilityLabel={`Practice ${targetSkill.title}`}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={
              isMasterMode
                ? ['#10B981', '#059669', '#047857']
                : ['#F59E0B', '#EAB308', '#CA8A04']
            }
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {isMasterMode ? 'CHALLENGE NOW ⚡' : 'PRACTICE NOW ▶'}
            </Text>
          </LinearGradient>
        </BigTouchTarget>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    padding: 16,
    borderRadius: 24,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  heroEmoji: {
    fontSize: 24,
  },
  contentBody: {
    marginBottom: 14,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
