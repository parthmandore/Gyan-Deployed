/**
 * Purpose: Session Complete and Rewards Screen for Find the Correct Word.
 *          Celebrates child's achievement with animated stars, XP breakdown,
 *          spoken praise, replay option, and the universal detailed report modal.
 * Module: Find the Correct Word — Screens
 * Folder: frontend/src/screens/games/FindTheCorrectWord
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
import { useFindTheCorrectWordStore } from './store/useFindTheCorrectWordStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { FindTheCorrectWordStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<FindTheCorrectWordStackParamList, 'FindTheCorrectWordSessionComplete'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 6;

  const resetGame = useFindTheCorrectWordStore((s) => s.resetGame);
  const attempts = useFindTheCorrectWordStore((s) => s.attempts);
  const rounds = useFindTheCorrectWordStore((s) => s.rounds);

  const {
    starsEarned = 3,
    xpEarned = 50,
    itemsCorrect = 10,
    sessionLength = 10,
    accuracy = 100,
    isTimeExpired = false,
  } = route.params || {};

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'find_the_correct_word',
      category: 'reading_words',
      learningLanguage,
      motherTongue,
      age: selectedAge,
      itemsAttempted: sessionLength,
      itemsCorrect,
      accuracy,
      starsEarned,
      xpEarned,
      durationSeconds: 60,
    });
  }, [itemsCorrect, sessionLength, accuracy, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    const praiseText = t(
      'findTheCorrectWord.sessionCompletePraise',
      'You are a spelling champion! Wonderful job finding the correct words!'
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
    navigation.navigate('Games', { screen: 'FindTheCorrectWordGame' as any });
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetGame();
    navigation.navigate('GameCatalog' as any);
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetGame();
    navigation.navigate('ChildDashboard' as any);
  };

  // Formulate comprehensive per-question report items
  const reportItems: GameQuestionReportItem[] = rounds.map((round) => {
    const roundAttempts = attempts.filter((a) => a.roundNumber === round.roundNumber);
    const lastAttempt = roundAttempts[roundAttempts.length - 1];

    if (!lastAttempt) {
      return {
        roundNumber: round.roundNumber,
        questionLabel: `Word: ${round.targetItem.correctWord}`,
        userAnswer: isTimeExpired ? 'Timed Out ⏱️' : 'Skipped',
        correctAnswer: round.targetItem.correctWord,
        isCorrect: false,
        attemptsCount: 0,
        xpEarned: 0,
      };
    }

    const isSuccess = roundAttempts.some((a) => a.isCorrect);
    const successfulAttempt = roundAttempts.find((a) => a.isCorrect);
    const attemptCount = successfulAttempt ? successfulAttempt.attemptCount : (roundAttempts.length as 1 | 2);
    const xp = isSuccess ? (attemptCount === 1 ? 15 : 10) : 0;

    return {
      roundNumber: round.roundNumber,
      questionLabel: `Word: ${round.targetItem.correctWord}`,
      userAnswer: lastAttempt.chosenWord,
      correctAnswer: round.targetItem.correctWord,
      isCorrect: isSuccess,
      attemptsCount: attemptCount,
      xpEarned: xp,
    };
  });

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.findTheCorrectWord.title', 'Find the Correct Word')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={reportItems.length > 0 ? () => setShowReportModal(true) : undefined}
        bgTheme="meadow"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.findTheCorrectWord.title', 'Find the Correct Word')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'FindTheCorrectWordSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
