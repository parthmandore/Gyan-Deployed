/**
 * Purpose: Global Language Manager service handling persistence (AsyncStorage) and state.
 * Module: Language Architecture
 * Folder: frontend/src/language
 */

import i18n from '../localization/i18n';
import { LearningLanguage, SUPPORTED_LANGUAGES } from './types';

const STORAGE_KEY = '@gyan_learning_language';
const DEFAULT_LANGUAGE: LearningLanguage = 'english';

class LanguageManagerService {
  private currentLanguage: LearningLanguage = DEFAULT_LANGUAGE;
  private isLoaded: boolean = false;

  /**
   * Loads persisted learning language from storage on app launch.
   */
  async init(): Promise<LearningLanguage> {
    if (this.isLoaded) return this.currentLanguage;

    try {
      // Check Zustand appLanguageStore first
      try {
        const { useAppLanguageStore } = require('../state/appLanguageStore');
        const storeLang = useAppLanguageStore.getState().learningLanguage;
        if (storeLang === 'hi' || storeLang === 'hindi') {
          this.currentLanguage = 'hindi';
          this.isLoaded = true;
          this.syncI18n();
          return this.currentLanguage;
        } else if (storeLang === 'mr' || storeLang === 'marathi') {
          this.currentLanguage = 'marathi';
          this.isLoaded = true;
          this.syncI18n();
          return this.currentLanguage;
        } else if (storeLang === 'en' || storeLang === 'english') {
          this.currentLanguage = 'english';
          this.isLoaded = true;
          this.syncI18n();
          return this.currentLanguage;
        }
      } catch {}

      let stored: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        stored = window.localStorage.getItem(STORAGE_KEY);
      } else {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          stored = await AsyncStorage.getItem(STORAGE_KEY);
        } catch {
          // Fallback if native module unavailable
        }
      }

      if (stored === 'hindi' || stored === 'hi') {
        this.currentLanguage = 'hindi';
      } else if (stored === 'marathi' || stored === 'mr') {
        this.currentLanguage = 'marathi';
      } else if (stored === 'english' || stored === 'en') {
        this.currentLanguage = 'english';
      } else {
        this.currentLanguage = DEFAULT_LANGUAGE;
      }
    } catch (err) {
      console.warn('[LanguageManager] Error loading language from storage, fallback to default:', err);
      this.currentLanguage = DEFAULT_LANGUAGE;
    }

    this.isLoaded = true;
    this.syncI18n();
    return this.currentLanguage;
  }

  /**
   * Gets current active learning language synchronously.
   */
  getLanguage(): LearningLanguage {
    try {
      const { useAppLanguageStore } = require('../state/appLanguageStore');
      const storeLang = useAppLanguageStore.getState().learningLanguage;
      if (storeLang === 'hi' || storeLang === 'hindi') return 'hindi';
      if (storeLang === 'mr' || storeLang === 'marathi') return 'marathi';
      if (storeLang === 'en' || storeLang === 'english') return 'english';
    } catch {}
    return this.currentLanguage;
  }

  /**
   * Sets and persists the global learning language.
   */
  async setLanguage(lang: LearningLanguage | 'en' | 'hi' | 'mr'): Promise<void> {
    const normalized: LearningLanguage =
      lang === 'hi' || lang === 'hindi'
        ? 'hindi'
        : lang === 'mr' || lang === 'marathi'
        ? 'marathi'
        : 'english';

    this.currentLanguage = normalized;
    this.syncI18n();

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, normalized);
      } else {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(STORAGE_KEY, normalized);
        } catch {
          // Storage fallback
        }
      }
    } catch (err) {
      console.warn('[LanguageManager] Error saving language to storage:', err);
    }
  }

  /**
   * Syncs i18next language locale to match selected learning language.
   */
  private syncI18n(): void {
    try {
      const { useAppLanguageStore } = require('../state/appLanguageStore');
      const appLang = useAppLanguageStore.getState().appLanguage;
      if (appLang && i18n && typeof i18n.changeLanguage === 'function') {
        i18n.changeLanguage(appLang);
        return;
      }
    } catch {}

    const meta = SUPPORTED_LANGUAGES[this.currentLanguage];
    if (meta && i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(meta.code);
    }
  }
}

export const LanguageManager = new LanguageManagerService();
