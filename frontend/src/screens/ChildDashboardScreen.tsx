/**
 * Purpose: Central Child Dashboard Screen for Gyannn ("The Living Learning World").
 *          Redesigned as a personal learning adventure home.
 *          The first viewport immediately communicates:
 *          1. Who the child is & their level + XP + streak (ChildHeader)
 *          2. Next recommended activity (ContinueLearningCard: "✨ YOUR NEXT QUEST")
 *          3. Available learning adventures (Explore All Adventures Portal CTA)
 *          Followed by Today's Adventure Quest Board, Learning Journey, Trophy Shelf, and Adventure Trail.
 * Module: Screens
 * Folder: frontend/src/screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import {
  CartoonBackground,
  ResponsiveContainer,
  BigTouchTarget,
  LevelUpCelebrationModal,
} from '../components';
import { ChildHeader } from '../components/dashboard/ChildHeader';
import { TodayMissionsCard } from '../components/dashboard/TodayMissionsCard';
import { ContinueLearningCard } from '../components/dashboard/ContinueLearningCard';
import { SkillProgressSection } from '../components/dashboard/SkillProgressSection';
import { AchievementsGallery } from '../components/dashboard/AchievementsGallery';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { ProfileSettingsModal } from '../components/dashboard/ProfileSettingsModal';
import { RewardChestModal } from '../components/dashboard/RewardChestModal';
import { speakPhrase } from '../services/speechService';

import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import { useChildProfileStore } from '../state/childProfileStore';
import { dashboardService, DashboardPayload, TodayMission } from '../services/dashboardService';
import { audioManager } from '../services/audioManager';
import { RootStackParamList } from '../types';
import { GAME_REGISTRY } from '../config/gameRegistry';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChildDashboard'>;

export const ChildDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const profile = useChildProfileStore();
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [celebratedLevel, setCelebratedLevel] = useState<number | null>(null);

  const checkLevelUp = useCallback(async (level: number) => {
    try {
      const storageKey = `@gyan_celebrated_level_${profile.childId || 'default'}`;
      let lastCelebrated: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        lastCelebrated = window.localStorage.getItem(storageKey);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        lastCelebrated = await AsyncStorage.getItem(storageKey);
      }

      const lastLevelNum = lastCelebrated ? parseInt(lastCelebrated, 10) : 1;

      if (level > 1 && level > lastLevelNum) {
        setCelebratedLevel(level);
        setShowLevelUpModal(true);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(storageKey, level.toString());
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(storageKey, level.toString());
        }
      } else if (!lastCelebrated) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(storageKey, level.toString());
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(storageKey, level.toString());
        }
      }
    } catch {}
  }, [profile.childId]);

  const loadData = useCallback(async () => {
    try {
      const data = await dashboardService.fetchDashboard(profile.childId);
      setDashboardData(data);
      if (data?.xp?.level) {
        checkLevelUp(data.xp.level);
      }
    } catch (e) {
      console.warn('[ChildDashboardScreen] Error fetching dashboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [profile.childId, checkLevelUp]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      audioManager.startBackgroundMusic();
      loadData();
    }, [loadData])
  );

  const handleLaunchGame = (gameId: string, route?: string, routeParams?: Record<string, any>) => {
    audioManager.playTapSound();

    let targetRoute = route;
    let targetParams = routeParams;

    if (!targetRoute) {
      const found = GAME_REGISTRY.find((g) => g.id === gameId);
      if (found) {
        targetRoute = found.navigatorRoute;
        targetParams = found.routeParams;
      }
    }

    if (targetRoute) {
      (navigation as any).navigate('Games', {
        screen: targetRoute,
        params: targetParams,
      });
    } else {
      // Fallback: explore catalog
      navigation.navigate('GameCatalog');
    }
  };

  const handleMissionSelect = (mission: TodayMission) => {
    handleLaunchGame(mission.game_id);
  };

  if (isLoading || !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <CartoonBackground theme="hub" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Opening your learning adventure... 🌟</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <CartoonBackground theme="hub" />

      <SafeAreaView style={styles.safeArea}>
        <ResponsiveContainer maxWidth="standard" padding="sm">
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. HERO HEADER: Personal Greeting, Avatar, Level, XP Capsule Bar & Streak */}
            <ChildHeader
              name={profile.name}
              avatar={profile.avatar}
              levelInfo={dashboardData.xp}
              onPressProfile={() => setShowSettingsModal(true)}
              onPressSettings={() => setShowSettingsModal(true)}
            />

            {/* 2. RECOMMENDED NEXT ACTIVITY: Immediate high-value next quest */}
            <ContinueLearningCard
              recommendation={dashboardData.continue_learning}
              onPlayNow={() =>
                handleLaunchGame(
                  dashboardData.continue_learning.game_id,
                  dashboardData.continue_learning.route,
                  dashboardData.continue_learning.routeParams
                )
              }
            />

            {/* 3. AVAILABLE LEARNING ADVENTURES: Direct route to 19-game catalog */}
            <View style={styles.portalCtaContainer}>
              <BigTouchTarget
                onPress={() => {
                  audioManager.playTapSound();
                  navigation.navigate('GameCatalog');
                }}
                style={styles.portalCtaBtn}
                accessibilityLabel="Explore all 19 games in the catalog"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.portalGradient}
                >
                  <View style={styles.portalIconCircle}>
                    <Text style={styles.portalEmoji}>🎮</Text>
                  </View>

                  <View style={styles.portalTextCol}>
                    <Text style={styles.portalTitle} numberOfLines={1}>
                      EXPLORE ALL ADVENTURES 🌟
                    </Text>
                    <Text style={styles.portalSubtitle} numberOfLines={1}>
                      Discover all 19 fun games & challenges →
                    </Text>
                  </View>
                </LinearGradient>
              </BigTouchTarget>
            </View>

            {/* 4. TODAY'S ADVENTURE: 3 Daily Quests + Mystery Chest Banner */}
            <TodayMissionsCard
              missions={dashboardData.today_journey}
              onSelectMission={handleMissionSelect}
              onPressReward={() => {
                const completedCount = dashboardData.today_journey.filter((m) => m.status === 'completed').length;
                const totalMissions = dashboardData.today_journey.length || 3;
                if (completedCount >= totalMissions) {
                  setShowRewardModal(true);
                } else {
                  audioManager.playTapSound();
                  const remaining = totalMissions - completedCount;
                  speakPhrase(
                    `Complete ${remaining} more ${remaining === 1 ? 'quest' : 'quests'} today to unlock the Mystery Chest!`
                  );
                }
              }}
            />

            {/* 5. LEARNING JOURNEY: 8 Colorful Realm Islands */}
            <SkillProgressSection
              skills={dashboardData.skills}
              onSelectSkill={() => {
                audioManager.playTapSound();
                navigation.navigate('GameCatalog');
              }}
            />

            {/* 6. TROPHY SHELF: Collectible Badges on Wooden/Golden Shelf */}
            <AchievementsGallery achievements={dashboardData.achievements} />

            {/* 7. ADVENTURE TRAIL: Recent Milestone Activity Timeline */}
            <RecentActivityList activities={dashboardData.recent_activity} />
          </ScrollView>
        </ResponsiveContainer>
      </SafeAreaView>

      {/* Mystery Reward Chest Modal */}
      <RewardChestModal
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        onRewardClaimed={() => {
          loadData();
        }}
      />

      {/* Authentic Level-Up Celebration Modal */}
      {celebratedLevel && (
        <LevelUpCelebrationModal
          visible={showLevelUpModal}
          newLevel={celebratedLevel}
          totalXp={dashboardData.xp.total_xp}
          onDismiss={() => setShowLevelUpModal(false)}
        />
      )}

      {/* Profile & Language Settings Modal */}
      <ProfileSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSaved={loadData}
        onLogout={() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#38BDF8',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
  },
  loadingText: {
    color: '#1E1B4B',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
  },
  scrollContent: {
    paddingTop: WorldSpacing.xs,
    paddingBottom: 40,
  },

  /* Primary Adventure Portal CTA */
  portalCtaContainer: {
    marginBottom: WorldSpacing.sm,
    borderRadius: WorldRadii.island,
    overflow: 'hidden',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  portalCtaBtn: {
    borderRadius: WorldRadii.island,
  },
  portalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: WorldRadii.island,
    borderBottomWidth: 4,
    borderBottomColor: '#4C1D95',
  },
  portalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  portalEmoji: {
    fontSize: 24,
  },
  portalTextCol: {
    flex: 1,
    minWidth: 0,
  },
  portalTitle: {
    color: '#FFFFFF',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  portalSubtitle: {
    color: '#DDD6FE',
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
