/**
 * Purpose: Centralized Audio Manager for Gyan (Background music, interactive SFX, and educational TTS).
 *          Handles lifecycle management, AppState background/foreground synchronization,
 *          audio ducking, and priority management (Microphone > TTS > SFX > Ambient Music).
 * Module: Services
 * Folder: frontend/src/services
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { AUDIO_CONFIG } from '../config/audioConfig';

const MUSIC_STORAGE_KEY = '@gyannn_music_enabled_v1';
const SFX_STORAGE_KEY = '@gyannn_sfx_enabled_v1';

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  } catch {}
};

class AudioManager {
  private static instance: AudioManager | null = null;

  private bgPlayer: AudioPlayer | null = null;
  private tapPlayer: AudioPlayer | null = null;
  private correctPlayer: AudioPlayer | null = null;
  private wrongPlayer: AudioPlayer | null = null;
  private celebrationPlayer: AudioPlayer | null = null;

  private isInitialized = false;
  private isMusicEnabled = true;
  private isSfxEnabled = true;
  private isMusicPlaying = false;
  private wasPlayingBeforeBackground = false;
  private isRecordingMic = false;
  private duckRefCount = 0;
  private lastTapTimestamp = 0;
  private lastCorrectTimestamp = 0;
  private lastWrongTimestamp = 0;
  private lastCelebrationTimestamp = 0;
  private activeGameSessionId: string | null = null;

  private listeners = new Set<() => void>();

  private musicVolume: number = AUDIO_CONFIG.volumes.backgroundMusic;
  private sfxVolume: number = AUDIO_CONFIG.volumes.sfx;

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  constructor() {
    this.setupAppStateListener();
    this.loadPersistedSettings();
  }

  private async loadPersistedSettings(): Promise<void> {
    try {
      const musicSaved = await getStorageItem(MUSIC_STORAGE_KEY);
      if (musicSaved !== null) {
        this.isMusicEnabled = musicSaved === 'true';
      }
      const sfxSaved = await getStorageItem(SFX_STORAGE_KEY);
      if (sfxSaved !== null) {
        this.isSfxEnabled = sfxSaved === 'true';
      }
      this.notifyListeners();
    } catch {}
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  public registerGameSession(sessionId: string): void {
    this.activeGameSessionId = sessionId;
  }

  public getActiveGameSession(): string | null {
    return this.activeGameSessionId;
  }

  public clearGameSession(sessionId?: string): void {
    if (!sessionId || this.activeGameSessionId === sessionId) {
      this.activeGameSessionId = null;
      this.stopAllGameAudio();
    }
  }

  /**
   * Initializes audio system and applies safe system audio mode configuration.
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadPersistedSettings();

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      this.isInitialized = true;
      console.log('[AudioManager] Audio system initialized successfully with mixWithOthers');
    } catch (error) {
      console.warn('[AudioManager] Failed to configure audio mode:', error);
      // Fallback: allow system to continue even if audio mode config fails
      this.isInitialized = true;
    }
  }

  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        if (this.isMusicPlaying) {
          this.wasPlayingBeforeBackground = true;
          this.pauseBackgroundMusic();
        }
        this.stopSpeech();
      } else if (nextAppState === 'active') {
        if (this.wasPlayingBeforeBackground && this.isMusicEnabled && !this.isRecordingMic) {
          this.wasPlayingBeforeBackground = false;
          this.resumeBackgroundMusic();
        }
      }
    });
  }

  private isUserGestureUnlocked = false;

  private setupWebAutoplayUnlock(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && !this.isUserGestureUnlocked) {
      const unlockHandler = () => {
        this.isUserGestureUnlocked = true;
        ['click', 'touchstart', 'keydown'].forEach((evt) => {
          try {
            window.removeEventListener(evt, unlockHandler);
          } catch {}
        });
        if (this.isMusicEnabled && !this.isMusicPlaying && !this.isRecordingMic) {
          this.startBackgroundMusic();
        }
      };
      ['click', 'touchstart', 'keydown'].forEach((evt) => {
        try {
          window.addEventListener(evt, unlockHandler, { once: true, passive: true });
        } catch {}
      });
    }
  }

  private safePlay(player: AudioPlayer | null): Promise<boolean> {
    if (!player) return Promise.resolve(false);
    try {
      const res: any = (player as any).play();
      if (res && typeof res.then === 'function') {
        return res
          .then(() => true)
          .catch((err: any) => {
            if (err?.name === 'NotAllowedError' || String(err).includes('NotAllowedError')) {
              this.setupWebAutoplayUnlock();
            }
            return false;
          });
      }
      return Promise.resolve(true);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || String(err).includes('NotAllowedError')) {
        this.setupWebAutoplayUnlock();
      }
      return Promise.resolve(false);
    }
  }

  private safeCreatePlayer(source: any): AudioPlayer | null {
    try {
      const player = createAudioPlayer(source);
      return player;
    } catch (err) {
      console.warn('[AudioManager] Failed to create AudioPlayer:', err);
      return null;
    }
  }

  // =========================================================================
  // BACKGROUND MUSIC
  // =========================================================================

  /**
   * Starts calm, ambient background music loop.
   */
  public startBackgroundMusic(): void {
    if (!this.isMusicEnabled || this.isRecordingMic) return;

    try {
      if (!this.bgPlayer) {
        this.bgPlayer = this.safeCreatePlayer(AUDIO_CONFIG.assets.backgroundMusic);
      }

      if (this.bgPlayer) {
        this.bgPlayer.loop = true;
        this.bgPlayer.volume = this.duckRefCount > 0 ? AUDIO_CONFIG.volumes.duckedMusic : this.musicVolume;
        this.safePlay(this.bgPlayer).then((started) => {
          this.isMusicPlaying = started;
        });
      }
    } catch (error) {
      this.isMusicPlaying = false;
    }
  }

  /**
   * Pauses background music (e.g. during speech exercises or app pause).
   */
  public pauseBackgroundMusic(): void {
    try {
      if (this.bgPlayer && this.isMusicPlaying) {
        this.bgPlayer.pause();
        this.isMusicPlaying = false;
      }
    } catch (error) {
      console.warn('[AudioManager] Error pausing background music:', error);
    }
  }

  /**
   * Resumes background music if previously enabled and mic is inactive.
   */
  public resumeBackgroundMusic(): void {
    if (!this.isMusicEnabled || this.isRecordingMic) return;

    try {
      if (this.bgPlayer) {
        this.bgPlayer.volume = this.duckRefCount > 0 ? AUDIO_CONFIG.volumes.duckedMusic : this.musicVolume;
        this.safePlay(this.bgPlayer).then((started) => {
          this.isMusicPlaying = started;
        });
      } else {
        this.startBackgroundMusic();
      }
    } catch (error) {
      this.isMusicPlaying = false;
    }
  }

  /**
   * Stops background music and resets position to beginning.
   */
  public stopBackgroundMusic(): void {
    try {
      if (this.bgPlayer) {
        this.bgPlayer.pause();
        try {
          this.bgPlayer.seekTo(0);
        } catch {}
        this.isMusicPlaying = false;
      }
    } catch (error) {
      console.warn('[AudioManager] Error stopping background music:', error);
    }
  }

  // =========================================================================
  // DUCKING & PRIORITY CONTROL
  // =========================================================================

  /**
   * Ducks background music volume down to duckedMusic (0.04)
   * while higher priority audio (TTS or SFX) is playing.
   */
  public duck(): void {
    this.duckRefCount++;
    if (this.bgPlayer && this.isMusicPlaying) {
      try {
        this.bgPlayer.volume = AUDIO_CONFIG.volumes.duckedMusic;
      } catch {}
    }
  }

  /**
   * Restores background music to normal volume once all ducking triggers complete.
   */
  public unduck(): void {
    this.duckRefCount = Math.max(0, this.duckRefCount - 1);
    if (this.duckRefCount === 0 && this.bgPlayer && this.isMusicPlaying && !this.isRecordingMic) {
      try {
        this.bgPlayer.volume = this.musicVolume;
      } catch {}
    }
  }

  /**
   * Priority 1 (Top priority): Microphone Recording begins.
   * Immediately stops TTS and pauses background music to ensure 0dB audio interference.
   */
  public onRecordingStart(): void {
    this.isRecordingMic = true;
    this.stopSpeech();
    this.pauseBackgroundMusic();
  }

  /**
   * Priority 1 releases: Microphone recording has ended.
   * Resumes background music smoothly.
   */
  public onRecordingEnd(): void {
    this.isRecordingMic = false;
    if (this.isMusicEnabled) {
      this.resumeBackgroundMusic();
    }
  }

  // =========================================================================
  // SOUND EFFECTS (SFX)
  // =========================================================================

  /**
   * Plays a subtle, satisfying wooden tap sound on meaningful option clicks.
   * Includes 40ms debounce to prevent audio stutter under rapid tapping.
   */
  public playTapSound(): void {
    if (!this.isSfxEnabled) return;

    const now = Date.now();
    if (now - this.lastTapTimestamp < 40) return;
    this.lastTapTimestamp = now;

    try {
      if (!this.tapPlayer) {
        this.tapPlayer = this.safeCreatePlayer(AUDIO_CONFIG.assets.sfxTap);
      }
      if (this.tapPlayer) {
        this.tapPlayer.volume = this.sfxVolume;
        try {
          this.tapPlayer.seekTo(0);
        } catch {}
        this.safePlay(this.tapPlayer);
      }
    } catch (err) {
      console.warn('[AudioManager] playTapSound error:', err);
    }
  }

  /**
   * Plays a cheerful marimba/chime arpeggio for correct answers.
   * Ducks background music during the playback duration.
   */
  public playCorrectSound(): void {
    if (!this.isSfxEnabled) return;

    const now = Date.now();
    if (now - this.lastCorrectTimestamp < 350) return;
    this.lastCorrectTimestamp = now;

    try {
      this.duck();
      if (!this.correctPlayer) {
        this.correctPlayer = this.safeCreatePlayer(AUDIO_CONFIG.assets.sfxCorrect);
      }
      if (this.correctPlayer) {
        this.correctPlayer.volume = this.sfxVolume;
        try {
          this.correctPlayer.seekTo(0);
        } catch {}
        this.safePlay(this.correctPlayer);
      }
      setTimeout(() => {
        this.unduck();
      }, 700);
    } catch (err) {
      console.warn('[AudioManager] playCorrectSound error:', err);
      this.unduck();
    }
  }

  /**
   * Plays a warm, gentle corrective dual tone for wrong answers.
   * Never harsh, sharp, or discouraging to dyslexic children.
   */
  public playWrongSound(): void {
    if (!this.isSfxEnabled) return;

    const now = Date.now();
    if (now - this.lastWrongTimestamp < 350) return;
    this.lastWrongTimestamp = now;

    try {
      this.duck();
      if (!this.wrongPlayer) {
        this.wrongPlayer = this.safeCreatePlayer(AUDIO_CONFIG.assets.sfxWrong);
      }
      if (this.wrongPlayer) {
        this.wrongPlayer.volume = this.sfxVolume;
        try {
          this.wrongPlayer.seekTo(0);
        } catch {}
        this.safePlay(this.wrongPlayer);
      }
      setTimeout(() => {
        this.unduck();
      }, 550);
    } catch (err) {
      console.warn('[AudioManager] playWrongSound error:', err);
      this.unduck();
    }
  }

  /**
   * Plays a celebratory fanfare when a session or game is completed.
   */
  public playCelebrationSound(): void {
    if (!this.isSfxEnabled) return;

    const now = Date.now();
    if (now - this.lastCelebrationTimestamp < 800) return;
    this.lastCelebrationTimestamp = now;

    try {
      this.duck();
      if (!this.celebrationPlayer) {
        this.celebrationPlayer = this.safeCreatePlayer(AUDIO_CONFIG.assets.sfxCelebration);
      }
      if (this.celebrationPlayer) {
        this.celebrationPlayer.volume = this.sfxVolume;
        try {
          this.celebrationPlayer.seekTo(0);
        } catch {}
        this.safePlay(this.celebrationPlayer);
      }
      setTimeout(() => {
        this.unduck();
      }, 1200);
    } catch (err) {
      console.warn('[AudioManager] playCelebrationSound error:', err);
      this.unduck();
    }
  }

  /**
   * Plays a joyful treasure chest opening chime and celebration fanfare.
   */
  public playChestOpenSound(): void {
    this.playCelebrationSound();
  }

  // =========================================================================
  // TEXT-TO-SPEECH (TTS) WRAPPER
  // =========================================================================

  /**
   * Stops in-flight speech synthesis cleanly and safely.
   */
  public stopSpeech(): void {
    try {
      Speech.stop();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      console.warn('[AudioManager] stopSpeech error:', err);
    }
  }

  /**
   * Guaranteed Game Exit Audio Contract:
   * 1. Stops all TTS speech instantly.
   * 2. Stops any running SFX audio.
   * 3. Resets ducking count to prevent muted audio.
   * Guarantees ZERO lingering audio after navigating away from a game.
   */
  public stopAllGameAudio(): void {
    this.stopSpeech();
    try {
      if (this.tapPlayer) this.tapPlayer.pause();
      if (this.correctPlayer) this.correctPlayer.pause();
      if (this.wrongPlayer) this.wrongPlayer.pause();
      if (this.celebrationPlayer) this.celebrationPlayer.pause();
    } catch {}
    this.duckRefCount = 0;
  }

  /**
   * Immediately silences all app audio output (BGM, SFX, and TTS).
   */
  public stopAllAudio(): void {
    this.stopSpeech();
    this.stopBackgroundMusic();
    try {
      if (this.tapPlayer) this.tapPlayer.pause();
      if (this.correctPlayer) this.correctPlayer.pause();
      if (this.wrongPlayer) this.wrongPlayer.pause();
      if (this.celebrationPlayer) this.celebrationPlayer.pause();
    } catch {}
    this.duckRefCount = 0;
  }

  // =========================================================================
  // SETTINGS & GETTERS
  // =========================================================================

  public setMusicEnabled(enabled: boolean): void {
    this.isMusicEnabled = enabled;
    setStorageItem(MUSIC_STORAGE_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      this.pauseBackgroundMusic();
    } else if (!this.isRecordingMic) {
      this.resumeBackgroundMusic();
    }
    this.notifyListeners();
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  public setSfxEnabled(enabled: boolean): void {
    this.isSfxEnabled = enabled;
    setStorageItem(SFX_STORAGE_KEY, enabled ? 'true' : 'false');
    this.notifyListeners();
  }

  public getSfxEnabled(): boolean {
    return this.isSfxEnabled;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgPlayer && this.isMusicPlaying && this.duckRefCount === 0) {
      try {
        this.bgPlayer.volume = this.musicVolume;
      } catch {}
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  public isMusicActive(): boolean {
    return this.isMusicPlaying;
  }
}

export const audioManager = AudioManager.getInstance();
export default audioManager;

export const useAudioSettings = () => {
  const React = require('react');
  const [settings, setSettings] = React.useState(() => ({
    musicEnabled: audioManager.getMusicEnabled(),
    sfxEnabled: audioManager.getSfxEnabled(),
    isMusicPlaying: audioManager.isMusicActive(),
  }));

  React.useEffect(() => {
    const unsub = audioManager.subscribe(() => {
      setSettings({
        musicEnabled: audioManager.getMusicEnabled(),
        sfxEnabled: audioManager.getSfxEnabled(),
        isMusicPlaying: audioManager.isMusicActive(),
      });
    });
    return unsub;
  }, []);

  const toggleMusic = React.useCallback(() => {
    audioManager.setMusicEnabled(!audioManager.getMusicEnabled());
  }, []);

  const toggleSfx = React.useCallback(() => {
    audioManager.setSfxEnabled(!audioManager.getSfxEnabled());
  }, []);

  return {
    ...settings,
    toggleMusic,
    toggleSfx,
  };
};
