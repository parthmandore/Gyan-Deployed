/**
 * Purpose: Session Complete and Rewards Screen for Educational Mathematics Games.
 *          Celebrates math achievements with stars, XP breakdown, praise,
 *          and explicit navigation to replay, games catalog, or dashboard.
 * Module: Math Challenge — Screens
 * Folder: frontend/src/screens/games/MathChallenge
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
import { useMathChallengeStore } from './store/useMathChallengeStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { MathChallengeStackParamList, MathOperation } from './types';
import { RootStackParamList } from '../../../types';

type RouteProps = RouteProp<MathChallengeStackParamList, 'MathChallengeSessionComplete'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const [showReportModal, setShowReportModal] = useState(false);

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'en';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 6;

  const resetSession = useMathChallengeStore((s) => s.resetSession);
  const attempts = useMathChallengeStore((s) => s.attempts);

  const {
    operation = 'addition' as MathOperation,
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
      gameId: operation || 'addition',
      category: 'mathematics',
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
  }, [operation, itemsCorrect, sessionLength, accuracy, starsEarned, xpEarned, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    const praiseText = t('mathChallenge.sessionCompletePraise', { lng: motherTongue });
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
    navigation.navigate('Games', {
      screen: 'MathChallengeGame' as any,
      params: { operation },
    });
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

  const reportItems: GameQuestionReportItem[] = attempts.map((att) => ({
    roundNumber: att.roundNumber,
    questionLabel: `Math Problem ${att.roundNumber}`,
    userAnswer: String(att.selectedValue),
    correctAnswer: String(att.correctValue),
    isCorrect: att.isCorrect,
    attemptsCount: att.attemptCount,
    xpEarned: att.isCorrect ? (att.attemptCount === 1 ? 15 : 10) : 0,
  }));

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t(`games.${operation}.title`, 'Math Challenge')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
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
        gameTitle={t(`games.${operation}.title`, 'Math Challenge')}
        items={reportItems}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'MathChallengeSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
