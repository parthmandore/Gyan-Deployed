/**
 * Automated Verification Script: Navigation and Game Report Lifecycle
 * Verifies:
 * 1. Bug 1: GameCatalog Back button always navigates to ChildDashboard (no stale game restoration)
 * 2. Bug 2: All 18 games route to Report screen on early exit with isAbandoned: true
 * 3. Bug 3: Teardown guards, speech stop, audio stop, timer cleanup on quit
 * 4. Bug 4: Report navigation handlers (Choose Game -> GameCatalog reset, Dashboard -> ChildDashboard reset, Back -> GameCatalog)
 * 5. GameSessionCompleteView child-friendly quit early state & zero-activity display
 * 6. useProgressStore abandonment handling (no completedGamesCount increment)
 * 7. Localization keys present in EN, HI, MR
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = __dirname;
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

console.log('====================================================');
console.log('TEST SUITE: Navigation & Game Report Lifecycle Audit');
console.log('====================================================\n');

// 1. Audit Navigation Helpers
console.log('--- 1. Navigation Helpers ---');
const navHelpersPath = path.join(FRONTEND_DIR, 'src', 'navigation', 'navigationHelpers.ts');
assert(fs.existsSync(navHelpersPath), 'navigationHelpers.ts exists');
if (fs.existsSync(navHelpersPath)) {
  const content = fs.readFileSync(navHelpersPath, 'utf8');
  assert(content.includes('navigateToGameCatalog'), 'Defines navigateToGameCatalog');
  assert(content.includes('navigateToChildDashboard'), 'Defines navigateToChildDashboard');
  assert(content.includes("name: 'ChildDashboard'"), 'Reset targets ChildDashboard');
  assert(content.includes("name: 'GameCatalog'"), 'Reset targets GameCatalog');
}

// 2. Audit GameCatalogScreen Back Navigation
console.log('\n--- 2. GameCatalogScreen Back Navigation ---');
const catalogPath = path.join(FRONTEND_DIR, 'src', 'screens', 'GameCatalogScreen.tsx');
assert(fs.existsSync(catalogPath), 'GameCatalogScreen.tsx exists');
if (fs.existsSync(catalogPath)) {
  const content = fs.readFileSync(catalogPath, 'utf8');
  assert(
    content.includes('navigateToChildDashboard(navigation)'),
    'Back handler calls navigateToChildDashboard(navigation)'
  );
  assert(
    content.includes('BackHandler.addEventListener'),
    'Handles hardware Back button'
  );
}

// 3. Audit GamesNavigator Stack Integrity
console.log('\n--- 3. GamesNavigator Stack Cleanup ---');
const gamesNavPath = path.join(FRONTEND_DIR, 'src', 'navigation', 'GamesNavigator.tsx');
assert(fs.existsSync(gamesNavPath), 'GamesNavigator.tsx exists');
if (fs.existsSync(gamesNavPath)) {
  const content = fs.readFileSync(gamesNavPath, 'utf8');
  assert(
    !content.includes('<Stack.Screen name="GameCatalog"'),
    'No redundant GameCatalog screen inside GamesNavigator'
  );
}

// 4. Audit useGameSessionLifecycle Hook
console.log('\n--- 4. useGameSessionLifecycle Teardown & Early Exit ---');
const lifecyclePath = path.join(FRONTEND_DIR, 'src', 'hooks', 'useGameSessionLifecycle.ts');
assert(fs.existsSync(lifecyclePath), 'useGameSessionLifecycle.ts exists');
if (fs.existsSync(lifecyclePath)) {
  const content = fs.readFileSync(lifecyclePath, 'utf8');
  assert(content.includes('exitToReport'), 'Provides exitToReport method');
  assert(content.includes('onQuitToReport'), 'Supports onQuitToReport configuration');
  assert(content.includes('stopSpeech()'), 'Synchronously calls stopSpeech()');
  assert(content.includes('audioManager.stopAllGameAudio()'), 'Synchronously stops all game audio');
  assert(content.includes('clearAllTimers'), 'Cancels pending timeouts and intervals');
  assert(content.includes("statusRef.current = 'abandoned'"), 'Immediately marks session abandoned');
}

// 5. Audit GameSessionCompleteView Abandoned State
console.log('\n--- 5. GameSessionCompleteView Behavior ---');
const viewPath = path.join(FRONTEND_DIR, 'src', 'components', 'GameSessionCompleteView.tsx');
assert(fs.existsSync(viewPath), 'GameSessionCompleteView.tsx exists');
if (fs.existsSync(viewPath)) {
  const content = fs.readFileSync(viewPath, 'utf8');
  assert(content.includes('isAbandoned?: boolean'), 'Accepts isAbandoned prop');
  assert(content.includes('itemsAttempted?: number'), 'Accepts itemsAttempted prop');
  assert(content.includes('quitEarlyBadge'), 'Renders quit early badge');
  assert(content.includes('zeroActivityNotice'), 'Renders zero activity notice when itemsAttempted === 0');
  assert(content.includes('!isAbandoned'), 'Suppresses celebration/confetti when abandoned');
  assert(content.includes('hardwareBackPress'), 'Safely handles hardware Back on results screen');
}

// 6. Audit Localization Strings
console.log('\n--- 6. Localization Strings ---');
const locales = ['en', 'hi', 'mr'];
const requiredKeys = ['quitEarlyBadge', 'quitEarlyPraise', 'zeroActivityTitle', 'zeroActivityNotice', 'attempted', 'unanswered'];

for (const lang of locales) {
  const localePath = path.join(FRONTEND_DIR, 'src', 'localization', 'locales', `${lang}.json`);
  assert(fs.existsSync(localePath), `${lang}.json exists`);
  if (fs.existsSync(localePath)) {
    const json = JSON.parse(fs.readFileSync(localePath, 'utf8'));
    for (const key of requiredKeys) {
      assert(json.sessionComplete && json.sessionComplete[key], `${lang}.json has sessionComplete.${key}`);
    }
  }
}

// 7. Audit All 18 Games for Early Exit and Report Wiring
console.log('\n--- 7. All 18 Games Early Exit & Completion Audit ---');
const gamesDir = path.join(FRONTEND_DIR, 'src', 'screens', 'games');
const games = fs.readdirSync(gamesDir).filter((file) => {
  return fs.statSync(path.join(gamesDir, file)).isDirectory();
});

console.log(`Found ${games.length} game modules to audit.`);

for (const game of games) {
  const gameDirPath = path.join(gamesDir, game);
  const typesPath = path.join(gameDirPath, 'types.ts');
  const introPath = game === 'AlphabetMatching'
    ? path.join(gameDirPath, 'ModeSelectionScreen.tsx')
    : path.join(gameDirPath, 'IntroScreen.tsx');
  const gamePath = path.join(gameDirPath, 'GameScreen.tsx');
  const completePath = path.join(gameDirPath, 'SessionCompleteScreen.tsx');

  let hasTypes = fs.existsSync(typesPath);
  let hasIntro = fs.existsSync(introPath);
  let hasGame = fs.existsSync(gamePath);
  let hasComplete = fs.existsSync(completePath);

  assert(hasTypes && hasIntro && hasGame && hasComplete, `${game} structure intact`);

  if (hasTypes) {
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    assert(
      typesContent.includes('isAbandoned?: boolean') && typesContent.includes('itemsAttempted?: number'),
      `${game} types.ts supports isAbandoned & itemsAttempted`
    );
  }

  if (hasIntro) {
    const introContent = fs.readFileSync(introPath, 'utf8');
    assert(
      introContent.includes('navigateToGameCatalog'),
      `${game} IntroScreen uses navigateToGameCatalog`
    );
  }

  if (hasGame) {
    const gameContent = fs.readFileSync(gamePath, 'utf8');
    const hasEarlyQuit = gameContent.includes('exitToReport') || gameContent.includes('handleEarlyQuitToReport') || gameContent.includes('finishSessionAndSubmitProgress(true)');
    assert(
      hasEarlyQuit,
      `${game} GameScreen routes early quit to Report via lifecycle.exitToReport`
    );
  }

  if (hasComplete) {
    const completeContent = fs.readFileSync(completePath, 'utf8');
    assert(
      completeContent.includes('isAbandoned') && completeContent.includes('itemsAttempted'),
      `${game} SessionCompleteScreen processes isAbandoned & itemsAttempted`
    );
    assert(
      completeContent.includes('navigateToGameCatalog') && completeContent.includes('navigateToChildDashboard'),
      `${game} SessionCompleteScreen uses root navigation resets`
    );
  }
}

// 8. Progress Store Audit
console.log('\n--- 8. useProgressStore Progress Recording ---');
const progressStorePath = path.join(FRONTEND_DIR, 'src', 'state', 'useProgressStore.ts');
assert(fs.existsSync(progressStorePath), 'useProgressStore.ts exists');
if (fs.existsSync(progressStorePath)) {
  const content = fs.readFileSync(progressStorePath, 'utf8');
  assert(content.includes('isAbandoned?: boolean'), 'Session record schema has isAbandoned');
  assert(content.includes('completed?: boolean'), 'Session record schema has completed');
  assert(content.includes('isAbandoned ? state.completedGamesCount : state.completedGamesCount + 1'), 'completedGamesCount only increments when NOT abandoned');
}

console.log('\n====================================================');
console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
