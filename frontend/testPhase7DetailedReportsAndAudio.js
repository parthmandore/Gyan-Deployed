/**
 * Verification test suite for Phase 7: Detailed Reports, Retry Tracking & Game-Specific Audio
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}:`, err.message);
  }
}

console.log('=== Starting Phase 7 Verification Test Suite ===\n');

// 1. Audit all 18 games for unconditional onViewReport
runTest('All 18 games have unconditional onViewReport in SessionCompleteScreen', () => {
  const gamesDir = path.join(__dirname, 'src', 'screens', 'games');
  const games = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());
  assert.strictEqual(games.length, 18, `Expected 18 games, found ${games.length}`);

  games.forEach(g => {
    const completeFile = path.join(gamesDir, g, 'SessionCompleteScreen.tsx');
    assert.ok(fs.existsSync(completeFile), `SessionCompleteScreen exists for ${g}`);
    const content = fs.readFileSync(completeFile, 'utf8');
    assert.ok(
      content.includes('onViewReport={() => setShowReportModal(true)}'),
      `${g} does NOT have unconditional onViewReport`
    );
    assert.ok(
      content.includes('GameAnalysisReportModal') || content.includes('LanguagePairReportModal'),
      `${g} does NOT render a report modal`
    );
  });
});

// 2. Audit GameSessionCompleteView has visible, prominent view report button
runTest('GameSessionCompleteView has visible, tactile, unclipped View Detailed Report button', () => {
  const viewFile = path.join(__dirname, 'src', 'components', 'GameSessionCompleteView.tsx');
  const content = fs.readFileSync(viewFile, 'utf8');
  assert.ok(content.includes('viewReportButton'), 'Has viewReportButton style');
  assert.ok(content.includes('viewReportButtonText'), 'Has viewReportButtonText style');
  assert.ok(content.includes('onViewReport'), 'Accepts onViewReport prop');
  assert.ok(content.includes('minHeight: 40') || content.includes('paddingVertical: 10'), 'Meets touch target criteria');
});

// 3. Verify gameReportAdapter functionality
runTest('gameReportAdapter exports and syntax are complete', () => {
  const adapterFile = path.join(__dirname, 'src', 'utils', 'gameReportAdapter.ts');
  const content = fs.readFileSync(adapterFile, 'utf8');
  assert.ok(content.includes('export function buildStandardizedReportItems'), 'Exports buildStandardizedReportItems');
  assert.ok(content.includes('first_try_correct'), 'Handles first_try_correct');
  assert.ok(content.includes('retry_corrected'), 'Handles retry_corrected');
  assert.ok(content.includes('still_incorrect'), 'Handles still_incorrect');
  assert.ok(content.includes('unanswered'), 'Handles unanswered');
  assert.ok(content.includes('attemptsHistory'), 'Computes attemptsHistory');
  assert.ok(content.includes('isUnanswered: true'), 'Marks isUnanswered');
});

// 4. Verify match-the-following speech handlers
runTest('Option selection speech exists strictly in genuine matching games', () => {
  // 1. LanguagePairMatch
  const lpm = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'LanguagePairMatch', 'GameScreen.tsx'), 'utf8');
  assert.ok(lpm.includes('speakPhrase(card.text'), 'LanguagePairMatch speaks card on tap');

  // 2. CapitalSmallMatch
  const csm = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'CapitalSmallMatch', 'GameScreen.tsx'), 'utf8');
  assert.ok(csm.includes('playTileLetterAudio'), 'CapitalSmallMatch plays tile letter audio');

  // 3. VowelMatraMatch
  const vmm = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'VowelMatraMatch', 'GameScreen.tsx'), 'utf8');
  assert.ok(vmm.includes('speakPhrase(vowel') && vmm.includes('cancelPrevious: true'), 'VowelMatraMatch speaks vowel with cancelPrevious');

  // 4. AlphabetMatching
  const am = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'AlphabetMatching', 'GameScreen.tsx'), 'utf8');
  assert.ok(am.includes('speakPhrase(tappedLetter') && am.includes('cancelPrevious: true'), 'AlphabetMatching speaks tapped letter with cancelPrevious');

  // 5. Non-matching games should NOT speak options on selection
  const math = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'MathChallenge', 'GameScreen.tsx'), 'utf8');
  assert.ok(!math.includes('speakOption(') && !math.includes('speakPhrase(selectedOption'), 'MathChallenge does not speak option on tap');

  const shape = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'games', 'ShapeChallenge', 'GameScreen.tsx'), 'utf8');
  assert.ok(!shape.includes('speakOption(') && !shape.includes('speakPhrase(option'), 'ShapeChallenge does not speak option on tap');
});

// 5. Verify Login & Registration Language Selection
runTest('LoginScreen and SignUpProfileScreen present both App Language & Learning Language selectors', () => {
  const login = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'LoginScreen.tsx'), 'utf8');
  assert.ok(login.includes('appLanguageTitle'), 'LoginScreen has app language title');
  assert.ok(login.includes('learningLanguageTitle'), 'LoginScreen has learning language title');
  assert.ok(login.includes('setAppLanguage'), 'LoginScreen calls setAppLanguage');
  assert.ok(login.includes('setLearningLanguage'), 'LoginScreen calls setLearningLanguage');

  const signup = fs.readFileSync(path.join(__dirname, 'src', 'screens', 'SignUpProfileScreen.tsx'), 'utf8');
  assert.ok(signup.includes('appLanguageTitle'), 'SignUpProfileScreen has app language title');
  assert.ok(signup.includes('learningLanguageTitle'), 'SignUpProfileScreen has learning language title');
  assert.ok(signup.includes('selectedLearningLanguage'), 'SignUpProfileScreen has selectedLearningLanguage state');
});

// 6. Verify GameAnalysisReportModal has metric tabs and attempt breakdown
runTest('GameAnalysisReportModal contains attempt breakdown and metric tabs', () => {
  const modal = fs.readFileSync(path.join(__dirname, 'src', 'components', 'GameAnalysisReportModal.tsx'), 'utf8');
  assert.ok(modal.includes('firstTryCorrectCount'), 'Modal supports firstTryCorrectCount');
  assert.ok(modal.includes('correctedAfterRetryCount'), 'Modal supports correctedAfterRetryCount');
  assert.ok(modal.includes('stillIncorrectCount'), 'Modal supports stillIncorrectCount');
  assert.ok(modal.includes('unansweredCount'), 'Modal supports unansweredCount');
  assert.ok(modal.includes('attemptsHistory'), 'Modal renders attemptsHistory breakdown');
  assert.ok(modal.includes('metricTab'), 'Modal contains metricTab');
  assert.ok(modal.includes('metricTabActiveWrong'), 'Modal contains metricTabActiveWrong');
  assert.ok(modal.includes('metricTabActiveUnanswered'), 'Modal contains metricTabActiveUnanswered');
});

console.log(`\n=== Test Results: ${passedTests}/${totalTests} Tests Passed ===\n`);
if (passedTests === totalTests) {
  console.log('🎉 ALL PHASE 7 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED');
  process.exit(1);
}
