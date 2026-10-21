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
import { navigateToGameCatalog, navigateToChildDashboard } from '../../../navigation/navigationHelpers';
import { GameAnalysisReportModal, GameQuestionReportItem } from '../../../components/GameAnalysisReportModal';
import { buildStandardizedReportItems } from '../../../utils/gameReportAdapter';
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
  const isAbandoned = ((route.params as any) || {}).isAbandoned === true;
  const itemsAttempted = ((route.params as any) || {}).itemsAttempted !== undefined ? ((route.params as any) || {}).itemsAttempted : totalQuestions;

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
      itemsAttempted: isAbandoned ? itemsAttempted : totalQuestions,
      isAbandoned,
      completed: !isAbandoned,
      itemsCorrect: correctAnswers,
      accuracy,
      starsEarned: starCount,
      xpEarned,
      durationSeconds,
    });
  }, [correctAnswers, totalQuestions, accuracy, starCount, xpEarned, durationSeconds, learningLanguage, motherTongue, selectedAge]);

  useEffect(() => {
    if (!isAbandoned) {
      const praiseText = t(
      'putInOrder.sessionCompletePraise',
      'You are an ordering champion!'
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
    navigation.navigate('Games', {
      screen: 'PutInOrderGame' as any,
    });
  };

  const handleBackToDashboard = () => {
    stopSpeech();
    resetGame();
    navigateToChildDashboard(navigation);
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetGame();
    navigateToGameCatalog(navigation);
  };

  const reportSummary = buildStandardizedReportItems({
    sessionLength: totalQuestions,
    itemsAttempted,
    isAbandoned,
    attempts,
    rounds,
    fallbackLabelPrefix: 'Sequence Round',
  });
  const reportItems = reportSummary.items;

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
        isAbandoned={isAbandoned}
        itemsAttempted={itemsAttempted}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleBackToDashboard}
        onViewReport={() => setShowReportModal(true)}
        bgTheme="puzzle"
      />

      <GameAnalysisReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        gameTitle={t('games.putInOrder.title', 'Put in Order')}
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

SessionCompleteScreen.displayName = 'PutInOrderSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
