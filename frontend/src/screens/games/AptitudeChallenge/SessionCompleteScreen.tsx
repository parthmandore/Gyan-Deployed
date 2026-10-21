/**
 * Purpose: Session Complete and Rewards Screen for Aptitude & Logical Thinking Games.
 *          Celebrates brain-training achievements with stars, XP breakdown, spoken praise,
 *          and navigation to replay, games catalog, or dashboard.
 * Module: Aptitude Challenge — Screens
 * Folder: frontend/src/screens/games/AptitudeChallenge
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GameSessionCompleteView } from '../../../components';
import { navigateToGameCatalog, navigateToChildDashboard } from '../../../navigation/navigationHelpers';
import { GameAnalysisReportModal, GameQuestionReportItem } from '../../../components/GameAnalysisReportModal';
import { buildStandardizedReportItems } from '../../../utils/gameReportAdapter';
import { useAppLanguageStore } from '../../../state/appLanguageStore';
import { useProgressStore } from '../../../state/useProgressStore';
import { useAptitudeGameStore } from './store/useAptitudeGameStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { AptitudeChallengeStackParamList, AptitudeGameType } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<
  AptitudeChallengeStackParamList,
  'AptitudeChallengeSessionComplete'
>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 6;

  const resetSession = useAptitudeGameStore((s) => s.resetSession);
  const attempts = useAptitudeGameStore((s) => s.attempts);

  const {
    gameType = 'pattern_match' as AptitudeGameType,
    starsEarned = 3,
    xpEarned = 50,
    itemsCorrect = 5,
    sessionLength = 5,
    accuracy = 100,
  } = (route.params as any) || {};
  const isAbandoned = ((route.params as any) || {}).isAbandoned === true;
  const itemsAttempted = ((route.params as any) || {}).itemsAttempted !== undefined ? ((route.params as any) || {}).itemsAttempted : sessionLength;

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: gameType || 'pattern_match',
      category: 'reasoning_logic',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: isAbandoned ? itemsAttempted : sessionLength,
      isAbandoned,
      completed: !isAbandoned,
      itemsCorrect,
      accuracy,
      starsEarned,
      xpEarned,
      durationSeconds: 60,
    });
  }, [gameType, itemsCorrect, sessionLength, accuracy, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    if (!isAbandoned) {
      const praiseText = t('aptitudeChallenge.sessionCompletePraise', { lng: motherTongue });
    speakPhrase(praiseText, { language: motherTongue });
    }

    const unsubscribe = navigation.addListener('beforeRemove', () => {
      stopSpeech();
    });

    return () => {
      unsubscribe();
      stopSpeech();
    };
  }, [motherTongue, navigation, t]);

  const handlePlayAgain = () => {
    stopSpeech();
    resetSession();
    navigation.navigate('Games', {
      screen: 'AptitudeChallengeGame' as any,
      params: { gameType },
    });
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetSession();
    navigateToChildDashboard(navigation);
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetSession();
    navigateToGameCatalog(navigation);
  };

  const reportSummary = buildStandardizedReportItems({
    sessionLength,
    itemsAttempted,
    isAbandoned,
    attempts,
    fallbackLabelPrefix: 'Puzzle Round',
  });
  const reportItems = reportSummary.items;

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t(`games.${gameType}.title`, 'Reasoning & Logic')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        isAbandoned={isAbandoned}
        itemsAttempted={itemsAttempted}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={() => setShowReportModal(true)}
        bgTheme="puzzle"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t(`games.${gameType}.title`, 'Reasoning & Logic')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'AptitudeChallengeSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
