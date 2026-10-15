/**
 * Purpose: Session Complete and Rewards screen for Put in Order.
 *          Celebrates sequencing completion with 3-star rating, XP summary,
 *          spoken praise, and replay / catalog / dashboard navigation.
 * Module: Put in Order — Session Complete Screen
 * Folder: frontend/src/screens/games/PutInOrder
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
import { usePutInOrderStore } from './store/usePutInOrderStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { PutInOrderStackParamList, OrderItem } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<
  PutInOrderStackParamList,
  'PutInOrderSessionComplete'
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

  const resetGame = usePutInOrderStore((s) => s.resetGame);
  const attempts = usePutInOrderStore((s) => s.attempts);
  const rounds = usePutInOrderStore((s) => s.rounds);

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
      gameId: 'put_in_order',
      category: 'reasoning_logic',
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
      'putInOrder.sessionCompletePraise',
      'You are an ordering champion!'
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
      screen: 'PutInOrderGame' as any,
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

  const reportItems: GameQuestionReportItem[] = attempts.map((att) => {
    const roundNum = att.roundIndex + 1;
    const r = rounds.find((rnd) => rnd.roundNumber === roundNum);
    const targetOrder = r ? r.items.map((it: OrderItem) => it.display).join(' ➔ ') : 'In order';
    return {
      roundNumber: roundNum,
      questionLabel: `Round ${roundNum} (${r?.type || 'Sequence'}): ${targetOrder}`,
      userAnswer: att.isCorrect ? 'Correct Order ✓' : 'Out of order',
      correctAnswer: targetOrder,
      isCorrect: att.isCorrect,
      attemptsCount: 1,
      xpEarned: att.isCorrect ? 15 : 0,
    };
  });

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.putInOrder.title', 'Put in Order')}
        starsEarned={starCount}
        itemsCorrect={correctAnswers}
        sessionLength={totalQuestions}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={reportItems.length > 0 ? () => setShowReportModal(true) : undefined}
        bgTheme="puzzle"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.putInOrder.title', 'Put in Order')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'PutInOrderSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
