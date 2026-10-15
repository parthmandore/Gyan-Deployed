/**
 * Purpose: Session Complete and Rewards screen for Missing Letters.
 *          Celebrates sequence completion with 3-star rating, XP tally,
 *          spoken praise, and replay / catalog / dashboard navigation.
 * Module: Missing Letters — Session Complete Screen
 * Folder: frontend/src/screens/games/MissingLetters
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
import { useMissingLettersStore } from './store/useMissingLettersStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { MissingLettersStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<
  MissingLettersStackParamList,
  'MissingLettersSessionComplete'
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

  const resetGame = useMissingLettersStore((s) => s.resetGame);
  const attempts = useMissingLettersStore((s) => s.attempts);

  const {
    starsEarned = 3,
    xpEarned = 50,
    itemsCorrect = 5,
    sessionLength = 5,
    accuracy = 100,
  } = (route.params as any) || {};

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'missing_letters',
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
    const praiseText = t('missingLetters.sessionCompletePraise', { lng: motherTongue });
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
    navigation.navigate('Games', { screen: 'MissingLettersGame' as any });
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
    roundNumber: att.roundNumber,
    questionLabel: `Round ${att.roundNumber}: Missing Letter`,
    userAnswer: att.selectedLetter,
    correctAnswer: att.correctLetter,
    isCorrect: att.isCorrect,
    attemptsCount: att.attemptCount,
    xpEarned: att.isCorrect ? 10 : 0,
  }));

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.missingLetters.title', 'Missing Letters')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={reportItems.length > 0 ? () => setShowReportModal(true) : undefined}
        bgTheme="hub"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.missingLetters.title', 'Missing Letters')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'MissingLettersSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
