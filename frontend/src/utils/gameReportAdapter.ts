/**
 * Purpose: Universal Game Report Adapter for Gyan Educational Games.
 *          Transforms raw attempt logs, round definitions, and session parameters
 *          into structured question-by-question report items distinguishing:
 *          - Correct on first attempt (gold star / positive indicator)
 *          - Incorrect initially, then corrected after retry (red indicator for mistake + gold/green for correction)
 *          - Still incorrect when round ended (red indicator / practice needed)
 *          - Unanswered questions (marked as unanswered, NOT incorrect)
 * Module: Utilities / Reporting
 * Folder: frontend/src/utils
 */

import { GameQuestionReportItem, QuestionAttemptDetail, QuestionFinalStatus } from '../components/GameAnalysisReportModal';

export interface RawAttemptRecord {
  roundNumber?: number;
  questionId?: string;
  isCorrect?: boolean;
  isSuccess?: boolean;
  attemptCount?: number;
  chosenAnswer?: string | number;
  chosenWord?: string | number;
  selectedOptionId?: string | number;
  userAnswer?: string | number;
  expectedAnswer?: string | number;
  expectedWord?: string | number;
  correctAnswer?: string | number;
}

export interface BuildReportConfig {
  sessionLength: number;
  itemsAttempted?: number;
  isAbandoned?: boolean;
  rounds?: any[];
  attempts?: RawAttemptRecord[];
  sessionResults?: Array<'correct' | 'wrong' | 'pending' | string>;
  getQuestionLabel?: (round: any, index: number) => string;
  getCorrectAnswer?: (round: any, index: number) => string | number;
  fallbackLabelPrefix?: string;
}

export interface DetailedReportSummary {
  totalQuestions: number;
  questionsAttempted: number;
  firstTryCorrectCount: number;
  correctedAfterRetryCount: number;
  stillIncorrectCount: number;
  unansweredCount: number;
  accuracy: number;
  items: GameQuestionReportItem[];
}

/**
 * Normalizes question attempts and generates uniform report items.
 */
export function buildStandardizedReportItems(config: BuildReportConfig): DetailedReportSummary {
  const {
    sessionLength,
    itemsAttempted,
    isAbandoned = false,
    rounds = [],
    attempts = [],
    sessionResults = [],
    getQuestionLabel,
    getCorrectAnswer,
    fallbackLabelPrefix = 'Question',
  } = config;

  const totalLength = Math.max(1, sessionLength || rounds.length || 10);
  const attemptedThreshold =
    itemsAttempted !== undefined
      ? Math.min(totalLength, Math.max(0, itemsAttempted))
      : isAbandoned
      ? Math.min(totalLength, attempts.length)
      : totalLength;

  let firstTryCorrect = 0;
  let retryCorrected = 0;
  let stillIncorrect = 0;
  let unanswered = 0;

  const items: GameQuestionReportItem[] = [];

  for (let i = 0; i < totalLength; i++) {
    const roundNumber = i + 1;
    const roundData = rounds[i];

    // Determine question label and correct answer
    let qLabel = `${fallbackLabelPrefix} ${roundNumber}`;
    if (getQuestionLabel && roundData) {
      try {
        qLabel = getQuestionLabel(roundData, i);
      } catch {}
    } else if (roundData) {
      if (roundData.questionLabel) qLabel = roundData.questionLabel;
      else if (roundData.prompt) qLabel = roundData.prompt;
      else if (roundData.target_letter) qLabel = `Letter: "${roundData.target_letter}"`;
      else if (roundData.targetItem?.correctWord) qLabel = `Word: "${roundData.targetItem.correctWord}"`;
      else if (roundData.targetWord?.word) qLabel = `Word: "${roundData.targetWord.word}"`;
      else if (roundData.correctAnswer) qLabel = `Target: "${roundData.correctAnswer}"`;
      else if (roundData.equation) qLabel = `Math: ${roundData.equation}`;
    }

    let targetAnswer: string | number = 'Correct Answer';
    if (getCorrectAnswer && roundData) {
      try {
        targetAnswer = getCorrectAnswer(roundData, i);
      } catch {}
    } else if (roundData) {
      if (roundData.correctAnswer !== undefined) targetAnswer = roundData.correctAnswer;
      else if (roundData.target_letter !== undefined) targetAnswer = roundData.target_letter;
      else if (roundData.targetItem?.correctWord !== undefined) targetAnswer = roundData.targetItem.correctWord;
      else if (roundData.targetWord?.word !== undefined) targetAnswer = roundData.targetWord.word;
      else if (roundData.answer !== undefined) targetAnswer = roundData.answer;
      else if (roundData.expectedWord !== undefined) targetAnswer = roundData.expectedWord;
    }

    // Check attempts matching this round
    const roundAttempts = attempts.filter(
      (a) => a.roundNumber === roundNumber || (a.roundNumber === undefined && attempts.indexOf(a) === i)
    );

    // Is this question beyond what was attempted in an early quit?
    const isBeyondAttempted = i >= attemptedThreshold && roundAttempts.length === 0;

    if (isBeyondAttempted) {
      unanswered++;
      items.push({
        roundNumber,
        questionLabel: qLabel,
        correctAnswer: targetAnswer,
        isCorrect: false,
        attemptsCount: 0,
        attemptsHistory: [],
        finalStatus: 'unanswered',
        isUnanswered: true,
        xpEarned: 0,
      });
      continue;
    }

    if (roundAttempts.length > 0) {
      const history: QuestionAttemptDetail[] = roundAttempts.map((a, idx) => ({
        attemptNumber: a.attemptCount || idx + 1,
        selectedAnswer: a.chosenWord ?? a.chosenAnswer ?? a.selectedOptionId ?? a.userAnswer ?? 'Answer',
        isCorrect: a.isCorrect !== undefined ? a.isCorrect : (a.isSuccess !== undefined ? a.isSuccess : false),
      }));

      const lastAttempt = roundAttempts[roundAttempts.length - 1];
      const hasCorrect = roundAttempts.some((a) => a.isCorrect || a.isSuccess);
      const isFirstTryCorrect = roundAttempts.length === 1 && (roundAttempts[0].isCorrect || roundAttempts[0].isSuccess);
      const isRetryCorrection = roundAttempts.length > 1 && hasCorrect;

      let finalStatus: QuestionFinalStatus = 'still_incorrect';
      let xp = 0;

      if (isFirstTryCorrect) {
        finalStatus = 'first_try_correct';
        firstTryCorrect++;
        xp = 15;
      } else if (isRetryCorrection) {
        finalStatus = 'retry_corrected';
        retryCorrected++;
        xp = 10;
      } else {
        finalStatus = 'still_incorrect';
        stillIncorrect++;
        xp = 0;
      }

      items.push({
        roundNumber,
        questionLabel: qLabel,
        userAnswer: lastAttempt.chosenWord ?? lastAttempt.chosenAnswer ?? lastAttempt.selectedOptionId ?? lastAttempt.userAnswer,
        correctAnswer: targetAnswer,
        isCorrect: hasCorrect,
        attemptsCount: roundAttempts.length,
        attemptsHistory: history,
        finalStatus,
        isCorrectedAfterRetry: isRetryCorrection,
        xpEarned: xp,
      });
    } else {
      // Fallback: check sessionResults array (e.g. from games with simple result trails)
      const res = sessionResults[i];
      if (res === 'correct') {
        firstTryCorrect++;
        items.push({
          roundNumber,
          questionLabel: qLabel,
          userAnswer: targetAnswer,
          correctAnswer: targetAnswer,
          isCorrect: true,
          attemptsCount: 1,
          attemptsHistory: [{ attemptNumber: 1, selectedAnswer: targetAnswer, isCorrect: true }],
          finalStatus: 'first_try_correct',
          xpEarned: 15,
        });
      } else if (res === 'wrong') {
        stillIncorrect++;
        items.push({
          roundNumber,
          questionLabel: qLabel,
          userAnswer: 'Incorrect choice',
          correctAnswer: targetAnswer,
          isCorrect: false,
          attemptsCount: 1,
          attemptsHistory: [{ attemptNumber: 1, selectedAnswer: 'Incorrect choice', isCorrect: false }],
          finalStatus: 'still_incorrect',
          xpEarned: 0,
        });
      } else {
        // Pending or unanswered
        unanswered++;
        items.push({
          roundNumber,
          questionLabel: qLabel,
          correctAnswer: targetAnswer,
          isCorrect: false,
          attemptsCount: 0,
          attemptsHistory: [],
          finalStatus: 'unanswered',
          isUnanswered: true,
          xpEarned: 0,
        });
      }
    }
  }

  const actuallyAttempted = totalLength - unanswered;
  const totalCorrect = firstTryCorrect + retryCorrected;
  const accuracy = actuallyAttempted > 0 ? Math.round((totalCorrect / actuallyAttempted) * 100) : 0;

  return {
    totalQuestions: totalLength,
    questionsAttempted: actuallyAttempted,
    firstTryCorrectCount: firstTryCorrect,
    correctedAfterRetryCount: retryCorrected,
    stillIncorrectCount: stillIncorrect,
    unansweredCount: unanswered,
    accuracy,
    items,
  };
}
