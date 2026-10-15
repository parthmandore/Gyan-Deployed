/**
 * Purpose: Central Authentication and Session Management Store for Gyannn.
 *          Backed by the robust zero-network Local Database for reliable offline-first
 *          student authentication, multi-student isolation, and session persistence.
 * Module: State Management
 * Folder: frontend/src/state
 */

import { create } from 'zustand';
import { localDatabase, LocalUserRecord } from '../services/localDatabase';
import { setAuthToken } from '../services/apiClient';
import { useChildProfileStore } from './childProfileStore';
import { useProgressStore } from './useProgressStore';
import { useAppLanguageStore, AppLanguage, LearningLanguage, AppAge } from './appLanguageStore';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  age: AppAge;
  mother_tongue: AppLanguage;
  learning_language: LearningLanguage;
  app_language: AppLanguage;
  avatar: string;
  role: 'child' | 'parent' | 'teacher';
}

export interface AuthState {
  token: string | null;
  user: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  signup: (params: {
    username: string;
    pin: string;
    name: string;
    age: AppAge;
    appLanguage: AppLanguage;
    learningLanguage: LearningLanguage;
    motherTongue?: AppLanguage;
    avatar: string;
    role?: 'child' | 'parent' | 'teacher';
  }) => Promise<{ success: boolean; error?: string }>;

  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;

  logout: () => Promise<void>;

  restoreSession: () => Promise<boolean>;
}

function mapLocalToUserAccount(localUser: LocalUserRecord): UserAccount {
  return {
    id: localUser.id,
    username: localUser.username,
    name: localUser.name,
    age: localUser.age,
    mother_tongue: localUser.motherTongue,
    learning_language: localUser.learningLanguage,
    app_language: localUser.appLanguage,
    avatar: localUser.avatar,
    role: 'child',
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signup: async (params) => {
    set({ isLoading: true, error: null });

    try {
      const effectiveAppLang = params.appLanguage || params.motherTongue || 'en';
      const effectiveMother = params.motherTongue || effectiveAppLang;

      // 1. Primary: Save to Local Database with validation & unique username check
      const localRes = await localDatabase.registerStudent({
        username: params.username,
        pin: params.pin,
        name: params.name,
        age: params.age,
        avatar: params.avatar,
        motherTongue: effectiveMother,
        learningLanguage: params.learningLanguage,
        appLanguage: effectiveAppLang,
      });

      if (!localRes.success || !localRes.user || !localRes.token) {
        set({ isLoading: false, error: localRes.error || 'Could not create account.' });
        return { success: false, error: localRes.error || 'Could not create account.' };
      }

      const localUser = localRes.user;
      const userAccount = mapLocalToUserAccount(localUser);
      const token = localRes.token;

      // 2. Set API client token for subsequent local calls if backend ever starts
      setAuthToken(token);

      // 3. Update Child Profile Store and Progress Store
      await useChildProfileStore.getState().saveProfile({
        childId: localUser.id,
        name: localUser.name,
        age: localUser.age,
        avatar: localUser.avatar,
        motherTongue: localUser.motherTongue,
        learningLanguage: localUser.learningLanguage,
        appLanguage: localUser.appLanguage,
      });

      await useProgressStore.getState().setActiveChild(localUser.id);

      // 4. Update Languages Store
      const langStore = useAppLanguageStore.getState();
      await langStore.setMotherTongue(localUser.motherTongue);
      await langStore.setLearningLanguage(localUser.learningLanguage);
      await langStore.setAppLanguage(localUser.appLanguage);
      await langStore.setSelectedAge(localUser.age);

      set({
        token,
        user: userAccount,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (e: any) {
      console.warn('[authStore] Signup error:', e);
      const userFriendlyMsg = "Oops! We couldn't save your profile. Let's try again! 🌟";
      set({ isLoading: false, error: userFriendlyMsg });
      return { success: false, error: userFriendlyMsg };
    }
  },

  login: async (username, pin) => {
    set({ isLoading: true, error: null });

    try {
      // 1. Primary: Verify against Local Database
      const localRes = await localDatabase.loginStudent(username, pin);

      if (!localRes.success || !localRes.user || !localRes.token) {
        set({ isLoading: false, error: localRes.error || 'Username or PIN did not match.' });
        return { success: false, error: localRes.error || 'Username or PIN did not match.' };
      }

      const localUser = localRes.user;
      const userAccount = mapLocalToUserAccount(localUser);
      const token = localRes.token;

      setAuthToken(token);

      // 2. Load this student's profile into stores
      await useChildProfileStore.getState().saveProfile({
        childId: localUser.id,
        name: localUser.name,
        age: localUser.age,
        avatar: localUser.avatar,
        motherTongue: localUser.motherTongue,
        learningLanguage: localUser.learningLanguage,
        appLanguage: localUser.appLanguage,
      });

      // 3. Switch progress store to this student's isolated history
      await useProgressStore.getState().setActiveChild(localUser.id);

      // 4. Update language store
      const langStore = useAppLanguageStore.getState();
      await langStore.setMotherTongue(localUser.motherTongue);
      await langStore.setLearningLanguage(localUser.learningLanguage);
      await langStore.setAppLanguage(localUser.appLanguage);
      await langStore.setSelectedAge(localUser.age);

      set({
        token,
        user: userAccount,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (e: any) {
      console.warn('[authStore] Login error:', e);
      const userFriendlyMsg = "Oops! We couldn't log you in. Let's try again! 🌟";
      set({ isLoading: false, error: userFriendlyMsg });
      return { success: false, error: userFriendlyMsg };
    }
  },

  logout: async () => {
    try {
      await localDatabase.clearActiveSession();
      setAuthToken(null);
    } catch {}

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  restoreSession: async () => {
    try {
      const activeSession = await localDatabase.getActiveSession();
      if (!activeSession) {
        return false;
      }

      const localUser = await localDatabase.getUserById(activeSession.userId);
      if (!localUser) {
        await localDatabase.clearActiveSession();
        return false;
      }

      const userAccount = mapLocalToUserAccount(localUser);
      setAuthToken(activeSession.token);

      // Load profile & isolated progress
      await useChildProfileStore.getState().saveProfile({
        childId: localUser.id,
        name: localUser.name,
        age: localUser.age,
        avatar: localUser.avatar,
        motherTongue: localUser.motherTongue,
        learningLanguage: localUser.learningLanguage,
        appLanguage: localUser.appLanguage,
      });

      await useProgressStore.getState().setActiveChild(localUser.id);

      const langStore = useAppLanguageStore.getState();
      await langStore.setMotherTongue(localUser.motherTongue);
      await langStore.setLearningLanguage(localUser.learningLanguage);
      await langStore.setAppLanguage(localUser.appLanguage);
      await langStore.setSelectedAge(localUser.age);

      set({
        token: activeSession.token,
        user: userAccount,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch {
      await localDatabase.clearActiveSession();
      setAuthToken(null);
      set({ token: null, user: null, isAuthenticated: false });
      return false;
    }
  },
}));
