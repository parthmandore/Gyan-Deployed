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
import {
  stopSpeech,
  registerActiveGameSession,
  abandonGameSession,
  speakPhrase,
  speakLetter,
  speakWord,
  PlaybackResult,
} from '../services/speechService';
import { audioManager } from '../services/audioManager';
import { speakPraise } from '../services/praiseService';

export type SessionLifecycleStatus = 'active' | 'completed' | 'abandoned';

export interface UseGameSessionLifecycleOptions {
  sessionId?: string;
  gameId: string;
  screenName?: string;
  onQuitModalToggle?: (visible: boolean) => void;
  onCleanup?: () => void;
  defaultExitDestination?: string;
  onQuitToReport?: () => void;
}

export function useGameSessionLifecycle(options: UseGameSessionLifecycleOptions) {
  const {
    sessionId: userSessionId,
    gameId,
    onQuitModalToggle,
    onCleanup,
    defaultExitDestination = 'GameCatalog',
    onQuitToReport,
  } = options;

  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  // Unique session identifier for speech scoping and lifecycle tracking
  const sessionIdRef = useRef<string>(
    userSessionId || `session_${gameId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );
  const sessionId = sessionIdRef.current;

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
   * 1. Marks session as 'abandoned' synchronously
   * 2. Clears speech session and stops audio immediately
   * 3. Clears all pending timeouts/intervals
   * 4. Invokes custom game cleanup if provided
   * 5. Navigates to catalog or target destination
   * 6. Ensures results/report screen cannot be shown later
   */
  /**
   * Safe exit-to-report handler:
   * 1. Marks session as 'abandoned' synchronously
   * 2. Clears speech session and stops audio immediately
   * 3. Clears all pending timeouts/intervals
   * 4. Invokes custom game cleanup if provided
   * 5. Executes report transition callback
   */
  const exitToReport = useCallback(
    (showReportFn?: () => void) => {
      if (statusRef.current === 'abandoned') return;
      statusRef.current = 'abandoned';
      setStatus('abandoned');

      // Invalidate speech for this session immediately
      abandonGameSession(sessionIdRef.current);
      clearAllTimers();
      stopSpeech();
      audioManager.stopAllGameAudio();

      const fn = showReportFn || onQuitToReport;
      if (fn) {
        try {
          fn();
        } catch (err) {
          console.warn(`[useGameSessionLifecycle] Error executing onQuitToReport in ${gameId}:`, err);
        }
      } else {
        // Fallback to catalog if no report handler available
        try {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('GameCatalog' as any);
          } else {
            navigation.navigate('GameCatalog' as any);
          }
        } catch {
          navigation.navigate('GameCatalog' as any);
        }
      }
    },
    [clearAllTimers, gameId, navigation, onCleanup, onQuitToReport]
  );

  /**
   * Safe exit/abandon handler:
   * 1. If onQuitToReport is provided and exiting to catalog, delegates to exitToReport
   * 2. Marks session as 'abandoned' synchronously
   * 3. Clears speech session and stops audio immediately
   * 4. Clears all pending timeouts/intervals
   * 5. Invokes custom game cleanup if provided
   * 6. Navigates to catalog or target destination
   * 7. Ensures results/report screen cannot be shown later
   */
  const exitSession = useCallback(
    (destination?: string) => {
      if (onQuitToReport && (!destination || destination === 'GameCatalog')) {
        exitToReport();
        return;
      }

      if (statusRef.current === 'abandoned') return;
      statusRef.current = 'abandoned';
      setStatus('abandoned');

      // Invalidate speech for this session immediately
      abandonGameSession(sessionIdRef.current);
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
      try {
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate(dest as any);
        } else {
          navigation.navigate(dest as any);
        }
      } catch {
        navigation.navigate(dest as any);
      }
    },
    [clearAllTimers, defaultExitDestination, exitToReport, gameId, navigation, onCleanup, onQuitToReport]
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
        console.log(`[useGameSessionLifecycle] Skipping completeSession: status is ${statusRef.current}`);
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

  /**
   * Session-scoped safe speech helpers
   */
  const safeSpeakPhrase = useCallback(
    async (phrase: string, opts?: { cancelPrevious?: boolean; language?: string }): Promise<PlaybackResult> => {
      if (statusRef.current !== 'active') {
        return { success: false, source: 'local_tts_fallback', error: 'Session not active' };
      }
      return speakPhrase(phrase, { ...opts, sessionId: sessionIdRef.current });
    },
    []
  );

  const safeSpeakLetter = useCallback(
    async (letter: string, cachedUrl?: string | null, targetLang?: string): Promise<PlaybackResult> => {
      if (statusRef.current !== 'active') {
        return { success: false, source: 'local_tts_fallback', error: 'Session not active' };
      }
      return speakLetter(letter, cachedUrl, targetLang, sessionIdRef.current);
    },
    []
  );

  const safeSpeakWord = useCallback(
    async (word: string, language?: string): Promise<PlaybackResult> => {
      if (statusRef.current !== 'active') {
        return { success: false, source: 'local_tts_fallback', error: 'Session not active' };
      }
      return speakWord(word, language, sessionIdRef.current);
    },
    []
  );

  const safeSpeakPraise = useCallback((overrideLang?: string) => {
    if (statusRef.current !== 'active') return;
    speakPraise(overrideLang, sessionIdRef.current);
  }, []);

  // Register session on mount & handle navigation blur/beforeRemove
  useEffect(() => {
    isMountedRef.current = true;
    registerActiveGameSession(sessionIdRef.current);

    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      if (statusRef.current === 'active') {
        statusRef.current = 'abandoned';
        abandonGameSession(sessionIdRef.current);
        clearAllTimers();
        stopSpeech();
        audioManager.stopAllGameAudio();
      }
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (statusRef.current === 'active') {
        statusRef.current = 'abandoned';
        abandonGameSession(sessionIdRef.current);
        clearAllTimers();
        stopSpeech();
        audioManager.stopAllGameAudio();
      }
    });

    return () => {
      isMountedRef.current = false;
      if (statusRef.current === 'active') {
        statusRef.current = 'abandoned';
        abandonGameSession(sessionIdRef.current);
      }
      unsubscribeBeforeRemove();
      unsubscribeBlur();
      clearAllTimers();
      stopSpeech();
      audioManager.stopAllGameAudio();
    };
  }, [clearAllTimers, navigation]);

  // Synchronize Android hardware Back button with Quit modal or direct exit to report
  useEffect(() => {
    const handleHardwareBack = () => {
      if (!isFocused || statusRef.current !== 'active') {
        return false;
      }
      if (onQuitModalToggle) {
        onQuitModalToggle(true);
        return true;
      }
      if (onQuitToReport) {
        exitToReport();
        return true;
      }
      exitSession();
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => {
      backSub.remove();
    };
  }, [isFocused, onQuitModalToggle, exitSession, exitToReport, onQuitToReport]);

  return {
    sessionId,
    status,
    statusRef,
    isExited: status !== 'active',
    isFocused,
    isSessionActive: () => statusRef.current === 'active',
    safeSetTimeout,
    safeClearTimeout,
    clearAllTimers,
    exitSession,
    exitToReport,
    completeSession,
    safeSpeakPhrase,
    safeSpeakLetter,
    safeSpeakWord,
    safeSpeakPraise,
  };
}
