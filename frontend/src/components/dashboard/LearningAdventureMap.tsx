/**
 * Purpose: Interactive visual Learning Adventure Map for children aged 5-8.
 *          Transforms curriculum progression into an engaging, winding world map
 *          with unlocked lands, star ratings, avatar positioning, and a boss stage.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SkillSummary, LevelInfo } from '../../services/dashboardService';
import { audioManager } from '../../services/audioManager';

export interface AdventureStage {
  id: string;
  number: number;
  title: string;
  landmark: string;
  emoji: string;
  skillKey?: string;
  gameId: string;
  gradientColors: [string, string, string];
  description: string;
}

export const ADVENTURE_STAGES: AdventureStage[] = [
  {
    id: 'stage_1',
    number: 1,
    title: 'Base Camp',
    landmark: 'Warm-up Meadows',
    emoji: '🏕️',
    gameId: 'alphabet_matching',
    gradientColors: ['#38BDF8', '#0284C7', '#0369A1'],
    description: 'Start your journey with fun letters!',
  },
  {
    id: 'stage_2',
    number: 2,
    title: 'Letter Forest',
    landmark: 'Alphabet Woods',
    emoji: '🌲',
    skillKey: 'letters_phonics',
    gameId: 'missing_letter_words',
    gradientColors: ['#34D399', '#059669', '#047857'],
    description: 'Find missing letters in the forest trees!',
  },
  {
    id: 'stage_3',
    number: 3,
    title: 'Word Valley',
    landmark: 'Story Stream',
    emoji: '🌊',
    skillKey: 'vocabulary',
    gameId: 'odd_word_out',
    gradientColors: ['#60A5FA', '#2563EB', '#1D4ED8'],
    description: 'Spot different words floating by the stream!',
  },
  {
    id: 'stage_4',
    number: 4,
    title: 'Brain Mountain',
    landmark: 'Logic Peak',
    emoji: '🏔️',
    skillKey: 'logic_patterns',
    gameId: 'number_pattern',
    gradientColors: ['#A78BFA', '#7C3AED', '#5B21B6'],
    description: 'Solve fun patterns to climb the summit!',
  },
  {
    id: 'stage_5',
    number: 5,
    title: 'Speech Station',
    landmark: 'Voice Canyon',
    emoji: '🗣️',
    skillKey: 'speech_pronunciation',
    gameId: 'speech_letters',
    gradientColors: ['#F472B6', '#DB2777', '#9D174D'],
    description: 'Speak words loud and proud to make soundwaves!',
  },
  {
    id: 'stage_6',
    number: 6,
    title: 'Number Meadow',
    landmark: 'Counting Glade',
    emoji: '🔢',
    skillKey: 'mathematics',
    gameId: 'addition',
    gradientColors: ['#FBBF24', '#D97706', '#B45309'],
    description: 'Count fruits and solve magic numbers!',
  },
  {
    id: 'stage_7',
    number: 7,
    title: 'Victory Castle',
    landmark: 'Champion Palace',
    emoji: '🏰',
    skillKey: 'comprehension',
    gameId: 'sentence_correction',
    gradientColors: ['#F59E0B', '#EF4444', '#B91C1C'],
    description: 'Boss Challenge: Master sentences and win the crown!',
  },
];

interface LearningAdventureMapProps {
  skills: SkillSummary[];
  levelInfo: LevelInfo;
  avatar?: string;
  onSelectStage: (gameId: string, stageTitle: string) => void;
}

export const LearningAdventureMap: React.FC<LearningAdventureMapProps> = ({
  skills,
  levelInfo,
  avatar = '🦁',
  onSelectStage,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  // Animated bobbing for active avatar pin
  const avatarY = useSharedValue(0);
  React.useEffect(() => {
    avatarY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1,
      true
    );
  }, [avatarY]);

  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: avatarY.value }],
  }));

  // Calculate status and star rating for each stage
  const stageStates = useMemo(() => {
    let firstIncompleteIndex = -1;

    return ADVENTURE_STAGES.map((stage, index) => {
      // Stage 1 (Base Camp) is always unlocked
      if (index === 0) {
        const hasAnySession = (levelInfo.total_xp || 0) > 0;
        return {
          status: hasAnySession ? ('completed' as const) : ('active' as const),
          stars: hasAnySession ? 3 : 0,
        };
      }

      // Check skill data
      const matchedSkill = skills.find((s) => s.skill_id === stage.skillKey);
      const accuracy = matchedSkill ? matchedSkill.accuracy : 0;
      const attempts = matchedSkill ? matchedSkill.attempts : 0;

      let isCompleted = false;
      let stars = 0;

      if (attempts > 0) {
        if (accuracy >= 80) {
          isCompleted = true;
          stars = 3;
        } else if (accuracy >= 50) {
          stars = 2;
        } else {
          stars = 1;
        }
      }

      // Boss stage (Castle) requires level >= 2 or at least 3 completed stages
      if (stage.id === 'stage_7') {
        const isLevelReady = (levelInfo.level || 1) >= 2;
        if (!isLevelReady && !isCompleted) {
          return { status: 'locked' as const, stars: 0 };
        }
      }

      if (isCompleted) {
        return { status: 'completed' as const, stars };
      }

      // If we haven't found the active node yet, this is the current active stage
      if (firstIncompleteIndex === -1) {
        firstIncompleteIndex = index;
        return { status: 'active' as const, stars };
      }

      // Stages just 1 ahead of current can be unlocked
      if (index <= firstIncompleteIndex + 1) {
        return { status: 'unlocked' as const, stars };
      }

      return { status: 'locked' as const, stars: 0 };
    });
  }, [skills, levelInfo]);

  const handleStagePress = (stage: AdventureStage, isLocked: boolean) => {
    if (isLocked) {
      audioManager.playWrongSound();
      return;
    }
    audioManager.playTapSound();
    onSelectStage(stage.gameId, stage.title);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <View>
            <Text style={styles.mapTitle}>Adventure World Map</Text>
            <Text style={styles.mapSubtitle}>Follow the path to Champion Castle!</Text>
          </View>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>LEVEL {levelInfo.level || 1} 🌟</Text>
        </View>
      </View>

      {/* Map Trail Path */}
      <View style={styles.pathContainer}>
        {ADVENTURE_STAGES.map((stage, index) => {
          const state = stageStates[index];
          const isLocked = state.status === 'locked';
          const isActive = state.status === 'active';
          const isCompleted = state.status === 'completed';

          // Zig-zag offset: alternating left, center, right
          const alignmentStyle =
            index % 3 === 0
              ? styles.alignLeft
              : index % 3 === 1
              ? styles.alignRight
              : styles.alignCenter;

          return (
            <View key={stage.id} style={styles.stageRowWrapper}>
              {/* Connector Trail to Next Stage */}
              {index < ADVENTURE_STAGES.length - 1 && (
                <View style={styles.trailConnector}>
                  <View style={styles.trailDot} />
                  <View style={styles.trailDot} />
                  <View style={styles.trailDot} />
                </View>
              )}

              {/* Node Card */}
              <View style={[styles.nodeWrapper, alignmentStyle]}>
                {/* Active Avatar Pin */}
                {isActive && (
                  <Animated.View style={[styles.avatarPin, avatarAnimStyle]}>
                    <View style={styles.avatarBubble}>
                      <Text style={styles.avatarPinText}>{avatar}</Text>
                    </View>
                    <View style={styles.pinCallout}>
                      <Text style={styles.pinCalloutText}>YOU ARE HERE! 📍</Text>
                    </View>
                  </Animated.View>
                )}

                <Pressable
                  onPress={() => handleStagePress(stage, isLocked)}
                  style={({ pressed }) => [
                    styles.nodeButton,
                    isLocked && styles.nodeButtonLocked,
                    isActive && styles.nodeButtonActive,
                    pressed && !isLocked && styles.nodeButtonPressed,
                  ]}
                  accessibilityLabel={`Stage ${stage.number}: ${stage.title}, ${stage.landmark}. ${
                    isLocked ? 'Locked' : isCompleted ? 'Completed with stars' : 'Ready to play'
                  }`}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={
                      isLocked
                        ? ['#94A3B8', '#64748B', '#475569']
                        : stage.gradientColors
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nodeGradient}
                  >
                    {/* Node Emoji / Lock */}
                    <View style={styles.stageIconCircle}>
                      <Text style={styles.stageEmoji}>
                        {isLocked ? '🔒' : stage.emoji}
                      </Text>
                    </View>

                    {/* Stage Info */}
                    <View style={styles.stageInfo}>
                      <View style={styles.stageNumberPill}>
                        <Text style={styles.stageNumberText}>STAGE {stage.number}</Text>
                      </View>
                      <Text style={styles.stageTitle} numberOfLines={1}>
                        {stage.title}
                      </Text>
                      <Text style={styles.stageLandmark} numberOfLines={1}>
                        {stage.landmark}
                      </Text>

                      {/* Stars Rating Display */}
                      <View style={styles.starsRow}>
                        {[1, 2, 3].map((starIdx) => (
                          <Text
                            key={starIdx}
                            style={[
                              styles.starEmoji,
                              starIdx <= state.stars ? styles.starFilled : styles.starEmpty,
                            ]}
                          >
                            {starIdx <= state.stars ? '⭐' : '☆'}
                          </Text>
                        ))}
                        {isCompleted && (
                          <Text style={styles.masteredTag}>DONE ✓</Text>
                        )}
                        {isActive && (
                          <Text style={styles.playNowTag}>PLAY NOW ▶</Text>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mapIcon: {
    fontSize: 28,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F2042',
    letterSpacing: 0.3,
  },
  mapSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  levelBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  levelBadgeText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  pathContainer: {
    position: 'relative',
    paddingVertical: 8,
  },
  stageRowWrapper: {
    marginBottom: 20,
    position: 'relative',
  },
  alignLeft: {
    alignSelf: 'flex-start',
    width: '92%',
  },
  alignRight: {
    alignSelf: 'flex-end',
    width: '92%',
  },
  alignCenter: {
    alignSelf: 'center',
    width: '95%',
  },
  nodeWrapper: {
    position: 'relative',
  },
  avatarPin: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  avatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  avatarPinText: {
    fontSize: 20,
  },
  pinCallout: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 2,
  },
  pinCalloutText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  nodeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeButtonActive: {
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 7,
  },
  nodeButtonLocked: {
    opacity: 0.65,
    shadowOpacity: 0.05,
  },
  nodeButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  nodeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 12,
  },
  stageIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageEmoji: {
    fontSize: 26,
  },
  stageInfo: {
    flex: 1,
  },
  stageNumberPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  stageNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stageTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  stageLandmark: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starEmoji: {
    fontSize: 13,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  masteredTag: {
    marginLeft: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  playNowTag: {
    marginLeft: 6,
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  trailConnector: {
    position: 'absolute',
    bottom: -18,
    left: '50%',
    marginLeft: -4,
    height: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  trailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
});
