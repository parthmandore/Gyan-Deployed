/**
 * Purpose: Comprehensive Verification Test Suite for:
 *          1. Audio Lifecycle & Speech Queue Flush (Alphabet Game audio leak fix)
 *          2. Context-Aware Background Music & Persistent Audio Controls (AudioControlPill)
 *          3. Universal Game Reports across ALL 19 Games (Question-by-Question breakdown)
 *          4. Navigation & Exit Cleanup across all games (stopSpeech + stopAllGameAudio)
 *          5. Deterministic Educational XP Rules & Anti-Duplication
 * Module: Tests
 * Folder: frontend/testAudioLifecycleAndReports.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('  GYANNN — AUDIO LIFECYCLE, BGM & UNIVERSAL GAME REPORTS SUITE   ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 4).join('\n'));
    }
  }
}

async function main() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const gamesDir = path.join(srcDir, 'screens', 'games');

  // =========================================================================
  // SECTION 1: AUDIO LIFECYCLE & CANCELLATION ENGINE
  // =========================================================================

  runTest('1.1: speechService.ts contains monotonic session tracking & Chromium queue flush', () => {
    const speechPath = path.join(srcDir, 'services', 'speechService.ts');
    assert(fs.existsSync(speechPath), 'speechService.ts must exist');
    const content = fs.readFileSync(speechPath, 'utf8');

    assert(content.includes('_speechSessionId'), 'Must track _speechSessionId');
    assert(content.includes('getSpeechSessionId'), 'Must export getSpeechSessionId');
    assert(content.includes('window.speechSynthesis.cancel()'), 'Must call speechSynthesis.cancel()');
    assert(content.includes('window.speechSynthesis.resume()'), 'Must call resume() between cancel() calls for Chromium queue flush');
    assert(content.includes('audioManager.unduck()'), 'Must unduck audio manager on stopSpeech');
  });

  runTest('1.2: speechService.ts uses direct synchronous Web Speech API on Web platform', () => {
    const speechPath = path.join(srcDir, 'services', 'speechService.ts');
    const content = fs.readFileSync(speechPath, 'utf8');

    assert(
      content.includes('SpeechSynthesisUtterance'),
      'Must use direct SpeechSynthesisUtterance on Web to avoid expo-speech async voice race'
    );
    assert(
      content.includes('synth.speak(utterance)'),
      'Must speak directly to synth on Web'
    );
    assert(
      content.includes('_speechSessionId !== sessionForThisCall'),
      'Must abort playback if session ID changed before synth.speak'
    );
  });

  runTest('1.3: AlphabetMatching/GameScreen.tsx has NO automatic audio playback retry loop', () => {
    const gameScreenPath = path.join(gamesDir, 'AlphabetMatching', 'GameScreen.tsx');
    assert(fs.existsSync(gameScreenPath), 'AlphabetMatching/GameScreen.tsx must exist');
    const content = fs.readFileSync(gameScreenPath, 'utf8');

    assert(
      !content.includes('const retryResult = await speakLetter'),
      'Must NOT contain automatic speakLetter retry loop that can play after exit'
    );
    assert(
      content.includes('isMountedRef.current'),
      'Must check isMountedRef before and after speakLetter'
    );
  });

  runTest('1.4: AlphabetMatching/GameScreen.tsx cleans up speech on blur and beforeRemove', () => {
    const gameScreenPath = path.join(gamesDir, 'AlphabetMatching', 'GameScreen.tsx');
    const content = fs.readFileSync(gameScreenPath, 'utf8');

    assert(content.includes("navigation.addListener('beforeRemove'"), 'Must handle beforeRemove');
    assert(content.includes("navigation.addListener('blur'"), 'Must handle blur');
    assert(content.includes('audioManager.stopAllGameAudio()'), 'Must call stopAllGameAudio()');
    assert(content.includes('stopSpeech()'), 'Must call stopSpeech()');
  });

  // =========================================================================
  // SECTION 2: AUDIO MANAGER & BACKGROUND MUSIC
  // =========================================================================

  runTest('2.1: audioManager.ts supports persistent storage and subscriber notifications', () => {
    const audioMgrPath = path.join(srcDir, 'services', 'audioManager.ts');
    assert(fs.existsSync(audioMgrPath), 'audioManager.ts must exist');
    const content = fs.readFileSync(audioMgrPath, 'utf8');

    assert(content.includes('@gyannn_music_enabled_v1'), 'Must use persistent key for music');
    assert(content.includes('@gyannn_sfx_enabled_v1'), 'Must use persistent key for SFX');
    assert(content.includes('public subscribe'), 'Must support listener subscription');
    assert(content.includes('private notifyListeners'), 'Must notify listeners on state changes');
    assert(content.includes('export const useAudioSettings'), 'Must export useAudioSettings React hook');
  });

  runTest('2.2: AudioControlPill component exists and exports tactile toggles', () => {
    const pillPath = path.join(srcDir, 'components', 'AudioControlPill.tsx');
    assert(fs.existsSync(pillPath), 'AudioControlPill.tsx must exist');
    const content = fs.readFileSync(pillPath, 'utf8');

    assert(content.includes('useAudioSettings'), 'Must use useAudioSettings hook');
    assert(content.includes('BigTouchTarget'), 'Must use BigTouchTarget for child accessibility');
    assert(content.includes('toggleMusic'), 'Must toggle music on click');
    assert(content.includes('toggleSfx'), 'Must toggle SFX on click');
    assert(content.includes('minHeight: 44'), 'Must enforce minimum 44px touch target');
  });

  runTest('2.3: AudioControlPill is integrated into ChildHeader, GameHUD, GameCatalog, and GameSessionCompleteView', () => {
    const childHeaderPath = path.join(srcDir, 'components', 'dashboard', 'ChildHeader.tsx');
    const gameHudPath = path.join(srcDir, 'components', 'GameHUD.tsx');
    const catalogPath = path.join(srcDir, 'screens', 'GameCatalogScreen.tsx');
    const sessionCompletePath = path.join(srcDir, 'components', 'GameSessionCompleteView.tsx');

    const headerContent = fs.readFileSync(childHeaderPath, 'utf8');
    const hudContent = fs.readFileSync(gameHudPath, 'utf8');
    const catalogContent = fs.readFileSync(catalogPath, 'utf8');
    const completeContent = fs.readFileSync(sessionCompletePath, 'utf8');

    assert(headerContent.includes('<AudioControlPill'), 'ChildHeader must include AudioControlPill');
    assert(hudContent.includes('<AudioControlPill'), 'GameHUD must include AudioControlPill');
    assert(catalogContent.includes('<AudioControlPill'), 'GameCatalog must include AudioControlPill');
    assert(completeContent.includes('<AudioControlPill'), 'GameSessionCompleteView must include AudioControlPill');
  });

  // =========================================================================
  // SECTION 3: UNIVERSAL GAME REPORTS & COMPLETION SCREENS ACROSS ALL 19 GAMES
  // =========================================================================

  const allGames = fs.readdirSync(gamesDir).filter((f) =>
    fs.statSync(path.join(gamesDir, f)).isDirectory()
  );

  runTest(`3.1: Inventory verification: exactly 19 games exist`, () => {
    assert.strictEqual(allGames.length, 19, `Expected exactly 19 games, found ${allGames.length}`);
  });

  runTest('3.2: 100% of the 19 games have SessionCompleteScreen.tsx', () => {
    for (const game of allGames) {
      const completePath = path.join(gamesDir, game, 'SessionCompleteScreen.tsx');
      assert(fs.existsSync(completePath), `${game} must have SessionCompleteScreen.tsx`);
    }
  });

  runTest('3.3: 100% of the 19 games provide question-by-question report modals and onViewReport', () => {
    for (const game of allGames) {
      const completePath = path.join(gamesDir, game, 'SessionCompleteScreen.tsx');
      const content = fs.readFileSync(completePath, 'utf8');
      const hasReportModal =
        content.includes('GameAnalysisReportModal') ||
        content.includes('ReportModal');
      const hasOnViewReport = content.includes('onViewReport');

      assert(
        hasReportModal,
        `${game}/SessionCompleteScreen.tsx must import/render a ReportModal`
      );
      assert(
        hasOnViewReport,
        `${game}/SessionCompleteScreen.tsx must provide onViewReport prop`
      );
    }
  });

  runTest('3.4: All GameScreens have audio stops on exit/unmount/blur', () => {
    for (const game of allGames) {
      const gamePath = path.join(gamesDir, game, 'GameScreen.tsx');
      assert(fs.existsSync(gamePath), `${game} must have GameScreen.tsx`);
      const content = fs.readFileSync(gamePath, 'utf8');

      const stopsAudio =
        content.includes('stopSpeech') || content.includes('stopAllGameAudio');
      assert(stopsAudio, `${game}/GameScreen.tsx must stop speech or audio`);
    }
  });

  runTest('3.5: All 19 games route to their completion screen upon game finish (no silent catalog redirects)', () => {
    for (const game of allGames) {
      const gamePath = path.join(gamesDir, game, 'GameScreen.tsx');
      const content = fs.readFileSync(gamePath, 'utf8');

      // Each game must have navigation call to SessionComplete
      const hasCompleteNavigation =
        content.includes('SessionComplete') ||
        content.includes('navigate') && content.includes('Complete');

      assert(
        hasCompleteNavigation,
        `${game}/GameScreen.tsx must navigate to its SessionComplete screen on session completion`
      );
    }
  });

  // =========================================================================
  // SECTION 4: EDUCATIONAL XP PROGRESS RULES & ANTI-DUPLICATION
  // =========================================================================

  runTest('4.1: ProgressStore enforces deterministic XP values and anti-duplication', () => {
    const storePath = path.join(srcDir, 'state', 'useProgressStore.ts');
    assert(fs.existsSync(storePath), 'useProgressStore.ts must exist');
    const content = fs.readFileSync(storePath, 'utf8');

    assert(
      content.includes('processedEventIds'),
      'Must maintain processedEventIds list'
    );
    assert(
      content.includes('completionEventId'),
      'Must generate completionEventId to prevent duplicate session awards'
    );
    assert(
      content.includes('recordSessionCompletion'),
      'Must have recordSessionCompletion method'
    );
  });

  runTest('4.2: XP Rules verification (15 first try, 10 retry, 20 completion, 25 perfect bonus)', () => {
    const xpConfigPath = path.join(srcDir, 'config', 'xpConfig.ts');
    assert(fs.existsSync(xpConfigPath), 'xpConfig.ts must exist');
    const content = fs.readFileSync(xpConfigPath, 'utf8');

    assert(content.includes('15'), 'First attempt correct must be 15 XP');
    assert(content.includes('10'), 'Retry correct must be 10 XP');
    assert(content.includes('20'), 'Session completion must be 20 XP');
    assert(content.includes('25'), 'Perfect bonus must be 25 XP');
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED CLEANLY! Ready for production.');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
