/**
 * Purpose: Session Complete and Rewards Screen for Letter Tracing.
 *          Celebrates child's handwriting achievements with animated stars, XP breakdown,
 *          spoken praise in mother tongue, and navigation options.
 * Module: Letter Tracing — Screens
 * Folder: frontend/src/screens/games/LetterTracing
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
import { useLetterTracingStore } from './store/useLetterTracingStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { LetterTracingStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<LetterTracingStackParamList, 'LetterTracingSessionComplete'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 5;

  const resetSession = useLetterTracingStore((s) => s.resetSession);
  const attempts = useLetterTracingStore((s) => s.attempts);
  const rounds = useLetterTracingStore((s) => s.rounds);

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
      gameId: 'letter_tracing',
      category: 'letters_phonics',
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
    const praiseText = t('letterTracing.sessionCompletePraise', { lng: motherTongue });
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
    resetSession();
    navigation.navigate('Games', { screen: 'LetterTracingGame' as any });
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetSession();
    navigation.navigate('ChildDashboard' as any);
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetSession();
    navigation.navigate('GameCatalog' as any);
  };

  const reportItems: GameQuestionReportItem[] = attempts.map((att, idx) => {
    const r = rounds[att.roundIndex] || rounds[idx];
    const letterChar = r?.letter?.displayChar || att.letterId;
    return {
      roundNumber: att.roundIndex + 1,
      questionLabel: `Trace: ${letterChar}`,
      userAnswer: att.isSuccess ? 'Traced ✓' : 'Incomplete',
      correctAnswer: letterChar,
      isCorrect: att.isSuccess,
      xpEarned: att.isSuccess ? 15 : 0,
    };
  });

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.letterTracing.title', 'Letter Tracing')}
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
        gameTitle={t('games.letterTracing.title', 'Letter Tracing')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'LetterTracingSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
