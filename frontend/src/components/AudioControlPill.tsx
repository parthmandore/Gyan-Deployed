/**
 * Purpose: Child-friendly, tactile floating Audio Controls (Music 🎵 & Sound 🔊).
 *          Provides persistent ON/OFF toggle controls without cluttering gameplay,
 *          meeting accessibility standards (minimum 44x44 touch targets, high-contrast labels).
 * Module: Components
 * Folder: frontend/src/components
 */

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BigTouchTarget } from './BigTouchTarget';
import { useAudioSettings } from '../services/audioManager';
import { audioManager } from '../services/audioManager';

export interface AudioControlPillProps {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AudioControlPill: React.FC<AudioControlPillProps> = ({
  compact = false,
  style,
}) => {
  const { t } = useTranslation();
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useAudioSettings();

  const handleMusicPress = () => {
    audioManager.playTapSound();
    toggleMusic();
  };

  const handleSfxPress = () => {
    // If turning on, will play tap sound
    audioManager.playTapSound();
    toggleSfx();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Music Toggle */}
      <BigTouchTarget
        onPress={handleMusicPress}
        accessibilityRole="button"
        accessibilityLabel={
          musicEnabled
            ? t('audio.musicOn', 'Background music: On. Tap to mute.')
            : t('audio.musicOff', 'Background music: Off. Tap to play.')
        }
        style={[
          styles.pillButton,
          compact && styles.pillButtonCompact,
          musicEnabled ? styles.musicActive : styles.pillInactive,
        ]}
      >
        <Text style={styles.pillIcon}>{musicEnabled ? '🎵' : '🔇'}</Text>
        {!compact && (
          <Text
            style={[
              styles.pillLabel,
              musicEnabled ? styles.labelActiveMusic : styles.labelInactive,
            ]}
          >
            {musicEnabled ? t('audio.music', 'Music') : t('audio.off', 'Off')}
          </Text>
        )}
        {musicEnabled && <View style={styles.activeDot} />}
      </BigTouchTarget>

      {/* Sound Effects Toggle */}
      <BigTouchTarget
        onPress={handleSfxPress}
        accessibilityRole="button"
        accessibilityLabel={
          sfxEnabled
            ? t('audio.sfxOn', 'Sound effects: On. Tap to mute.')
            : t('audio.sfxOff', 'Sound effects: Off. Tap to enable.')
        }
        style={[
          styles.pillButton,
          compact && styles.pillButtonCompact,
          sfxEnabled ? styles.sfxActive : styles.pillInactive,
        ]}
      >
        <Text style={styles.pillIcon}>{sfxEnabled ? '🔊' : '🔈'}</Text>
        {!compact && (
          <Text
            style={[
              styles.pillLabel,
              sfxEnabled ? styles.labelActiveSfx : styles.labelInactive,
            ]}
          >
            {sfxEnabled ? t('audio.sound', 'Sound') : t('audio.off', 'Off')}
          </Text>
        )}
        {sfxEnabled && <View style={[styles.activeDot, styles.activeDotAmber]} />}
      </BigTouchTarget>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1.5,
  },
  pillButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 44,
  },
  musicActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#7DD3FC',
  },
  sfxActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  pillInactive: {
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderColor: '#CBD5E1',
    opacity: 0.75,
  },
  pillIcon: {
    fontSize: 15,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  labelActiveMusic: {
    color: '#0369A1',
  },
  labelActiveSfx: {
    color: '#92400E',
  },
  labelInactive: {
    color: '#64748B',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 5,
  },
  activeDotAmber: {
    backgroundColor: '#F59E0B',
  },
});
