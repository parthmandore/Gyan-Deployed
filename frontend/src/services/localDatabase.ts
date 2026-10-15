/**
 * Purpose: Robust, zero-network Local Database for Gyannn Platform.
 *          Persists student accounts, credentials (hashed PIN + salt), active sessions,
 *          and isolated progress per student using AsyncStorage / Web LocalStorage.
 * Module: Services / Persistence
 * Folder: frontend/src/services
 */

import { AppLanguage, LearningLanguage, AppAge } from '../state/appLanguageStore';

export interface LocalUserRecord {
  id: string;
  name: string;
  username: string;
  pinHash: string;
  pinSalt: string;
  avatar: string;
  age: AppAge;
  motherTongue: AppLanguage;
  learningLanguage: LearningLanguage;
  appLanguage: AppLanguage;
  createdAt: string;
  updatedAt: string;
  totalXp: number;
  level: number;
  streakDays: number;
  dailyGoalTarget: number;
  dailyGoalCompleted: number;
  lastPlayedDate?: string;
  preferences?: {
    soundEnabled?: boolean;
    musicEnabled?: boolean;
  };
}

export interface ActiveSession {
  userId: string;
  username: string;
  token: string;
  expiresAt: string;
}

const USERS_DB_KEY = '@gyannn_local_users_db_v1';
const USERNAMES_INDEX_KEY = '@gyannn_local_usernames_index_v1';
const ACTIVE_SESSION_KEY = '@gyannn_local_active_session_v1';
const LAST_USERNAME_KEY = '@gyannn_local_last_username_v1';

// Pure JavaScript SHA-256 implementation for local credential hashing
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii.length; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= (charCode & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

const getStorage = async (key: string): Promise<string | null> => {
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

const setStorage = async (key: string, value: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  } catch {}
};

const removeStorage = async (key: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(key);
  } catch {}
};

class LocalDatabase {
  private static instance: LocalDatabase | null = null;

  public static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  /**
   * Reads all registered user records from local storage.
   */
  public async getUsersMap(): Promise<Record<string, LocalUserRecord>> {
    try {
      const raw = await getStorage(USERS_DB_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  /**
   * Saves the entire users dictionary.
   */
  private async saveUsersMap(map: Record<string, LocalUserRecord>): Promise<void> {
    await setStorage(USERS_DB_KEY, JSON.stringify(map));
  }

  /**
   * Reads the username -> userId index.
   */
  public async getUsernamesIndex(): Promise<Record<string, string>> {
    try {
      const raw = await getStorage(USERNAMES_INDEX_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private async saveUsernamesIndex(index: Record<string, string>): Promise<void> {
    await setStorage(USERNAMES_INDEX_KEY, JSON.stringify(index));
  }

  /**
   * Checks if a username is already taken locally (case-insensitive).
   */
  public async isUsernameTaken(username: string): Promise<boolean> {
    const clean = username.trim().toLowerCase();
    const index = await this.getUsernamesIndex();
    return Boolean(index[clean]);
  }

  /**
   * Finds a user record by username (case-insensitive).
   */
  public async getUserByUsername(username: string): Promise<LocalUserRecord | null> {
    const clean = username.trim().toLowerCase();
    const index = await this.getUsernamesIndex();
    const userId = index[clean];
    if (!userId) return null;

    const users = await this.getUsersMap();
    return users[userId] || null;
  }

  /**
   * Finds a user record by student ID.
   */
  public async getUserById(userId: string): Promise<LocalUserRecord | null> {
    const users = await this.getUsersMap();
    return users[userId] || null;
  }

  /**
   * Creates and registers a new student profile in the local database.
   */
  public async registerStudent(params: {
    username: string;
    pin: string;
    name: string;
    age: AppAge;
    avatar: string;
    motherTongue?: AppLanguage;
    learningLanguage: LearningLanguage;
    appLanguage: AppLanguage;
  }): Promise<{ success: boolean; user?: LocalUserRecord; token?: string; error?: string }> {
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanName = params.name.trim();
    const cleanPin = params.pin.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your name! 🌟' };
    }
    if (!cleanUsername) {
      return { success: false, error: 'Please create a username! 👤' };
    }
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 letters long! 👤' };
    }
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      return { success: false, error: 'PIN must be exactly 4 numbers (like 1234)! 🔢' };
    }

    // Check duplicate username
    const exists = await this.isUsernameTaken(cleanUsername);
    if (exists) {
      return { success: false, error: 'This username is already taken. Try another one! 🌟' };
    }

    // Generate student ID and salt
    const nowIso = new Date().toISOString();
    const studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const salt = Math.random().toString(36).substring(2, 10);
    const pinHash = sha256(salt + cleanPin);

    const newUser: LocalUserRecord = {
      id: studentId,
      name: cleanName,
      username: cleanUsername,
      pinHash,
      pinSalt: salt,
      avatar: params.avatar || '🦁',
      age: params.age,
      motherTongue: params.motherTongue || params.appLanguage,
      learningLanguage: params.learningLanguage,
      appLanguage: params.appLanguage,
      createdAt: nowIso,
      updatedAt: nowIso,
      totalXp: 0,
      level: 1,
      streakDays: 0,
      dailyGoalTarget: 3,
      dailyGoalCompleted: 0,
      preferences: {
        soundEnabled: true,
        musicEnabled: true,
      },
    };

    // Save to users table and index
    const users = await this.getUsersMap();
    users[studentId] = newUser;
    await this.saveUsersMap(users);

    const index = await this.getUsernamesIndex();
    index[cleanUsername] = studentId;
    await this.saveUsernamesIndex(index);

    // Create and save active session
    const token = `localtok_${studentId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const session: ActiveSession = {
      userId: studentId,
      username: cleanUsername,
      token,
      expiresAt,
    };

    await setStorage(ACTIVE_SESSION_KEY, JSON.stringify(session));
    await setStorage(LAST_USERNAME_KEY, cleanUsername);

    return {
      success: true,
      user: newUser,
      token,
    };
  }

  /**
   * Authenticates an existing student using username and 4-digit PIN.
   */
  public async loginStudent(
    username: string,
    pin: string
  ): Promise<{ success: boolean; user?: LocalUserRecord; token?: string; error?: string }> {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUsername) {
      return { success: false, error: 'Please enter your username! 👤' };
    }
    if (!cleanPin || cleanPin.length !== 4) {
      return { success: false, error: 'Please enter your 4-digit PIN! 🔢' };
    }

    const user = await this.getUserByUsername(cleanUsername);
    if (!user) {
      return {
        success: false,
        error: "We couldn't find that username. Check spelling or create your profile! 🌟",
      };
    }

    const computedHash = sha256(user.pinSalt + cleanPin);
    if (computedHash !== user.pinHash) {
      return {
        success: false,
        error: "PIN did not match! Try again or ask your parent. 🔢",
      };
    }

    // Valid credentials: create active session
    const token = `localtok_${user.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const session: ActiveSession = {
      userId: user.id,
      username: cleanUsername,
      token,
      expiresAt,
    };

    await setStorage(ACTIVE_SESSION_KEY, JSON.stringify(session));
    await setStorage(LAST_USERNAME_KEY, cleanUsername);

    return {
      success: true,
      user,
      token,
    };
  }

  /**
   * Returns current active session if one exists and has not expired.
   */
  public async getActiveSession(): Promise<ActiveSession | null> {
    try {
      const raw = await getStorage(ACTIVE_SESSION_KEY);
      if (!raw) return null;
      const session: ActiveSession = JSON.parse(raw);
      if (!session || !session.userId) return null;

      if (new Date(session.expiresAt) < new Date()) {
        await this.clearActiveSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  /**
   * Returns the last logged-in username for friendly pre-filling.
   */
  public async getLastUsername(): Promise<string | null> {
    return await getStorage(LAST_USERNAME_KEY);
  }

  /**
   * Clears the active session on explicit logout.
   * Does NOT touch the student's records or history in the database.
   */
  public async clearActiveSession(): Promise<void> {
    await removeStorage(ACTIVE_SESSION_KEY);
  }

  /**
   * Updates a student's profile settings (avatar, languages, preferences).
   */
  public async updateUserProfile(
    userId: string,
    updates: Partial<Pick<LocalUserRecord, 'name' | 'avatar' | 'age' | 'motherTongue' | 'learningLanguage' | 'appLanguage' | 'preferences'>>
  ): Promise<LocalUserRecord | null> {
    const users = await this.getUsersMap();
    const user = users[userId];
    if (!user) return null;

    const updatedUser: LocalUserRecord = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    users[userId] = updatedUser;
    await this.saveUsersMap(users);
    return updatedUser;
  }

  /**
   * Updates student progress counters (XP, level, streak, goals).
   */
  public async updateUserProgress(
    userId: string,
    progress: { totalXp?: number; level?: number; streakDays?: number; dailyGoalCompleted?: number }
  ): Promise<void> {
    const users = await this.getUsersMap();
    const user = users[userId];
    if (!user) return;

    if (progress.totalXp !== undefined) user.totalXp = progress.totalXp;
    if (progress.level !== undefined) user.level = progress.level;
    if (progress.streakDays !== undefined) user.streakDays = progress.streakDays;
    if (progress.dailyGoalCompleted !== undefined) user.dailyGoalCompleted = progress.dailyGoalCompleted;
    user.updatedAt = new Date().toISOString();

    users[userId] = user;
    await this.saveUsersMap(users);
  }
}

export const localDatabase = LocalDatabase.getInstance();
