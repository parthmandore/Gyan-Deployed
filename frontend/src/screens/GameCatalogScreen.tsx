/**
 * Purpose: Interactive Game Discovery Experience for Gyannn ("The Living Learning World").
 *          Phase 3 Complete Implementation:
 *          - Illustrated Adventure Map & Connected Realm Destinations
 *          - 8 Distinct Thematic Learning Realms (Letters, Reading, Vocab, Speech, Math, Logic, Shapes, Grammar)
 *          - In-Place Age Personalization Switcher (Ages 5, 6, 7, 8)
 *          - Real Progress & Mastery Integration from local progress store (no fake stats)
 *          - Tactile Level 3 3D Game Landmark Cards with 3D bevels & saturated gradients
 *          - Debounced Navigation Protection & Route Contracts
 *          - Multi-Viewport Responsive Layout (320px to 1280px)
 * Module: Screens
 * Folder: frontend/src/screens
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import {
  BigTouchTarget,
  CartoonBackground,
  ResponsiveContainer,
  IslandPanel,
  AudioControlPill,
} from '../components';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import {
  GAME_REGISTRY,
  GameRegistryEntry,
  LearningRealm,
  getGameRealm,
} from '../config/gameRegistry';
import { useAppLanguageStore, AppAge, AppLanguage } from '../state/appLanguageStore';
import { useProgressStore } from '../state/useProgressStore';
import { RootStackParamList } from '../types';
import { audioManager } from '../services/audioManager';
import { navigateToChildDashboard } from '../navigation/navigationHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GameCatalog'>;

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

const ALL_REALMS: readonly LearningRealm[] = [
  'letters_phonics',
  'reading_words',
  'vocabulary',
  'mathematics',
  'reasoning_logic',
  'shapes_colours',
  'grammar_syntax',
];

export const GameCatalogScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedLanguage = useAppLanguageStore((s) => s.selectedLanguage) || motherTongue;
  const selectedAge = (useAppLanguageStore((s) => s.selectedAge) || 5) as AppAge;
  const setSelectedLanguage = useAppLanguageStore((s) => s.setSelectedLanguage);
  const setSelectedAge = useAppLanguageStore((s) => s.setSelectedAge);

  const history = useProgressStore((s) => s.history) || [];
  const isNavigatingRef = useRef(false);

  const [activeRealmFilter, setActiveRealmFilter] = useState<'all' | LearningRealm>('all');

  useEffect(() => {
    useProgressStore.getState().initProgress();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      audioManager.startBackgroundMusic();
    }, [])
  );

  // Compute map of game history for O(1) live progress calculation
  const historyStats = useMemo(() => {
    const map = new Map<string, { count: number; bestStars: number; bestAccuracy: number }>();
    for (const h of history) {
      const existing = map.get(h.gameId);
      if (!existing) {
        map.set(h.gameId, {
          count: 1,
          bestStars: h.starsEarned || 0,
          bestAccuracy: h.accuracy || 0,
        });
      } else {
        existing.count += 1;
        existing.bestStars = Math.max(existing.bestStars, h.starsEarned || 0);
        existing.bestAccuracy = Math.max(existing.bestAccuracy, h.accuracy || 0);
      }
    }
    return map;
  }, [history]);

  // Available games filtered by language and selected age
  const availableGames = useMemo(() => {
    return GAME_REGISTRY.filter((game) => {
      const supportsLanguage =
        game.supportedLanguages.includes(selectedLanguage) ||
        game.supportedLanguages.includes(learningLanguage) ||
        game.supportedLanguages.includes(motherTongue);
      const supportsAge = game.ageGroups.includes(selectedAge);
      return supportsLanguage && supportsAge;
    });
  }, [selectedLanguage, learningLanguage, motherTongue, selectedAge]);

  // Group available games by realm
  const realmGroups = useMemo(() => {
    return ALL_REALMS.map((realmKey) => {
      const games = availableGames.filter((g) => getGameRealm(g) === realmKey);
      const completedCount = games.filter((g) => historyStats.has(g.id)).length;
      return {
        key: realmKey,
        meta: WorldPalettes.realms[realmKey],
        games,
        completedCount,
      };
    }).filter((r) => r.games.length > 0);
  }, [availableGames, historyStats]);

  // Automatically reset filter if active realm has 0 games in selected age
  useEffect(() => {
    if (activeRealmFilter !== 'all') {
      const exists = realmGroups.some((r) => r.key === activeRealmFilter);
      if (!exists) {
        setActiveRealmFilter('all');
      }
    }
  }, [activeRealmFilter, realmGroups]);

  // Handle game launch with debounce protection
  const handleOpenGame = (game: GameRegistryEntry) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    audioManager.playTapSound();
    navigation.navigate('Games', {
      screen: game.navigatorRoute as any,
      params: game.routeParams || undefined,
    });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);
  };

  // Deterministic Back behavior: GameCatalog Back ALWAYS returns directly to ChildDashboard
  const handleGoBack = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    audioManager.playTapSound();
    navigateToChildDashboard(navigation);
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 800);
  }, [navigation]);

  // Android hardware Back handler consistent with visible button
  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  // Quick in-place language cycle
  const handleToggleLanguage = () => {
    audioManager.playTapSound();
    const nextLang: Record<AppLanguage, AppLanguage> = {
      en: 'hi',
      hi: 'mr',
      mr: 'en',
    };
    const target = nextLang[selectedLanguage as AppLanguage] || 'en';
    setSelectedLanguage(target);
  };

  // Filter realms to display based on active filter
  const displayedRealms = useMemo(() => {
    if (activeRealmFilter === 'all') {
      return realmGroups;
    }
    return realmGroups.filter((r) => r.key === activeRealmFilter);
  }, [activeRealmFilter, realmGroups]);

  // Responsive grid calculation:
  // Mobile portrait (360px-430px) strictly displays 2 columns.
  // Tablets / wider screens (>= 600px) display 3 columns, and (>= 880px) 4 columns.
  const maxW = Math.min(screenWidth, 980);
  const containerPadding = screenWidth < 380 ? 10 : 16;
  const availableGridWidth = maxW - containerPadding * 2;
  const numColumns = availableGridWidth >= 880 ? 4 : availableGridWidth >= 600 ? 3 : 2;
  const gridGap = screenWidth < 380 ? 10 : 12;
  const cardWidth = Math.floor((availableGridWidth - (numColumns - 1) * gridGap - 2) / numColumns);
  const currentLangLabel = LANGUAGE_LABELS[selectedLanguage] || 'English';

  return (
    <View style={styles.webOuterContainer}>
      {/* Living World Background */}
      <CartoonBackground theme="hub" />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0E7490" />

        <ResponsiveContainer maxWidth="wide" padding={screenWidth < 380 ? 'xs' : 'sm'}>
          {/* Top Discovery Header Island */}
          <IslandPanel
            variant="frosted"
            elevation="floating"
            style={styles.headerIsland}
            padding="sm"
          >
            {/* Row 1: Back, Title, Audio & Language */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeftRow}>
                <BigTouchTarget
                  onPress={handleGoBack}
                  accessibilityLabel={t('common.back')}
                  accessibilityRole="button"
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← {t('common.back')}</Text>
                </BigTouchTarget>

                <View style={styles.headerTextCol}>
                  <Text style={styles.headerTitleText} numberOfLines={1}>
                    {t('games.catalogTitle')}
                  </Text>
                  <Text style={styles.headerSubtitleText} numberOfLines={1}>
                    {availableGames.length} Quests • {realmGroups.length} Active Realms
                  </Text>
                </View>
              </View>

              <View style={styles.headerRightRow}>
                <AudioControlPill compact />
                <BigTouchTarget
                  onPress={handleToggleLanguage}
                  accessibilityLabel={`${t('games.changeLanguage')}, ${currentLangLabel}`}
                  accessibilityRole="button"
                  style={styles.languageSwitchButton}
                >
                  <Text style={styles.languageSwitchText}>🌐 {currentLangLabel}</Text>
                </BigTouchTarget>
              </View>
            </View>

            {/* Row 2: Prominent Age Group Selector */}
            <View style={styles.ageSelectorContainer}>
              <Text style={styles.ageSelectorLabel}>
                🎒 {t('settings.ageGroup', 'Age')}:
              </Text>
              <View style={styles.agePillsRow}>
                {([5, 6, 7, 8] as AppAge[]).map((age) => {
                  const isActive = selectedAge === age;
                  return (
                    <BigTouchTarget
                      key={age}
                      onPress={() => {
                        audioManager.playTapSound();
                        setSelectedAge(age);
                      }}
                      accessibilityLabel={`Age ${age}`}
                      accessibilityRole="button"
                      style={[
                        styles.agePill,
                        isActive && styles.agePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.agePillText,
                          isActive && styles.agePillTextActive,
                        ]}
                      >
                        {age} yrs
                      </Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>
          </IslandPanel>

          {/* Interactive Realm Map Filter Bar */}
          <View style={styles.realmFilterWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.realmFilterScroll}
            >
              {/* "All Realms" Filter Button */}
              <BigTouchTarget
                onPress={() => {
                  audioManager.playTapSound();
                  setActiveRealmFilter('all');
                }}
                accessibilityLabel="All Realms"
                accessibilityRole="button"
                style={[
                  styles.realmFilterPill,
                  activeRealmFilter === 'all' && styles.realmFilterPillActiveAll,
                ]}
              >
                <Text
                  style={[
                    styles.realmFilterPillText,
                    activeRealmFilter === 'all' && styles.realmFilterPillTextActive,
                  ]}
                >
                  🌟 {t('realms.allRealms', 'All Realms')} ({availableGames.length})
                </Text>
              </BigTouchTarget>

              {/* Dynamic Realm Filters */}
              {realmGroups.map((r) => {
                const isActive = activeRealmFilter === r.key;
                const realmName = t(`realms.${r.key}.name`, r.meta.name);
                return (
                  <BigTouchTarget
                    key={r.key}
                    onPress={() => {
                      audioManager.playTapSound();
                      setActiveRealmFilter(isActive ? 'all' : r.key);
                    }}
                    accessibilityLabel={realmName}
                    accessibilityRole="button"
                    style={[
                      styles.realmFilterPill,
                      {
                        borderColor: isActive ? r.meta.accent : r.meta.border,
                        backgroundColor: isActive ? r.meta.accent : r.meta.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.realmFilterPillText,
                        { color: isActive ? '#FFFFFF' : r.meta.text },
                      ]}
                    >
                      {r.meta.icon} {realmName} ({r.games.length})
                    </Text>
                  </BigTouchTarget>
                );
              })}
            </ScrollView>
          </View>

          {/* Main Content: Connected Realm Destinations */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(60, insets.bottom + 24) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {displayedRealms.length > 0 ? (
              displayedRealms.map((realm) => {
                const realmName = t(`realms.${realm.key}.name`, realm.meta.name);
                const realmSubtitle = t(`realms.${realm.key}.subtitle`, `${realm.games.length} learning quests`);
                const exploredPercent = Math.round(
                  (realm.completedCount / realm.games.length) * 100
                );

                return (
                  <View key={realm.key} style={styles.realmSectionContainer}>
                    {/* Thematic Realm Landmark Banner */}
                    <IslandPanel
                      variant="frosted"
                      style={[
                        styles.realmBannerIsland,
                        {
                          backgroundColor: realm.meta.bg,
                          borderColor: realm.meta.border,
                        },
                      ]}
                      padding="sm"
                    >
                      <View style={styles.realmBannerRow}>
                        <View
                          style={[
                            styles.realmBannerIconCircle,
                            { backgroundColor: realm.meta.barFill },
                          ]}
                        >
                          <Text style={styles.realmBannerIconText}>
                            {realm.meta.icon}
                          </Text>
                        </View>

                        <View style={styles.realmBannerTextCol}>
                          <Text
                            style={[
                              styles.realmBannerTitle,
                              { color: realm.meta.text },
                            ]}
                            numberOfLines={1}
                          >
                            {realmName}
                          </Text>
                          <Text
                            style={styles.realmBannerSubtitle}
                            numberOfLines={1}
                          >
                            {realmSubtitle}
                          </Text>
                          <Text style={styles.realmBannerStatsText}>
                            {realm.games.length} Quests • {realm.completedCount} Mastered
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.realmProgressPill,
                            { backgroundColor: realm.meta.accent },
                          ]}
                        >
                          <Text style={styles.realmProgressText}>
                            {exploredPercent}%
                          </Text>
                        </View>
                      </View>
                    </IslandPanel>

                    {/* Connected Grid of 3D Game Landmark Cards */}
                    <View style={[styles.gridContainer, { gap: gridGap }]}>
                      {realm.games.map((game) => {
                        const title = t(game.titleKey);
                        const description = t(game.descriptionKey);
                        const stat = historyStats.get(game.id);
                        const hasPlayed = !!stat && stat.count > 0;
                        const bestStars = stat ? stat.bestStars : 0;
                        const bestAccuracy = stat ? stat.bestAccuracy : 0;

                        return (
                          <BigTouchTarget
                            key={game.id}
                            onPress={() => handleOpenGame(game)}
                            accessibilityLabel={`${title}, ${description}`}
                            accessibilityHint={t('games.playGameHint', { game: title })}
                            accessibilityRole="button"
                            style={[
                              styles.gameCard,
                              {
                                width: cardWidth,
                                borderColor: '#FFFFFF',
                                borderBottomColor: game.bevelColor,
                              },
                            ]}
                          >
                            {/* Saturated Linear Gradient Layer */}
                            <LinearGradient
                              colors={game.gradientColors}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 0, y: 1 }}
                              style={StyleSheet.absoluteFill}
                            />

                            {/* Tactile Glass Highlight Sheen */}
                            <View style={styles.cardHighlight} />

                            {/* Header Row: Badge Tag + Real Progress */}
                            <View style={styles.cardHeaderRow}>
                              <View style={styles.badgePill}>
                                <Text style={styles.badgeText} numberOfLines={1}>
                                  {game.badgeTag}
                                </Text>
                              </View>

                              {/* Real User Progress Badge */}
                              {hasPlayed ? (
                                <View style={styles.masteredBadgePill}>
                                  <Text style={styles.masteredBadgeText}>
                                    {bestStars === 3
                                      ? '⭐⭐⭐ 100%'
                                      : `⭐ ${bestStars} (${bestAccuracy}%)`}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.newQuestBadgePill}>
                                  <Text style={styles.newQuestBadgeText}>
                                    🌟 New
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Central Icon Bubble */}
                            <View style={styles.iconCircleContainer}>
                              <View style={styles.iconCircle}>
                                <Text style={styles.iconText}>{game.iconAsset}</Text>
                              </View>
                            </View>

                            {/* Title & Description with Shadow & Drop-Protection */}
                            <View style={styles.cardBody}>
                              <Text style={styles.cardTitle} numberOfLines={2}>
                                {title}
                              </Text>
                              <Text
                                style={styles.cardDescription}
                                numberOfLines={2}
                              >
                                {description}
                              </Text>
                            </View>

                            {/* Bottom Tactile Action Button */}
                            <View style={styles.cardFooter}>
                              <View style={styles.playButtonPill}>
                                <Text style={styles.playButtonText}>
                                  {t('games.playNow', 'PLAY')} ▶
                                </Text>
                              </View>
                            </View>
                          </BigTouchTarget>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            ) : (
              <IslandPanel variant="parchment" style={styles.emptyIsland}>
                <Text style={styles.emptyIcon}>🎮</Text>
                <Text style={styles.emptyTitle}>{t('games.noGamesTitle')}</Text>
                <Text style={styles.emptySubtitle}>{t('games.noGamesDesc')}</Text>
              </IslandPanel>
            )}
          </ScrollView>
        </ResponsiveContainer>
      </SafeAreaView>
    </View>
  );
});

GameCatalogScreen.displayName = 'GameCatalogScreen';

const styles = StyleSheet.create({
  webOuterContainer: {
    flex: 1,
    backgroundColor: '#0E7490',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  headerIsland: {
    marginTop: WorldSpacing.xs,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: WorldRadii.sm,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.primary,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.sectionTitle,
    color: WorldPalettes.text.primary,
    lineHeight: 22,
  },
  headerSubtitleText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: WorldTypography.sizes.caption,
    color: WorldPalettes.text.muted,
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageSwitchButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  languageSwitchText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.caption,
    color: '#1D4ED8',
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  ageSelectorLabel: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.primary,
  },
  agePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agePill: {
    backgroundColor: '#F8FAFC',
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agePillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#3730A3',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  agePillText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    color: WorldPalettes.text.muted,
  },
  agePillTextActive: {
    color: '#FFFFFF',
  },
  realmFilterWrapper: {
    marginBottom: 8,
  },
  realmFilterScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  realmFilterPill: {
    borderRadius: WorldRadii.pill,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realmFilterPillActiveAll: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  realmFilterPillText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 13,
    color: WorldPalettes.text.primary,
  },
  realmFilterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  realmSectionContainer: {
    marginBottom: 20,
  },
  realmBannerIsland: {
    borderWidth: 2,
    borderRadius: WorldRadii.island,
    marginBottom: 10,
  },
  realmBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  realmBannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realmBannerIconText: {
    fontSize: 22,
  },
  realmBannerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  realmBannerTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 15,
    lineHeight: 18,
  },
  realmBannerSubtitle: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: WorldPalettes.text.muted,
    marginTop: 2,
  },
  realmBannerStatsText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: WorldPalettes.text.secondary,
    marginTop: 2,
  },
  realmProgressPill: {
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  realmProgressText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  gameCard: {
    minHeight: 236,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopLeftRadius: WorldRadii.island,
    borderTopRightRadius: WorldRadii.island,
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    gap: 4,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: '55%',
  },
  badgeText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 9.5,
    color: WorldPalettes.text.primary,
  },
  masteredBadgePill: {
    backgroundColor: '#FEF08A',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  masteredBadgeText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 9.5,
    color: '#854D0E',
  },
  newQuestBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: WorldRadii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newQuestBadgeText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 9.5,
    color: WorldPalettes.text.primary,
  },
  iconCircleContainer: {
    zIndex: 2,
    marginVertical: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  iconText: {
    fontSize: 28,
  },
  cardBody: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  cardTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardDescription: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    marginTop: 2,
  },
  cardFooter: {
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
    marginTop: 4,
  },
  playButtonPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.pill,
    paddingVertical: 6,
    paddingHorizontal: 16,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  playButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  emptyIsland: {
    marginTop: 40,
    alignItems: 'center',
    padding: WorldSpacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 20,
    color: WorldPalettes.text.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 14,
    color: WorldPalettes.text.muted,
    textAlign: 'center',
  },
});
