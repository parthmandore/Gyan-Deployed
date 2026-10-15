/**
 * Purpose: Central Child Profile Store using Zustand & Local Database.
 *          Manages child identification, name, age, avatar, and independent language preferences.
 *          Synchronizes with Local Database and local storage with offline-first resilience.
 * Module: State Management
 * Folder: frontend/src/state
 */

import { create } from 'zustand';
import { AppLanguage, LearningLanguage, AppAge, useAppLanguageStore } from './appLanguageStore';
import { localDatabase } from '../services/localDatabase';

export interface ChildProfile {
  childId: string;
  name: string;
  age: AppAge;
  motherTongue: AppLanguage;
  learningLanguage: LearningLanguage;
  appLanguage: AppLanguage;
  avatar: string;
  isOnboarded: boolean;
}

export interface ChildProfileState extends ChildProfile {
  isLoaded: boolean;

  initProfile: () => Promise<boolean>;
  saveProfile: (profile: Omit<ChildProfile, 'isOnboarded'>) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateLanguages: (motherTongue: AppLanguage, learningLanguage: LearningLanguage, appLanguage?: AppLanguage) => Promise<void>;
  updateAge: (age: AppAge) => Promise<void>;
}

const PROFILE_STORAGE_KEY = '@gyannn_child_profile';

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(key);
  } catch (err) {
    console.warn(`[childProfileStore] Error reading storage key ${key}:`, err);
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
  } catch (err) {
    console.warn(`[childProfileStore] Error writing storage key ${key}:`, err);
  }
};

export const AVATAR_OPTIONS = [
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'koala', emoji: '🐨', label: 'Koala' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
];

export const useChildProfileStore = create<ChildProfileState>((set, get) => ({
  childId: 'child_default',
  name: 'Little Learner',
  age: 5,
  motherTongue: 'en',
  learningLanguage: 'en',
  appLanguage: 'en',
  avatar: '🦁',
  isOnboarded: false,
  isLoaded: false,

  initProfile: async () => {
    try {
      // 1. Check if active session exists in Local Database
      const session = await localDatabase.getActiveSession();
      if (session) {
        const localUser = await localDatabase.getUserById(session.userId);
        if (localUser) {
          const profile: ChildProfile = {
            childId: localUser.id,
            name: localUser.name,
            age: localUser.age,
            motherTongue: localUser.motherTongue,
            learningLanguage: localUser.learningLanguage,
            appLanguage: localUser.appLanguage,
            avatar: localUser.avatar,
            isOnboarded: true,
          };

          set({ ...profile, isLoaded: true });

          // Sync with appLanguageStore
          const langStore = useAppLanguageStore.getState();
          await langStore.setMotherTongue(localUser.motherTongue);
          await langStore.setLearningLanguage(localUser.learningLanguage);
          await langStore.setAppLanguage(localUser.appLanguage);
          await langStore.setSelectedAge(localUser.age);

          // Sync with useProgressStore
          const { useProgressStore } = require('./useProgressStore');
          await useProgressStore.getState().setActiveChild(localUser.id);

          return true;
        }
      }

      // 2. Check fallback profile storage key
      const raw = await getStorageItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name && parsed.childId && parsed.isOnboarded) {
          set({
            childId: parsed.childId,
            name: parsed.name,
            age: parsed.age || 5,
            motherTongue: parsed.motherTongue || 'en',
            learningLanguage: parsed.learningLanguage || 'en',
            appLanguage: parsed.appLanguage || parsed.motherTongue || 'en',
            avatar: parsed.avatar || '🦁',
            isOnboarded: true,
            isLoaded: true,
          });
          return true;
        }
      }

      set({ isLoaded: true, isOnboarded: false });
      return false;
    } catch (e) {
      console.warn('[childProfileStore] Init profile failed:', e);
      set({ isLoaded: true, isOnboarded: false });
      return false;
    }
  },

  saveProfile: async (profile) => {
    const fullProfile: ChildProfile = {
      ...profile,
      isOnboarded: true,
    };

    set({ ...fullProfile, isLoaded: true });
    await setStorageItem(PROFILE_STORAGE_KEY, JSON.stringify(fullProfile));

    // Persist to local database
    await localDatabase.updateUserProfile(fullProfile.childId, {
      name: fullProfile.name,
      avatar: fullProfile.avatar,
      age: fullProfile.age,
      motherTongue: fullProfile.motherTongue,
      learningLanguage: fullProfile.learningLanguage,
      appLanguage: fullProfile.appLanguage,
    });

    // Sync with appLanguageStore
    const langStore = useAppLanguageStore.getState();
    await langStore.setMotherTongue(profile.motherTongue);
    await langStore.setLearningLanguage(profile.learningLanguage);
    await langStore.setAppLanguage(profile.appLanguage);
    await langStore.setSelectedAge(profile.age);

    // Sync with useProgressStore
    const { useProgressStore } = require('./useProgressStore');
    await useProgressStore.getState().setActiveChild(fullProfile.childId);
  },

  updateAvatar: async (avatar: string) => {
    set({ avatar });
    const current = get();

    await localDatabase.updateUserProfile(current.childId, { avatar });
    await setStorageItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        childId: current.childId,
        name: current.name,
        age: current.age,
        motherTongue: current.motherTongue,
        learningLanguage: current.learningLanguage,
        appLanguage: current.appLanguage,
        avatar,
        isOnboarded: current.isOnboarded,
      })
    );
  },

  updateLanguages: async (motherTongue: AppLanguage, learningLanguage: LearningLanguage, appLanguage?: AppLanguage) => {
    const effectiveAppLang = appLanguage || motherTongue;
    set({ motherTongue, learningLanguage, appLanguage: effectiveAppLang });
    const current = get();

    await localDatabase.updateUserProfile(current.childId, {
      motherTongue,
      learningLanguage,
      appLanguage: effectiveAppLang,
    });

    await setStorageItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        childId: current.childId,
        name: current.name,
        age: current.age,
        motherTongue,
        learningLanguage,
        appLanguage: effectiveAppLang,
        avatar: current.avatar,
        isOnboarded: current.isOnboarded,
      })
    );

    const langStore = useAppLanguageStore.getState();
    await langStore.setMotherTongue(motherTongue);
    await langStore.setLearningLanguage(learningLanguage);
    await langStore.setAppLanguage(effectiveAppLang);
  },

  updateAge: async (age: AppAge) => {
    set({ age });
    const current = get();

    await localDatabase.updateUserProfile(current.childId, { age });
    await setStorageItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        childId: current.childId,
        name: current.name,
        age,
        motherTongue: current.motherTongue,
        learningLanguage: current.learningLanguage,
        appLanguage: current.appLanguage,
        avatar: current.avatar,
        isOnboarded: current.isOnboarded,
      })
    );

    await useAppLanguageStore.getState().setSelectedAge(age);
  },
}));
