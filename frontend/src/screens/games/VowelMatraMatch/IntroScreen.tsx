/**
 * Purpose: Intro / Guidance Screen for Vowel & Matra Match game.
 * Module: Vowel Matra Match
 * Folder: frontend/src/screens/games/VowelMatraMatch
 */

import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { VowelMatraMatchStackParamList } from './types';
import { GameIntroCard } from '../../../components';
import { useVowelMatraMatchStore } from './store/vowelMatraMatchStore';

type NavProp = NativeStackNavigationProp<VowelMatraMatchStackParamList>;

export const IntroScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const resetSession = useVowelMatraMatchStore((s) => s.resetSession);

  const handleStart = useCallback(() => {
    resetSession();
    navigation.navigate('VowelMatraMatchGame');
  }, [resetSession, navigation]);

  const handleBack = useCallback(() => {
    (navigation as any).navigate('GameCatalog');
  }, [navigation]);

  return (
    <View style={styles.root}>
      <GameIntroCard
        gameTitle={t('games.vowelMatraMatch.title', 'Vowel & Matra Match')}
        gameDescription={t(
          'games.vowelMatraMatch.description',
          'Match independent vowels to their consonant matra forms!'
        )}
        realmName={t('realms.letters_phonics.name', 'Letters & Phonics')}
        realmIcon="🕉️"
        whatToDo={t('vowelMatraMatch.step1', 'See the independent vowel on the left column.')}
        howToPlay={t('vowelMatraMatch.step2', 'Tap its corresponding matra form on the right.')}
        howToWin={t('vowelMatraMatch.step3', 'Match all 4 pairs each round to earn 3 stars and bonus XP!')}
        onStart={handleStart}
        onBack={handleBack}
        bgTheme="evening"
      />
    </View>
  );
});

IntroScreen.displayName = 'VowelMatraMatchIntroScreen';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
