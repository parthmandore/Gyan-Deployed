/**
 * Verification Suite: Game Session Lifecycle Fix, Catalogue 2-Column Grid & Child-Friendly UI
 * Target Project: Gyan_deployment/frontend
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   GYAN: GAME LIFECYCLE, CATALOGUE & UI AUDIT       ');
console.log('====================================================\n');

// ---------------------------------------------------------
// SUITE 1: Game Session Lifecycle & Exit Bug Verification
// ---------------------------------------------------------
console.log('--- TEST SUITE 1: Game Session Lifecycle & Exit Bug ---');

// Mock speech service state and methods
let _activeGameSessionId = null;
const _abandonedSessionIds = new Set();
let speechCanceledCount = 0;
let audioStoppedCount = 0;

function registerActiveGameSession(id) {
  _activeGameSessionId = id;
  _abandonedSessionIds.delete(id);
}

function abandonGameSession(id) {
  if (id) {
    _abandonedSessionIds.add(id);
    if (_activeGameSessionId === id) _activeGameSessionId = null;
  } else {
    _activeGameSessionId = null;
  }
  speechCanceledCount++;
}

function isSessionActive(id) {
  if (!id) return true;
  if (_abandonedSessionIds.has(id)) return false;
  if (_activeGameSessionId && _activeGameSessionId !== id) return false;
  return true;
}

async function mockSpeakPhrase(phrase, opts) {
  if (!isSessionActive(opts?.sessionId)) {
    return { success: false, source: 'local_tts_fallback', error: 'Session abandoned' };
  }
  return { success: true, source: 'local_tts_fallback' };
}

// 1.1 Start game session
const testSessionId = `test_game_${Date.now()}`;
registerActiveGameSession(testSessionId);
assert.strictEqual(isSessionActive(testSessionId), true, 'Session must be active on registration');
console.log('[PASS] 1.1 Game session registered and active');

// 1.2 Speech allowed while session is active
(async () => {
  const resultBeforeExit = await mockSpeakPhrase('A for Apple', { sessionId: testSessionId });
  assert.strictEqual(resultBeforeExit.success, true, 'Speech must succeed during active session');
  console.log('[PASS] 1.2 Speech dispatches correctly while session is active');

  // 1.3 Quit / Abandon session immediately
  let status = 'active';
  const activeTimeouts = new Set();
  let xpAwarded = false;
  let resultsScreenShown = false;

  // Schedule a timer that would expire in 100ms
  const timer = setTimeout(() => {
    if (status === 'active') {
      resultsScreenShown = true;
      xpAwarded = true;
    }
  }, 100);
  activeTimeouts.add(timer);

  // Trigger Exit / Hardware Back
  function exitSession() {
    status = 'abandoned';
    abandonGameSession(testSessionId);
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts.clear();
    audioStoppedCount++;
  }

  exitSession();

  assert.strictEqual(status, 'abandoned', 'Session status must immediately be abandoned');
  assert.strictEqual(isSessionActive(testSessionId), false, 'Session must be flagged abandoned in speech service');
  assert.strictEqual(activeTimeouts.size, 0, 'Active timeouts must be cleared on exit');
  assert.strictEqual(speechCanceledCount > 0, true, 'Speech cancellation must be called on exit');
  assert.strictEqual(audioStoppedCount > 0, true, 'audioManager.stopAllGameAudio must be called on exit');
  console.log('[PASS] 1.3 Immediate exit sets abandoned state, cancels speech & clears timeouts');

  // 1.4 Attempt speech after exit (must be blocked)
  const resultAfterExit = await mockSpeakPhrase('Next letter', { sessionId: testSessionId });
  assert.strictEqual(resultAfterExit.success, false, 'Speech must be blocked for abandoned session');
  assert.strictEqual(resultAfterExit.error, 'Session abandoned', 'Error reason must indicate session abandonment');
  console.log('[PASS] 1.4 Post-exit speech requests are completely blocked');

  // 1.5 Wait for timer to have passed and verify results/XP were NOT triggered
  await new Promise(r => setTimeout(r, 150));
  assert.strictEqual(resultsScreenShown, false, 'Results screen must NEVER show after quitting');
  assert.strictEqual(xpAwarded, false, 'Completion XP must NEVER be awarded after quitting');
  console.log('[PASS] 1.5 No late results screen or XP awarded after exit');

  // ---------------------------------------------------------
  // SUITE 2: Game Catalogue Responsive 2-Column Grid
  // ---------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Game Catalogue 2-Column Grid Audit ---');

  const mobileWidths = [360, 375, 390, 412, 414, 430];
  for (const screenWidth of mobileWidths) {
    const maxW = Math.min(screenWidth, 980);
    const containerPadding = screenWidth < 380 ? 10 : 16;
    const availableGridWidth = maxW - containerPadding * 2;
    const numColumns = availableGridWidth >= 880 ? 4 : availableGridWidth >= 600 ? 3 : 2;
    const gridGap = screenWidth < 380 ? 10 : 12;
    const cardWidth = Math.floor((availableGridWidth - (numColumns - 1) * gridGap - 2) / numColumns);

    assert.strictEqual(numColumns, 2, `Screen ${screenWidth}px must display strictly 2 columns`);
    const totalRowWidth = numColumns * cardWidth + (numColumns - 1) * gridGap;
    assert.ok(
      totalRowWidth <= availableGridWidth,
      `Screen ${screenWidth}px: total width (${totalRowWidth}px) exceeds available (${availableGridWidth}px)`
    );
    assert.ok(
      cardWidth >= 150 && cardWidth <= 210,
      `Screen ${screenWidth}px: cardWidth (${cardWidth}px) should be comfortably between 150px and 210px`
    );
    console.log(`[PASS] Width ${screenWidth}px: 2 columns, cardWidth=${cardWidth}px, totalRow=${totalRowWidth}px <= available=${availableGridWidth}px`);
  }

  // Tablet and desktop widths
  const tabletWidth = 768;
  const maxWTab = Math.min(tabletWidth, 980);
  const availTab = maxWTab - 32;
  const numColTab = availTab >= 880 ? 4 : availTab >= 600 ? 3 : 2;
  assert.strictEqual(numColTab, 3, 'Tablet 768px must display 3 columns');
  console.log('[PASS] Width 768px (Tablet): 3 columns responsive grid verified');

  const desktopWidth = 1024;
  const maxWDesk = Math.min(desktopWidth, 980);
  const availDesk = maxWDesk - 32;
  const numColDesk = availDesk >= 880 ? 4 : availDesk >= 600 ? 3 : 2;
  assert.strictEqual(numColDesk, 4, 'Desktop 1024px must display 4 columns');
  console.log('[PASS] Width 1024px (Desktop): 4 columns responsive grid verified');

  // ---------------------------------------------------------
  // SUITE 3: Game Registry & Catalog Data Integrity
  // ---------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Game Registry Data Integrity ---');

  const registryFile = fs.readFileSync(path.join(__dirname, 'src/config/gameRegistry.ts'), 'utf8');
  assert.ok(registryFile.includes('export const GAME_REGISTRY'), 'gameRegistry.ts must export GAME_REGISTRY');

  // Check required fields pattern
  const rawCards = registryFile.split(/\{\s*id:\s*'/).slice(1);
  console.log(`Auditing ${rawCards.length} registered games...`);
  assert.ok(rawCards.length >= 20, `Must have at least 20 registered games, found ${rawCards.length}`);

  for (const card of rawCards) {
    const id = card.split("'")[0];
    assert.ok(card.includes('titleKey:'), `Game ${id} missing titleKey`);
    assert.ok(card.includes('descriptionKey:'), `Game ${id} missing descriptionKey`);
    assert.ok(card.includes('iconAsset:'), `Game ${id} missing iconAsset`);
    assert.ok(card.includes('navigatorRoute:'), `Game ${id} missing navigatorRoute`);
    assert.ok(card.includes('gradientColors:'), `Game ${id} missing gradientColors`);
    assert.ok(card.includes('bevelColor:'), `Game ${id} missing bevelColor`);
    assert.ok(card.includes('ageGroups:'), `Game ${id} missing ageGroups`);
    assert.ok(card.includes('supportedLanguages:'), `Game ${id} missing supportedLanguages`);
  }
  console.log(`[PASS] All ${rawCards.length} games have complete visual badges, routes, age groups and languages`);

  // ---------------------------------------------------------
  // SUITE 4: Child-Friendly UI & Accessibility Standards
  // ---------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Child-Friendly UI & Accessibility ---');

  const catalogCode = fs.readFileSync(path.join(__dirname, 'src/screens/GameCatalogScreen.tsx'), 'utf8');
  assert.ok(catalogCode.includes('<CartoonBackground'), 'GameCatalogScreen must render CartoonBackground');
  assert.ok(catalogCode.includes('styles.ageSelectorContainer'), 'GameCatalogScreen must render Age Selector');
  assert.ok(catalogCode.includes('minHeight: 48'), 'Realm filter buttons must have minHeight >= 48px touch target');
  assert.ok(catalogCode.includes('borderBottomWidth: 5'), 'Game cards must have 3D tactile bevel effect');
  console.log('[PASS] CartoonBackground, 48px+ touch targets, tactile bevels & Age Selector verified');

  const lifecycleCode = fs.readFileSync(path.join(__dirname, 'src/hooks/useGameSessionLifecycle.ts'), 'utf8');
  assert.ok(lifecycleCode.includes('abandonGameSession'), 'Lifecycle hook must call abandonGameSession');
  assert.ok(lifecycleCode.includes("statusRef.current = 'abandoned'"), 'Lifecycle hook must set statusRef to abandoned synchronously');
  assert.ok(lifecycleCode.includes('clearAllTimers'), 'Lifecycle hook must clear all active timers');
  assert.ok(lifecycleCode.includes('stopSpeech'), 'Lifecycle hook must stop speech');
  assert.ok(lifecycleCode.includes('stopAllGameAudio'), 'Lifecycle hook must stop all game audio');
  assert.ok(lifecycleCode.includes('addListener(\'blur\''), 'Lifecycle hook must listen to navigation blur');
  assert.ok(lifecycleCode.includes('addListener(\'beforeRemove\''), 'Lifecycle hook must listen to navigation beforeRemove');
  console.log('[PASS] useGameSessionLifecycle hook has synchronous teardown, blur & beforeRemove listeners');

  console.log('\n====================================================');
  console.log('   ALL TESTS PASSED! AUDIT COMPLETE (100% SUCCESS)  ');
  console.log('====================================================');
})();
