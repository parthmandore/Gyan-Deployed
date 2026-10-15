/**
 * Purpose: Safe haptic and synchronized audio feedback service wrapper for mobile devices
 *          safely degrading on web platforms.
 * Module: Services
 * Folder: frontend/src/services
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { audioManager } from './audioManager';

export const triggerHapticSuccess = async () => {
  audioManager.playCorrectSound();
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore silently on unsupported devices
    }
  }
};

export const triggerHapticWarning = async () => {
  audioManager.playWrongSound();
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Ignore silently on unsupported devices
    }
  }
};

export const triggerHapticLightImpact = async () => {
  audioManager.playTapSound();
  if (Platform.OS !== 'web') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore silently
    }
  }
};
