/**
 * Purpose: Session Complete and Rewards Screen for Odd Word Out.
 *          Celebrates child's achievement with animated stars, XP breakdown,
 *          spoken praise, replay option, and the detailed report modal.
 * Module: Odd Word Out — Screens
 * Folder: frontend/src/screens/games/OddWordOut
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
import { useOddWordOutStore } from './store/useOddWordOutStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { OddWordOutStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<OddWordOutStackParamList, 'OddWordOutSessionComplete'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 7;

  const resetGame = useOddWordOutStore((s) => s.resetGame);
  const attempts = useOddWordOutStore((s) => s.attempts);
  const rounds = useOddWordOutStore((s) => s.rounds);

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
      gameId: 'odd_word_out',
      category: 'reasoning_logic',
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
      'oddWordOut.sessionCompletePraise',
      'Brilliant thinking! You found all the odd words!'
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
    navigation.navigate('Games', { screen: 'OddWordOutGame' as any });
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
        questionLabel: `Category: ${round.targetItem.categoryName} (${round.targetItem.categoryWords.join(', ')})`,
        userAnswer: isTimeExpired ? 'Timed Out ⏱️' : 'Skipped',
        correctAnswer: round.targetItem.oddWord,
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
      questionLabel: `Category: ${round.targetItem.categoryName} (${round.targetItem.categoryWords.join(', ')})`,
      userAnswer: lastAttempt.chosenWord,
      correctAnswer: round.targetItem.oddWord,
      isCorrect: isSuccess,
      attemptsCount: attemptCount,
      xpEarned: xp,
    };
  });

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.oddWordOut.title', 'Odd Word Out')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
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
        gameTitle={t('games.oddWordOut.title', 'Odd Word Out')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'OddWordOutSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
