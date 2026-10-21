/**
 * Purpose: Session Complete and Rewards Screen for Guess the Shape.
 *          Celebrates child's achievement with animated stars, XP breakdown,
 *          spoken praise, replay option, dashboard return, and detailed report modal.
 * Module: Guess the Shape — Screens
 * Folder: frontend/src/screens/games/GuessTheShape
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
import { useGuessTheShapeStore } from './store/useGuessTheShapeStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { GuessTheShapeStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<GuessTheShapeStackParamList, 'GuessTheShapeSessionComplete'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const resetGame = useGuessTheShapeStore((s) => s.resetGame);
  const attempts = useGuessTheShapeStore((s) => s.attempts);
  const rounds = useGuessTheShapeStore((s) => s.rounds);

  const {
    starsEarned = 3,
    xpEarned = 50,
    itemsCorrect = 10,
    sessionLength = 10,
    accuracy = 100,
    isTimeExpired = false,
  } = route.params || {};
  const isAbandoned = ((route.params as any) || {}).isAbandoned === true;
  const itemsAttempted = ((route.params as any) || {}).itemsAttempted !== undefined ? ((route.params as any) || {}).itemsAttempted : sessionLength;

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'guess_the_shape',
      category: 'shapes_colours',
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
  }, [itemsCorrect, sessionLength, accuracy, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    if (!isAbandoned) {
      const praiseText = t(
      'guessTheShape.sessionCompletePraise',
      'You are a true shape master! Wonderful job recognizing all the shapes!'
    );
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
    resetGame();
    (navigation as any).navigate('Games', { screen: 'GuessTheShapeGame' });
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetGame();
    navigateToGameCatalog(navigation);
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetGame();
    navigateToChildDashboard(navigation);
  };

  // Formulate comprehensive per-question report items
  const reportSummary = buildStandardizedReportItems({
    sessionLength,
    itemsAttempted,
    isAbandoned,
    rounds,
    fallbackLabelPrefix: 'Shape Round',
  });
  const reportItems = reportSummary.items;

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.guessTheShape.title', 'Guess The Shape')}
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
        bgTheme="geometry"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.guessTheShape.title', 'Guess The Shape')}
        isAbandoned={isAbandoned}
        totalQuestions={reportSummary.totalQuestions}
        questionsAttempted={reportSummary.questionsAttempted}
        firstTryCorrectCount={reportSummary.firstTryCorrectCount}
        correctedAfterRetryCount={reportSummary.correctedAfterRetryCount}
        stillIncorrectCount={reportSummary.stillIncorrectCount}
        unansweredCount={reportSummary.unansweredCount}
        accuracy={accuracy ?? reportSummary.accuracy}
        xpEarned={xpEarned}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'GuessTheShapeSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
