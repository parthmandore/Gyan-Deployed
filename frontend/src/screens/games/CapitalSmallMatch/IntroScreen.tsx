/**
 * Purpose: Intro Screen for Capital & Small Letter Match featuring first-time auto-tutorial trigger,
 *          clear 3-step learning guidance, companion mascot, and tactile start CTA.
 * Module: Capital Small Match
 * Folder: frontend/src/screens/games/CapitalSmallMatch
 */

import React, { useEffect, useState, useCallback } from 'react';
import { navigateToGameCatalog } from '../../../navigation/navigationHelpers';
import { View, StyleSheet , BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { GameIntroCard } from '../../../components';
import { TutorialOverlay, TutorialStep } from '../../../components/TutorialOverlay';
import { CapitalSmallMatchStackParamList } from './types';
import { useCapitalSmallMatchStore } from './store/capitalSmallMatchStore';
import { isTutorialSeen } from '../../../services/tutorialService';

type NavProp = NativeStackNavigationProp<CapitalSmallMatchStackParamList, 'CapitalSmallMatchIntro'>;

const GAME_ID = 'capital_small_match';

const CAPITAL_SMALL_MATCH_TUTORIAL_STEPS: TutorialStep[] = [
  {
    titleKey: 'capitalSmallMatch.tutorialStep1Title',
    bodyKey: 'capitalSmallMatch.tutorialStep1Body',
    defaultTitle: 'Step 1: Pick a Capital Letter',
    defaultBody: 'Tap any uppercase capital letter in the left column to select it!',
    icon: '🔤',
    narrationText: 'Step 1: Pick a Capital Letter. Tap any uppercase capital letter in the left column to select it!',
  },
  {
    titleKey: 'capitalSmallMatch.tutorialStep2Title',
    bodyKey: 'capitalSmallMatch.tutorialStep2Body',
    defaultTitle: 'Step 2: Find its Small Letter Pair',
    defaultBody: 'Now tap its matching lowercase small letter in the right column!',
    icon: '🧩',
    narrationText: 'Step 2: Find its Small Letter Pair. Now tap its matching lowercase small letter in the right column!',
  },
  {
    titleKey: 'capitalSmallMatch.tutorialStep3Title',
    bodyKey: 'capitalSmallMatch.tutorialStep3Body',
    defaultTitle: 'Step 3: Complete the Round!',
    defaultBody: 'Match all 4 pairs to finish the round and earn 3 stars! 🌟',
    icon: '⭐',
    narrationText: 'Step 3: Complete the Round! Match all 4 pairs to finish the round and earn 3 stars!',
  },
];

export const IntroScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  useEffect(() => {
    const onBackPress = () => {
      navigateToGameCatalog(navigation);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [navigation]);
  const resetSession = useCapitalSmallMatchStore((s) => s.resetSession);

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    let mounted = true;
    isTutorialSeen(GAME_ID).then((seen) => {
      if (mounted && !seen) {
        setShowTutorial(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleStart = useCallback(() => {
    resetSession();
    navigation.navigate('CapitalSmallMatchGame');
  }, [resetSession, navigation]);

  const handleBack = useCallback(() => {
    navigateToGameCatalog(navigation);
  }, [navigation]);

  const handleOpenTutorial = useCallback(() => {
    setShowTutorial(true);
  }, []);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  return (
    <View style={styles.root}>
      <GameIntroCard
        gameTitle={t('games.capitalSmallMatch.title', 'Capital & Small Letter Match')}
        gameDescription={t(
          'games.capitalSmallMatch.description',
          'Match uppercase capital letters to their lowercase small letter pairs!'
        )}
        realmName={t('realms.letters_phonics.name', 'Letters & Phonics')}
        realmIcon="🔤"
        whatToDo={t('capitalSmallMatch.whatToDo', 'Find and pair big capital letters with small matching letters.')}
        howToPlay={t('capitalSmallMatch.howToPlaySummary', 'Tap an uppercase letter, then tap its matching lowercase partner.')}
        howToWin={t('capitalSmallMatch.howToWinSummary', 'Match all 4 letter pairs each round to earn 3 stars and bonus XP!')}
        onStart={handleStart}
        onBack={handleBack}
        onOpenTutorial={handleOpenTutorial}
        bgTheme="evening"
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        gameId={GAME_ID}
        visible={showTutorial}
        steps={CAPITAL_SMALL_MATCH_TUTORIAL_STEPS}
        onComplete={handleCloseTutorial}
        onSkip={handleCloseTutorial}
      />
    </View>
  );
});

IntroScreen.displayName = 'CapitalSmallMatchIntroScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
