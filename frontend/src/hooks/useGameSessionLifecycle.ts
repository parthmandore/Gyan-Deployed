/**
 * Purpose: Unified, robust lifecycle manager for educational game sessions in Gyan.
 *          Governs explicit session lifecycle states ('active' | 'completed' | 'abandoned'),
 *          prevents post-exit timer expiration, cancels pending transition timeouts,
 *          guards against duplicate XP awards and double navigation, and synchronizes
 *          Android hardware Back button behavior with Quit confirmation modals.
 * Module: Hooks
 * Folder: frontend/src/hooks
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { stopSpeech } from '../services/speechService';
import { audioManager } from '../services/audioManager';

export type SessionLifecycleStatus = 'active' | 'completed' | 'abandoned';

export interface UseGameSessionLifecycleOptions {
  sessionId?: string;
  gameId: string;
  screenName?: string;
  onQuitModalToggle?: (visible: boolean) => void;
  onCleanup?: () => void;
  defaultExitDestination?: string;
}

export function useGameSessionLifecycle(options: UseGameSessionLifecycleOptions) {
  const {
    gameId,
    onQuitModalToggle,
    onCleanup,
    defaultExitDestination = 'GameCatalog',
  } = options;

  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [status, setStatus] = useState<SessionLifecycleStatus>('active');
  const statusRef = useRef<SessionLifecycleStatus>('active');
  statusRef.current = status;

  const isMountedRef = useRef<boolean>(true);
  const activeTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const activeIntervalsRef = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  // Tracks whether completion action is currently executing to prevent double invokes
  const isCompletingRef = useRef<boolean>(false);

  /**
   * Safe setTimeout wrapper: automatically tracked and cancelled on exit or unmount.
   * If the session is abandoned before the timeout fires, callback execution is aborted.
   */
  const safeSetTimeout = useCallback(
    (handler: () => void, delayMs: number): ReturnType<typeof setTimeout> => {
      const timerId = setTimeout(() => {
        activeTimeoutsRef.current.delete(timerId);
        if (isMountedRef.current && statusRef.current === 'active') {
          handler();
        }
      }, delayMs);
      activeTimeoutsRef.current.add(timerId);
      return timerId;
    },
    []
  );

  /**
   * Safe manual timer cancellation
   */
  const safeClearTimeout = useCallback((timerId?: ReturnType<typeof setTimeout> | null) => {
    if (timerId) {
      clearTimeout(timerId);
      activeTimeoutsRef.current.delete(timerId);
    }
  }, []);

  /**
   * Clear all active timeouts and intervals immediately
   */
  const clearAllTimers = useCallback(() => {
    activeTimeoutsRef.current.forEach((t) => clearTimeout(t));
    activeTimeoutsRef.current.clear();
    activeIntervalsRef.current.forEach((i) => clearInterval(i));
    activeIntervalsRef.current.clear();
  }, []);

  /**
   * Safe exit/abandon handler:
   * 1. Marks session as 'abandoned'
   * 2. Clears all pending timeouts/intervals
   * 3. Stops speech and game audio
   * 4. Invokes custom game cleanup if provided
   * 5. Navigates to catalog or target destination
   * 6. Ensures results/report screen cannot be shown later
   */
  const exitSession = useCallback(
    (destination?: string) => {
      if (statusRef.current === 'abandoned') return;
      statusRef.current = 'abandoned';
      setStatus('abandoned');

      clearAllTimers();
      stopSpeech();
      audioManager.stopAllGameAudio();

      if (onCleanup) {
        try {
          onCleanup();
        } catch (err) {
          console.warn(`[useGameSessionLifecycle] Cleanup error in ${gameId}:`, err);
        }
      }

      const dest = destination || defaultExitDestination;
      navigation.navigate(dest as any);
    },
    [clearAllTimers, defaultExitDestination, gameId, navigation, onCleanup]
  );

  /**
   * Safe completion handler:
   * 1. Guards against duplicate triggers or execution after manual exit
   * 2. Marks session as 'completed'
   * 3. Stops timers and speech
   * 4. Executes onCompleteAction exactly once
   */
  const completeSession = useCallback(
    async (onCompleteAction: () => Promise<void> | void) => {
      if (statusRef.current !== 'active' || isCompletingRef.current) {
        return;
      }
      isCompletingRef.current = true;
      statusRef.current = 'completed';
      setStatus('completed');

      clearAllTimers();
      stopSpeech();

      try {
        await onCompleteAction();
      } catch (err) {
        console.warn(`[useGameSessionLifecycle] Error during session completion in ${gameId}:`, err);
      }
    },
    [clearAllTimers, gameId]
  );

  // Synchronize Android hardware Back button with Quit modal
  useEffect(() => {
    const handleHardwareBack = () => {
      if (!isFocused || statusRef.current !== 'active') {
        return false;
      }
      if (onQuitModalToggle) {
        onQuitModalToggle(true);
        return true;
      }
      exitSession();
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => {
      backSub.remove();
    };
  }, [isFocused, onQuitModalToggle, exitSession]);

  // Unmount cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (statusRef.current === 'active') {
        statusRef.current = 'abandoned';
      }
      clearAllTimers();
      stopSpeech();
      audioManager.stopAllGameAudio();
    };
  }, [clearAllTimers]);

  return {
    status,
    statusRef,
    isExited: status !== 'active',
    isFocused,
    safeSetTimeout,
    safeClearTimeout,
    clearAllTimers,
    exitSession,
    completeSession,
  };
}
