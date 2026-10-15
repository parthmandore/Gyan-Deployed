/**
 * Purpose: Complete Session Complete Screen for Vowel & Matra Match.
 *          Celebrates vowel & matra achievements with stars, accuracy, and XP,
 *          submits session progress to local store, and provides explicit navigation
 *          to replay, choose another game, or return to dashboard.
 * Module: Vowel Matra Match
 * Folder: frontend/src/screens/games/VowelMatraMatch
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useVowelMatraMatchStore } from './store/vowelMatraMatchStore';
import { VowelMatraMatchStackParamList } from './types';
import { GameSessionCompleteView } from '../../../components';
import { GameAnalysisReportModal, GameQuestionReportItem } from '../../../components/GameAnalysisReportModal';
import { useProgressStore } from '../../../state/useProgressStore';
import { useAppLanguageStore } from '../../../state/appLanguageStore';

type NavProp = NativeStackNavigationProp<VowelMatraMatchStackParamList>;
type RouteProps = RouteProp<VowelMatraMatchStackParamList, 'VowelMatraMatchSessionComplete'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();

  const [showReportModal, setShowReportModal] = useState(false);

  const routeParams = route.params || {
    starsEarned: 3,
    xpEarned: 110,
    itemsCorrect: 11,
    sessionLength: 11,
    accuracy: 100,
    durationSeconds: 60,
    sessionResults: [],
  };

  const {
    starsEarned = 3,
    xpEarned = 110,
    itemsCorrect = 11,
    sessionLength = 11,
    accuracy = 100,
    durationSeconds = 60,
    sessionResults = [],
  } = routeParams;

  const finalXpEarned = xpEarned && xpEarned > 0 ? xpEarned : itemsCorrect * 10;
  const resetSession = useVowelMatraMatchStore((s) => s.resetSession);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'hi';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'hi';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'vowel_matra_match',
      category: 'letters_phonics',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: sessionLength,
      itemsCorrect,
      accuracy,
      starsEarned,
      xpEarned: finalXpEarned,
      durationSeconds,
    });
  }, [itemsCorrect, sessionLength, accuracy, starsEarned, finalXpEarned, durationSeconds, learningLanguage, motherTongue, selectedAge]);

  const handlePlayAgain = useCallback(() => {
    resetSession();
    navigation.navigate('VowelMatraMatchGame');
  }, [resetSession, navigation]);

  const handleChooseGame = useCallback(() => {
    resetSession();
    (navigation as any).navigate('GameCatalog');
  }, [resetSession, navigation]);

  const handleReturnToDashboard = useCallback(() => {
    resetSession();
    (navigation as any).navigate('ChildDashboard');
  }, [resetSession, navigation]);

  const reportItems: GameQuestionReportItem[] = (sessionResults.length > 0
    ? sessionResults
    : new Array(sessionLength).fill('correct')
  ).map((res, idx) => {
    const isCorrect = res === 'correct';
    return {
      roundNumber: idx + 1,
      questionLabel: `Vowel & Matra Pair ${idx + 1}`,
      userAnswer: isCorrect ? 'Matched correctly' : 'Needs practice',
      correctAnswer: 'Correct Match',
      isCorrect,
      attemptsCount: isCorrect ? 1 : 2,
      xpEarned: isCorrect ? 10 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <GameSessionCompleteView
        gameTitle={t('games.vowelMatraMatch.title', 'Vowel & Matra Match')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracy}
        xpEarned={finalXpEarned}
        sessionResults={sessionResults}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleChooseGame}
        onReturnToDashboard={handleReturnToDashboard}
        onViewReport={() => setShowReportModal(true)}
        bgTheme="evening"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.vowelMatraMatch.title', 'Vowel & Matra Match')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'VowelMatraMatchSessionCompleteScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
