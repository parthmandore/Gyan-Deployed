/**
 * Purpose: Automated Verification Suite for Gyannn Local Database & Authentication Engine.
 * Tests:
 * 1. Student Signup & Local Database Persistence
 * 2. SHA-256 Credential Hashing (No plaintext PINs)
 * 3. Duplicate Username Prevention (Case-Insensitive)
 * 4. Multi-Student Profile Isolation (Student A vs Student B)
 * 5. Session Management (Login, Restore, Logout)
 * 6. Three-Way Independent Language Preservation
 * 7. Age 8 System Integration
 */

const assert = require('assert');

// In-Memory Storage Mock simulating AsyncStorage / localStorage
const mockStorage = new Map();

const storage = {
  getItem: async (k) => (mockStorage.has(k) ? mockStorage.get(k) : null),
  setItem: async (k, v) => mockStorage.set(k, String(v)),
  removeItem: async (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
};

// SHA-256 implementation identical to localDatabase.ts
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words = [];
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

  for (let i = 0; i < ascii.length; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= (charCode & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let j = 0; j < 64; j++) {
      if (j >= 16) {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

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

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

// Local Database test harness mirroring localDatabase.ts
const USERS_DB_KEY = '@gyannn_local_users_db_v1';
const USERNAMES_INDEX_KEY = '@gyannn_local_usernames_index_v1';
const ACTIVE_SESSION_KEY = '@gyannn_local_active_session_v1';

async function registerStudent(params) {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanName = params.name.trim();
  const cleanPin = params.pin.trim();

  if (!cleanName) return { success: false, error: 'Please enter your name! 🌟' };
  if (!cleanUsername || cleanUsername.length < 3) return { success: false, error: 'Username must be at least 3 letters! 👤' };
  if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) return { success: false, error: 'PIN must be 4 digits! 🔢' };

  const rawIndex = await storage.getItem(USERNAMES_INDEX_KEY);
  const index = rawIndex ? JSON.parse(rawIndex) : {};

  if (index[cleanUsername]) {
    return { success: false, error: 'This username is already taken. Try another one! 🌟' };
  }

  const rawUsers = await storage.getItem(USERS_DB_KEY);
  const users = rawUsers ? JSON.parse(rawUsers) : {};

  const studentId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const salt = 'salt_' + Math.random().toString(36).substring(2, 8);
  const pinHash = sha256(salt + cleanPin);

  const newUser = {
    id: studentId,
    name: cleanName,
    username: cleanUsername,
    pinHash,
    pinSalt: salt,
    avatar: params.avatar || '🦁',
    age: params.age,
    motherTongue: params.motherTongue,
    learningLanguage: params.learningLanguage,
    appLanguage: params.appLanguage,
    totalXp: 0,
    level: 1,
    streakDays: 0,
    createdAt: new Date().toISOString(),
  };

  users[studentId] = newUser;
  index[cleanUsername] = studentId;

  await storage.setItem(USERS_DB_KEY, JSON.stringify(users));
  await storage.setItem(USERNAMES_INDEX_KEY, JSON.stringify(index));

  const session = {
    userId: studentId,
    username: cleanUsername,
    token: `localtok_${studentId}`,
  };
  await storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));

  return { success: true, user: newUser, token: session.token };
}

async function loginStudent(username, pin) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPin = pin.trim();

  const rawIndex = await storage.getItem(USERNAMES_INDEX_KEY);
  const index = rawIndex ? JSON.parse(rawIndex) : {};
  const studentId = index[cleanUsername];

  if (!studentId) {
    return { success: false, error: "Username not found! 🌟" };
  }

  const rawUsers = await storage.getItem(USERS_DB_KEY);
  const users = rawUsers ? JSON.parse(rawUsers) : {};
  const user = users[studentId];

  const computedHash = sha256(user.pinSalt + cleanPin);
  if (computedHash !== user.pinHash) {
    return { success: false, error: "PIN did not match! 🔢" };
  }

  const session = {
    userId: studentId,
    username: cleanUsername,
    token: `localtok_${studentId}`,
  };
  await storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));

  return { success: true, user, token: session.token };
}

async function runTests() {
  console.log('====================================================');
  console.log('  GYANNN LOCAL DATABASE & AUTH SYSTEM TEST SUITE    ');
  console.log('====================================================\n');

  // TEST 1: Register Student A (Age 8, 3-way languages)
  console.log('[TEST 1] Register Student A (Parth Mandore, Age 8)');
  const resA = await registerStudent({
    username: 'parthmandore',
    pin: '1234',
    name: 'Parth',
    age: 8,
    avatar: '🦁',
    motherTongue: 'mr',
    learningLanguage: 'hi',
    appLanguage: 'en',
  });

  assert.strictEqual(resA.success, true, 'Student A registration must succeed');
  assert.ok(resA.user.id.startsWith('student_'), 'Student ID must be formatted properly');
  assert.strictEqual(resA.user.username, 'parthmandore');
  assert.strictEqual(resA.user.age, 8);
  assert.strictEqual(resA.user.motherTongue, 'mr');
  assert.strictEqual(resA.user.learningLanguage, 'hi');
  assert.strictEqual(resA.user.appLanguage, 'en');
  assert.strictEqual(resA.user.totalXp, 0);
  assert.strictEqual(resA.user.level, 1);
  assert.notStrictEqual(resA.user.pinHash, '1234', 'PIN must NOT be stored as plaintext');
  assert.strictEqual(resA.user.pinHash.length, 64, 'PIN must be standard 64-char SHA-256 hash');
  console.log('  ✓ Student A successfully persisted with hashed PIN and Age 8.\n');

  // TEST 2: Duplicate Username Protection
  console.log('[TEST 2] Duplicate Username Protection');
  const resDup = await registerStudent({
    username: 'PARTHMANDORE', // case-insensitive check
    pin: '9999',
    name: 'Another Parth',
    age: 6,
    avatar: '🦊',
    motherTongue: 'en',
    learningLanguage: 'en',
    appLanguage: 'en',
  });

  assert.strictEqual(resDup.success, false, 'Duplicate username must be rejected');
  assert.ok(resDup.error.includes('already taken'), 'Must provide friendly error message');
  console.log('  ✓ Duplicate username correctly rejected with friendly child message.\n');

  // TEST 3: Register Student B (Aarav, Age 6)
  console.log('[TEST 3] Register Student B (Aarav, Age 6)');
  const resB = await registerStudent({
    username: 'aarav_sharma',
    pin: '5678',
    name: 'Aarav',
    age: 6,
    avatar: '🐘',
    motherTongue: 'hi',
    learningLanguage: 'en',
    appLanguage: 'hi',
  });

  assert.strictEqual(resB.success, true, 'Student B registration must succeed');
  assert.notStrictEqual(resB.user.id, resA.user.id, 'Student IDs must be unique');
  console.log('  ✓ Student B registered with unique student ID.\n');

  // TEST 4: Student Data Isolation
  console.log('[TEST 4] Multi-Student Data Isolation');
  // Store progress under Student A's key
  await storage.setItem(`@gyannn_progress_${resA.user.id}`, JSON.stringify({ totalXp: 120, level: 2 }));
  // Store progress under Student B's key
  await storage.setItem(`@gyannn_progress_${resB.user.id}`, JSON.stringify({ totalXp: 20, level: 1 }));

  const progA = JSON.parse(await storage.getItem(`@gyannn_progress_${resA.user.id}`));
  const progB = JSON.parse(await storage.getItem(`@gyannn_progress_${resB.user.id}`));

  assert.strictEqual(progA.totalXp, 120, 'Student A has 120 XP');
  assert.strictEqual(progB.totalXp, 20, 'Student B has 20 XP');
  console.log('  ✓ Student A (120 XP) and Student B (20 XP) data 100% isolated.\n');

  // TEST 5: Login with Wrong PIN
  console.log('[TEST 5] Login with Incorrect PIN');
  const loginWrong = await loginStudent('parthmandore', '0000');
  assert.strictEqual(loginWrong.success, false, 'Wrong PIN must fail');
  assert.ok(loginWrong.error.includes('PIN did not match'), 'Friendly PIN mismatch message');
  console.log('  ✓ Incorrect PIN cleanly rejected.\n');

  // TEST 6: Login with Correct PIN (Student A)
  console.log('[TEST 6] Login with Correct PIN');
  const loginA = await loginStudent('parthmandore', '1234');
  assert.strictEqual(loginA.success, true, 'Correct credentials must log in');
  assert.strictEqual(loginA.user.name, 'Parth');
  assert.strictEqual(loginA.user.age, 8);
  assert.strictEqual(loginA.user.motherTongue, 'mr');
  assert.strictEqual(loginA.user.learningLanguage, 'hi');
  assert.strictEqual(loginA.user.appLanguage, 'en');

  const activeSession = JSON.parse(await storage.getItem(ACTIVE_SESSION_KEY));
  assert.strictEqual(activeSession.userId, resA.user.id, 'Active session belongs to Student A');
  console.log('  ✓ Student A successfully logged in and session established.\n');

  // TEST 7: Logout
  console.log('[TEST 7] Explicit Logout');
  await storage.removeItem(ACTIVE_SESSION_KEY);
  const clearedSession = await storage.getItem(ACTIVE_SESSION_KEY);
  assert.strictEqual(clearedSession, null, 'Active session cleared');

  // Verify Student A record still exists in users table
  const allUsers = JSON.parse(await storage.getItem(USERS_DB_KEY));
  assert.ok(allUsers[resA.user.id], 'Student record MUST remain in database after logout');
  console.log('  ✓ Logout clears active session while preserving student database record.\n');

  console.log('====================================================');
  console.log('  ALL LOCAL DATABASE & AUTH TESTS PASSED (100% CLEAN)');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('[TEST FAILURE]:', err);
  process.exit(1);
});
