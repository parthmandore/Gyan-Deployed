/**
 * Purpose: Session Complete Screen for Language Pair Match.
 *          Celebrates successful completion with stars, XP awarded,
 *          accuracy metrics, and explicit navigation (Play Again, Catalog, Dashboard).
 * Module: Language Pair Match — Screens
 * Folder: frontend/src/screens/games/LanguagePairMatch
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { GameSessionCompleteView } from '../../../components';
import { navigateToGameCatalog, navigateToChildDashboard } from '../../../navigation/navigationHelpers';
import { LanguagePairReportModal } from './components/LanguagePairReportModal';
import { useAppLanguageStore } from '../../../state/appLanguageStore';
import { useProgressStore } from '../../../state/useProgressStore';
import { useLanguagePairMatchStore } from './store/useLanguagePairMatchStore';
import { speakPhrase, stopSpeech } from '../../../services/speechService';
import { LanguagePairMatchStackParamList } from './types';
import { RootStackParamList } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Games'>;

export const SessionCompleteScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<LanguagePairMatchStackParamList, 'LanguagePairMatchSessionComplete'>>();

  const motherTongue = useAppLanguageStore((s) => s.motherTongue) || 'en';
  const learningLanguage = useAppLanguageStore((s) => s.learningLanguage) || 'hi';
  const selectedAge = useAppLanguageStore((s) => s.selectedAge) || 6;

  const resetSession = useLanguagePairMatchStore((s) => s.resetSession);
  const setSessionStartTime = useLanguagePairMatchStore((s) => s.setSessionStartTime);
  const roundAttempts = useLanguagePairMatchStore((s) => s.roundAttempts);

  const [showReportModal, setShowReportModal] = useState(false);

  const {
    starsEarned = 3,
    xpEarned = 50,
    itemsCorrect = 10,
    sessionLength = 10,
    accuracy = 100,
  } = route.params || {};
  const isAbandoned = ((route.params as any) || {}).isAbandoned === true;
  const itemsAttempted = ((route.params as any) || {}).itemsAttempted !== undefined ? ((route.params as any) || {}).itemsAttempted : sessionLength;

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    useProgressStore.getState().recordSessionCompletion({
      gameId: 'language_pair_match',
      category: 'vocabulary',
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
      'languagePairMatch.sessionCompletePraise',
      'Awesome job! You matched the language pairs!'
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
    resetSession();
    setSessionStartTime(Date.now());
    navigation.navigate('Games', {
      screen: 'LanguagePairMatchGame' as any,
    });
  };

  const handleBackToCatalog = () => {
    stopSpeech();
    resetSession();
    navigateToGameCatalog(navigation);
  };

  const handleReturnToDashboard = () => {
    stopSpeech();
    resetSession();
    navigateToChildDashboard(navigation);
  };

  return (
    <View style={styles.root}>
      <GameSessionCompleteView
        gameTitle={t('games.languagePairMatch.title', 'Language Pair Match')}
        starsEarned={starsEarned}
        itemsCorrect={itemsCorrect}
        sessionLength={sessionLength}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onPlayAgain={handlePlayAgain}
        isAbandoned={isAbandoned}
        itemsAttempted={itemsAttempted}
        onChooseGame={handleBackToCatalog}
        onReturnToDashboard={handleReturnToDashboard}
        onViewReport={() => setShowReportModal(true)}
        bgTheme="evening"
      />

      <LanguagePairReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        attempts={roundAttempts}
        totalPairs={sessionLength}
      />
    </View>
  );
});

SessionCompleteScreen.displayName = 'LanguagePairMatchSessionCompleteScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
