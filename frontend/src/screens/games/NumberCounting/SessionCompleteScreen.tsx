/**
 * Purpose: Session Complete and Rewards screen for Number Counting.
 *          Celebrates counting completion with 3-star rating, XP summary,
 *          spoken praise, and replay / catalog / dashboard navigation.
 * Module: Number Counting — Session Complete Screen
 * Folder: frontend/src/screens/games/NumberCounting
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GameSessionCompleteView } from '../../../components';
import { GameAnalysisReportModal, GameQuestionReportItem } from '../../../components/GameAnalysisReportModal';
import { useAppLanguageStore } from '../../../state/appLanguageStore';
import { useProgressStore } from '../../../state/useProgressStore';
import { useNumberCountingStore } from './store/useNumberCountingStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { NumberCountingStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<
  NumberCountingStackParamList,
  'NumberCountingSessionComplete'
>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const resetGame = useNumberCountingStore((s) => s.resetGame);
  const attempts = useNumberCountingStore((s) => s.attempts);

  const {
    totalQuestions = 5,
    correctAnswers = 5,
    xpEarned = 75,
    durationSeconds = 30,
  } = (route.params as any) || {};

  const accuracy = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
  const starCount = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'number_counting',
      category: 'mathematics',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: totalQuestions,
      itemsCorrect: correctAnswers,
      accuracy,
      starsEarned: starCount,
      xpEarned,
      durationSeconds,
    });
  }, [correctAnswers, totalQuestions, accuracy, starCount, xpEarned, durationSeconds, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    const praiseText = t(
      'numberCounting.sessionCompletePraise',
      'You are a counting champion!'
    );
    speakPhrase(praiseText, { language: motherTongue });

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
    resetGame();
    navigation.navigate('Games', {
      screen: 'NumberCountingGame' as any,
    });
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetGame();
    navigation.navigate('ChildDashboard' as any);
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetGame();
    navigation.navigate('GameCatalog' as any);
  };

  const reportItems: GameQuestionReportItem[] = attempts.map((att) => ({
    roundNumber: att.roundIndex + 1,
    questionLabel: `Round ${att.roundIndex + 1}: Count Objects`,
    userAnswer: String(att.selectedNumber),
    correctAnswer: String(att.correctNumber),
    isCorrect: att.isCorrect,
    attemptsCount: 1,
    xpEarned: att.isCorrect ? 15 : 0,
  }));

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.numberCounting.title', 'Number Counting')}
        starsEarned={starCount}
        itemsCorrect={correctAnswers}
        sessionLength={totalQuestions}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={reportItems.length > 0 ? () => setShowReportModal(true) : undefined}
        bgTheme="math"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.numberCounting.title', 'Number Counting')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'NumberCountingSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
