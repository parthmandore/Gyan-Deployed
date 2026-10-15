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
import { useProgressStore } from '../../../state/useProgressStore';
import { useAppLanguageStore } from '../../../state/appLanguageStore';

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

  const itemsCorrect = routeParams?.itemsCorrect !== undefined ? routeParams.itemsCorrect : storeItemsCorrect;
  const sessionLength = routeParams?.sessionLength !== undefined ? routeParams.sessionLength : storeSessionLength;
  const sessionResults = routeParams?.sessionResults || [];
  const rounds = routeParams?.rounds || [];

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const capturedModeRef = useRef<GameMode>(mode);
  const hasSubmittedRef = useRef(false);

  const accuracyFraction = sessionLength > 0 ? itemsCorrect / sessionLength : 0;
  const accuracyPercentage = routeParams?.accuracy !== undefined ? Math.round(routeParams.accuracy) : Math.round(accuracyFraction * 100);
  const starsEarned = routeParams?.starsEarned !== undefined ? routeParams.starsEarned : (accuracyPercentage >= 80 ? 3 : accuracyPercentage >= 50 ? 2 : 1);
  const xpEarned = routeParams?.xpEarned !== undefined ? routeParams.xpEarned : (itemsCorrect * 15 + (accuracyPercentage === 100 ? 25 : 0) + 20);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'alphabet_matching',
      category: 'letters_phonics',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: sessionLength,
      itemsCorrect,
      accuracy: accuracyPercentage,
      starsEarned,
      xpEarned,
      durationSeconds: routeParams?.durationSeconds || 60,
    });
  }, [itemsCorrect, sessionLength, accuracyPercentage, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge, routeParams]);

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
    (navigation as any).navigate('GameCatalog');
  }, [resetSession, resetPlaybackState, navigation]);

  const handleReturnToDashboard = useCallback(() => {
    resetSession();
    resetPlaybackState();
    (navigation as any).navigate('ChildDashboard');
  }, [resetSession, resetPlaybackState, navigation]);

  const reportItems: GameQuestionReportItem[] = (rounds.length > 0 ? rounds : new Array(sessionLength).fill(null)).map((r, i) => {
    const targetLetter = r?.target_letter || `Letter ${i + 1}`;
    const isCorrect = sessionResults[i] ? sessionResults[i] === 'correct' : i < itemsCorrect;
    return {
      roundNumber: i + 1,
      questionLabel: `Letter Target: "${targetLetter}"`,
      userAnswer: isCorrect ? targetLetter : 'Needs practice',
      correctAnswer: targetLetter,
      isCorrect,
      attemptsCount: isCorrect ? 1 : 2,
      xpEarned: isCorrect ? 15 : 0,
    };
  });

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
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.alphabetMatching.title', 'Alphabet Matching')}
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
