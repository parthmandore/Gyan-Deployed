/**
 * Purpose: Session Complete and Rewards Screen for Alphabet Matching.
 *          Celebrates letter achievements with stars, XP breakdown, praise,
 *          and explicit navigation to replay, choose another game, or return to dashboard.
 * Module: Alphabet Matching — Screens
 * Folder: frontend/src/screens/games/AlphabetMatching
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAlphabetMatchingStore } from './store/alphabetMatchingStore';
import { useSpeechPlaybackStore } from './store/speechPlaybackStore';
import { AlphabetMatchingStackParamList, GameMode } from './types';
import { GameSessionCompleteView } from '../../../components';
import { GameAnalysisReportModal, GameQuestionReportItem } from '../../../components/GameAnalysisReportModal';
import { buildStandardizedReportItems } from '../../../utils/gameReportAdapter';
import { useProgressStore } from '../../../state/useProgressStore';
import { useAppLanguageStore } from '../../../state/appLanguageStore';
import { navigateToGameCatalog, navigateToChildDashboard } from '../../../navigation/navigationHelpers';

type NavigationProp = NativeStackNavigationProp<
  AlphabetMatchingStackParamList,
  'AlphabetMatchingSessionComplete'
>;
type RouteProps = RouteProp<
  AlphabetMatchingStackParamList,
  'AlphabetMatchingSessionComplete'
>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const [showReportModal, setShowReportModal] = useState(false);

  const routeParams = route.params;
  const storeItemsCorrect = useAlphabetMatchingStore((state) => state.itemsCorrect);
  const storeSessionLength = useAlphabetMatchingStore((state) => state.sessionLength) || 10;
  const mode = useAlphabetMatchingStore((state) => state.mode);
  const setMode = useAlphabetMatchingStore((state) => state.setMode);
  const resetSession = useAlphabetMatchingStore((state) => state.resetSession);
  const resetPlaybackState = useSpeechPlaybackStore((state) => state.resetPlaybackState);

  const isAbandoned = routeParams?.isAbandoned === true;
  const itemsCorrect = routeParams?.itemsCorrect !== undefined ? routeParams.itemsCorrect : storeItemsCorrect;
  const sessionLength = routeParams?.sessionLength !== undefined ? routeParams.sessionLength : storeSessionLength;
  const itemsAttempted = routeParams?.itemsAttempted !== undefined ? routeParams.itemsAttempted : sessionLength;
  const sessionResults = routeParams?.sessionResults || [];
  const rounds = routeParams?.rounds || [];

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const capturedModeRef = useRef<GameMode>(mode);
  const hasSubmittedRef = useRef(false);

  const effectiveAttempted = isAbandoned ? itemsAttempted : sessionLength;
  const accuracyFraction = effectiveAttempted > 0 ? itemsCorrect / effectiveAttempted : 0;
  const accuracyPercentage = routeParams?.accuracy !== undefined
    ? Math.round(routeParams.accuracy)
    : Math.round(accuracyFraction * 100);

  const starsEarned = routeParams?.starsEarned !== undefined
    ? routeParams.starsEarned
    : isAbandoned
    ? (itemsCorrect >= 3 ? 2 : itemsCorrect >= 1 ? 1 : 0)
    : (accuracyPercentage >= 80 ? 3 : accuracyPercentage >= 50 ? 2 : 1);

  const xpEarned = routeParams?.xpEarned !== undefined
    ? routeParams.xpEarned
    : isAbandoned
    ? itemsCorrect * 15
    : (itemsCorrect * 15 + (accuracyPercentage === 100 ? 25 : 0) + 20);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'alphabet_matching',
      category: 'letters_phonics',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: effectiveAttempted,
      itemsCorrect,
      accuracy: accuracyPercentage,
      starsEarned,
      xpEarned,
      durationSeconds: routeParams?.durationSeconds || 60,
      isAbandoned,
      completed: !isAbandoned,
    });
  }, [itemsCorrect, effectiveAttempted, accuracyPercentage, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge, routeParams, isAbandoned]);

  const handlePlayAgain = useCallback(() => {
    const previousMode = capturedModeRef.current;
    resetSession();
    resetPlaybackState();
    if (previousMode) setMode(previousMode);
    navigation.navigate('AlphabetMatchingGame');
  }, [resetSession, resetPlaybackState, setMode, navigation]);

  const handleChooseGame = useCallback(() => {
    resetSession();
    resetPlaybackState();
    navigateToGameCatalog(navigation);
  }, [resetSession, resetPlaybackState, navigation]);

  const handleReturnToDashboard = useCallback(() => {
    resetSession();
    resetPlaybackState();
    navigateToChildDashboard(navigation);
  }, [resetSession, resetPlaybackState, navigation]);

  const reportSummary = buildStandardizedReportItems({
    sessionLength,
    itemsAttempted,
    isAbandoned,
    rounds,
    sessionResults,
    getQuestionLabel: (r, i) => `Letter Target: "${r?.target_letter || `Letter ${i + 1}`}"`,
    getCorrectAnswer: (r) => r?.target_letter || 'Letter',
  });
  const reportItems = reportSummary.items;

  return (
    <View style={styles.container}>
      <GameSessionCompleteView
        gameTitle={t('games.alphabetMatching.title', 'Alphabet Matching')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracyPercentage}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleChooseGame}
        onReturnToDashboard={handleReturnToDashboard}
        onViewReport={() => setShowReportModal(true)}
        bgTheme="hub"
        isAbandoned={isAbandoned}
        itemsAttempted={itemsAttempted}
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.alphabetMatching.title', 'Alphabet Matching')}
        isAbandoned={isAbandoned}
        totalQuestions={reportSummary.totalQuestions}
        questionsAttempted={reportSummary.questionsAttempted}
        firstTryCorrectCount={reportSummary.firstTryCorrectCount}
        correctedAfterRetryCount={reportSummary.correctedAfterRetryCount}
        stillIncorrectCount={reportSummary.stillIncorrectCount}
        unansweredCount={reportSummary.unansweredCount}
        accuracy={accuracyPercentage ?? reportSummary.accuracy}
        xpEarned={xpEarned}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'AlphabetMatchingSessionCompleteScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
