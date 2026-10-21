/**
 * Purpose: Universal Game Analysis Report Modal for Gyan Educational Games.
 *          Provides children and parents a transparent breakdown of each question
 *          played in a session: first-attempt success, retry corrections, errors,
 *          unanswered questions, and XP earned.
 * Module: Shared Components
 * Folder: frontend/src/components
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { WorldPalettes, WorldRadii, WorldSpacing, WorldTypography } from '../theme/tokens';

export interface QuestionAttemptDetail {
  attemptNumber: number;
  selectedAnswer: string | number;
  isCorrect: boolean;
}

export type QuestionFinalStatus =
  | 'first_try_correct'
  | 'retry_corrected'
  | 'still_incorrect'
  | 'unanswered';

export interface GameQuestionReportItem {
  roundNumber: number;
  questionId?: string;
  questionLabel: string;
  userAnswer?: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  attemptsCount?: number;
  attemptsHistory?: QuestionAttemptDetail[];
  finalStatus?: QuestionFinalStatus;
  isCorrectedAfterRetry?: boolean;
  isUnanswered?: boolean;
  xpEarned?: number;
}

export interface GameAnalysisReportModalProps {
  visible: boolean;
  onClose: () => void;
  gameTitle?: string;
  isAbandoned?: boolean;
  totalQuestions?: number;
  questionsAttempted?: number;
  firstTryCorrectCount?: number;
  correctedAfterRetryCount?: number;
  stillIncorrectCount?: number;
  unansweredCount?: number;
  accuracy?: number;
  xpEarned?: number;
  items: GameQuestionReportItem[];
}

export const GameAnalysisReportModal: React.FC<GameAnalysisReportModalProps> = ({
  visible,
  onClose,
  gameTitle,
  isAbandoned = false,
  totalQuestions,
  questionsAttempted,
  firstTryCorrectCount,
  correctedAfterRetryCount,
  stillIncorrectCount,
  unansweredCount,
  accuracy: passedAccuracy,
  xpEarned: passedXp,
  items = [],
}) => {
  const { t } = useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [filter, setFilter] = useState<'all' | 'first_try' | 'corrected' | 'wrong' | 'unanswered'>('all');

  const total = totalQuestions !== undefined ? totalQuestions : items.length;
  const attempted = questionsAttempted !== undefined
    ? questionsAttempted
    : items.filter((i) => !i.isUnanswered && i.finalStatus !== 'unanswered').length;

  const firstTry = firstTryCorrectCount !== undefined
    ? firstTryCorrectCount
    : items.filter((i) => i.finalStatus === 'first_try_correct' || (i.isCorrect && (!i.attemptsCount || i.attemptsCount === 1))).length;

  const corrected = correctedAfterRetryCount !== undefined
    ? correctedAfterRetryCount
    : items.filter((i) => i.finalStatus === 'retry_corrected' || i.isCorrectedAfterRetry).length;

  const wrong = stillIncorrectCount !== undefined
    ? stillIncorrectCount
    : items.filter((i) => !i.isCorrect && !i.isUnanswered && i.finalStatus !== 'unanswered').length;

  const notAnswered = unansweredCount !== undefined
    ? unansweredCount
    : items.filter((i) => i.isUnanswered || i.finalStatus === 'unanswered').length;

  const totalSuccess = firstTry + corrected;
  const accuracy = passedAccuracy !== undefined
    ? passedAccuracy
    : attempted > 0 ? Math.round((totalSuccess / attempted) * 100) : 0;

  const totalXp = passedXp !== undefined
    ? passedXp
    : items.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);

  const filteredItems = items.filter((item) => {
    if (filter === 'first_try') {
      return item.finalStatus === 'first_try_correct' || (item.isCorrect && (!item.attemptsCount || item.attemptsCount === 1));
    }
    if (filter === 'corrected') {
      return item.finalStatus === 'retry_corrected' || item.isCorrectedAfterRetry;
    }
    if (filter === 'wrong') {
      return !item.isCorrect && !item.isUnanswered && item.finalStatus !== 'unanswered';
    }
    if (filter === 'unanswered') {
      return item.isUnanswered || item.finalStatus === 'unanswered';
    }
    return true;
  });

  const cardMaxWidth = Math.min(screenWidth - 24, 480);
  const maxModalHeight = Math.min(screenHeight * 0.88, 640);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { maxWidth: cardMaxWidth, maxHeight: maxModalHeight },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  📋 {gameTitle ? `${gameTitle} ${t('detailedReport.titleSuffix', 'Report')}` : t('detailedReport.sessionReport', 'Session Report')}
                </Text>
                {isAbandoned ? (
                  <View style={styles.statusBadgeQuit}>
                    <Text style={styles.statusBadgeQuitText}>
                      {t('sessionComplete.quitEarlyBadge', '⏱️ Quit Early')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.statusBadgeComplete}>
                    <Text style={styles.statusBadgeCompleteText}>
                      {t('detailedReport.completed', '✅ Completed')}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle}>
                {t('detailedReport.subtitle', 'See how you did on each question and retry!')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close report')}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Core Metrics Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>
                  {attempted}/{total}
                </Text>
                <Text style={styles.summaryLbl}>{t('detailedReport.attempted', 'Attempted')}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#059669' }]}>
                  {accuracy}%
                </Text>
                <Text style={styles.summaryLbl}>{t('common.accuracy', 'Accuracy')}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryVal, { color: '#D97706' }]}>
                  +{totalXp}
                </Text>
                <Text style={styles.summaryLbl}>{t('common.xp', 'XP')}</Text>
              </View>
            </View>
          </View>

          {/* Quick Filter Tabs */}
          <View style={styles.metricsBar}>
            <TouchableOpacity
              style={[styles.metricTab, filter === 'all' && styles.metricTabActiveAll]}
              onPress={() => setFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={styles.metricEmoji}>🎯</Text>
              <Text style={styles.metricValue}>{total}</Text>
              <Text style={styles.metricLabel}>{t('detailedReport.filterAll', 'All')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricTab, filter === 'first_try' && styles.metricTabActiveCorrect]}
              onPress={() => setFilter('first_try')}
              activeOpacity={0.7}
            >
              <Text style={styles.metricEmoji}>⭐</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>{firstTry}</Text>
              <Text style={styles.metricLabel}>{t('detailedReport.filter1stTry', '1st Try')}</Text>
            </TouchableOpacity>

            {corrected > 0 && (
              <TouchableOpacity
                style={[styles.metricTab, filter === 'corrected' && styles.metricTabActiveCorrected]}
                onPress={() => setFilter('corrected')}
                activeOpacity={0.7}
              >
                <Text style={styles.metricEmoji}>🔄</Text>
                <Text style={[styles.metricValue, { color: '#0D9488' }]}>{corrected}</Text>
                <Text style={styles.metricLabel}>{t('detailedReport.filterRetry', 'Retry')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.metricTab, filter === 'wrong' && styles.metricTabActiveWrong]}
              onPress={() => setFilter('wrong')}
              activeOpacity={0.7}
            >
              <Text style={styles.metricEmoji}>❌</Text>
              <Text style={[styles.metricValue, { color: '#DC2626' }]}>{wrong}</Text>
              <Text style={styles.metricLabel}>{t('detailedReport.filterPractice', 'Practice')}</Text>
            </TouchableOpacity>

            {notAnswered > 0 && (
              <TouchableOpacity
                style={[styles.metricTab, filter === 'unanswered' && styles.metricTabActiveUnanswered]}
                onPress={() => setFilter('unanswered')}
                activeOpacity={0.7}
              >
                <Text style={styles.metricEmoji}>⏳</Text>
                <Text style={[styles.metricValue, { color: '#6B7280' }]}>{notAnswered}</Text>
                <Text style={styles.metricLabel}>{t('detailedReport.filterUnanswered', 'Unanswered')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Question List */}
          <ScrollView
            style={styles.listScrollView}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyText}>
                  {filter === 'wrong'
                    ? t('detailedReport.noMistakes', 'Amazing job! No mistakes in this category!')
                    : t('detailedReport.noQuestions', 'No questions to show in this view.')}
                </Text>
              </View>
            ) : (
              filteredItems.map((item, index) => {
                const isItemUnanswered = item.isUnanswered || item.finalStatus === 'unanswered';
                const isItemCorrect = item.isCorrect && !isItemUnanswered;
                const isItemCorrected = item.finalStatus === 'retry_corrected' || item.isCorrectedAfterRetry;
                const isFirstTry = isItemCorrect && !isItemCorrected;

                return (
                  <View
                    key={`report_item_${item.roundNumber}_${index}`}
                    style={[
                      styles.itemCard,
                      isItemUnanswered
                        ? styles.itemCardUnanswered
                        : isItemCorrected
                        ? styles.itemCardCorrected
                        : isItemCorrect
                        ? styles.itemCardCorrect
                        : styles.itemCardWrong,
                    ]}
                  >
                    {/* Top row of question card */}
                    <View style={styles.itemHeader}>
                      <View style={styles.roundBadge}>
                        <Text style={styles.roundBadgeText}>
                          {t('detailedReport.roundLabel', 'Round')} {item.roundNumber}
                        </Text>
                      </View>

                      {/* Status indicator */}
                      {isItemUnanswered ? (
                        <View style={styles.statusBadgeUnanswered}>
                          <Text style={styles.statusBadgeTextUnanswered}>
                            ⏳ {t('detailedReport.statusUnanswered', 'Unanswered')}
                          </Text>
                        </View>
                      ) : isItemCorrected ? (
                        <View style={styles.statusBadgeCorrected}>
                          <Text style={styles.statusBadgeTextCorrected}>
                            🔄 {t('detailedReport.statusCorrectAfterRetry', 'Correct after Retry')}
                          </Text>
                        </View>
                      ) : isItemCorrect ? (
                        <View style={styles.statusBadgeCorrect}>
                          <Text style={styles.statusBadgeTextCorrect}>
                            ⭐ {t('detailedReport.statusFirstTry', 'Correct on 1st Try')}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.statusBadgeWrong}>
                          <Text style={styles.statusBadgeTextWrong}>
                            ❌ {t('detailedReport.statusPractice', 'Needs Practice')}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Question Content */}
                    <View style={styles.questionContent}>
                      <Text style={styles.questionLabel}>{item.questionLabel}</Text>
                    </View>

                    {/* Multi-Attempt History Breakdown (Issue 2) */}
                    {item.attemptsHistory && item.attemptsHistory.length > 1 ? (
                      <View style={styles.attemptHistoryContainer}>
                        <Text style={styles.attemptHistoryTitle}>
                          {t('detailedReport.attemptHistory', 'Attempt History:')}
                        </Text>
                        {item.attemptsHistory.map((att, attIdx) => (
                          <View key={`att_${attIdx}`} style={styles.attemptHistoryRow}>
                            <Text style={styles.attemptNum}>
                              {t('detailedReport.attempt', 'Attempt')} {att.attemptNumber}:
                            </Text>
                            <Text
                              style={[
                                styles.attemptAnswer,
                                att.isCorrect ? styles.answerCorrectText : styles.answerWrongText,
                              ]}
                            >
                              {att.isCorrect ? '✅ ' : '❌ '}
                              {String(att.selectedAnswer)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {/* Answers Breakdown */}
                    <View style={styles.answersRow}>
                      <View style={styles.answerCol}>
                        <Text style={styles.answerSub}>
                          {t('detailedReport.yourAnswer', 'Your Answer:')}
                        </Text>
                        <Text
                          style={[
                            styles.answerVal,
                            isItemUnanswered
                              ? styles.answerValUnanswered
                              : isItemCorrect
                              ? styles.answerValCorrect
                              : styles.answerValWrong,
                          ]}
                        >
                          {isItemUnanswered
                            ? t('detailedReport.notAttempted', '— Not Attempted —')
                            : item.userAnswer !== undefined && item.userAnswer !== null
                            ? String(item.userAnswer)
                            : '—'}
                        </Text>
                      </View>

                      {!isItemCorrect && !isItemUnanswered && (
                        <View style={styles.answerCol}>
                          <Text style={styles.answerSub}>
                            {t('detailedReport.correctAnswer', 'Correct Answer:')}
                          </Text>
                          <Text style={styles.answerValTarget}>
                            {String(item.correctAnswer)}
                          </Text>
                        </View>
                      )}

                      {item.xpEarned !== undefined && (
                        <View style={styles.answerColEnd}>
                          <Text style={styles.answerSub}>{t('common.reward', 'Reward:')}</Text>
                          <Text style={styles.xpVal}>
                            {item.xpEarned > 0 ? `+${item.xpEarned} XP ⭐` : '0 XP'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer Close CTA */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('common.close', 'Close report')}
          >
            <Text style={styles.doneButtonText}>
              ✓ {t('common.done', 'Done')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 17,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeComplete: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeCompleteText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#15803D',
  },
  statusBadgeQuit: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeQuitText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#B45309',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 14,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryVal: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  summaryLbl: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  metricsBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  metricTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  metricTabActiveAll: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  metricTabActiveCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  metricTabActiveCorrected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  metricTabActiveWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  metricTabActiveUnanswered: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  metricEmoji: {
    fontSize: 11,
  },
  metricValue: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    color: '#1E293B',
    marginTop: 1,
  },
  metricLabel: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 9,
    color: '#64748B',
  },
  listScrollView: {
    flexGrow: 1,
  },
  listContainer: {
    gap: 8,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  itemCard: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
  },
  itemCardCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  itemCardCorrected: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  itemCardWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  itemCardUnanswered: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roundBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roundBadgeText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#475569',
  },
  statusBadgeCorrect: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextCorrect: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#15803D',
  },
  statusBadgeCorrected: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextCorrected: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#0F766E',
  },
  statusBadgeWrong: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextWrong: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#B91C1C',
  },
  statusBadgeUnanswered: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeTextUnanswered: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#64748B',
  },
  questionContent: {
    marginVertical: 4,
  },
  questionLabel: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 13,
    color: '#1E293B',
  },
  attemptHistoryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 8,
    padding: 6,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  attemptHistoryTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#475569',
    marginBottom: 2,
  },
  attemptHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  attemptNum: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 10,
    color: '#64748B',
    minWidth: 54,
  },
  attemptAnswer: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
  },
  answerCorrectText: {
    color: '#15803D',
  },
  answerWrongText: {
    color: '#B91C1C',
  },
  answersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  answerCol: {
    flex: 1,
    marginRight: 6,
  },
  answerColEnd: {
    alignItems: 'flex-end',
  },
  answerSub: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 9,
    color: '#64748B',
  },
  answerVal: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    marginTop: 1,
  },
  answerValCorrect: {
    color: '#15803D',
  },
  answerValWrong: {
    color: '#B91C1C',
  },
  answerValUnanswered: {
    color: '#94A3B8',
    fontFamily: WorldTypography.fonts.medium,
  },
  answerValTarget: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    color: '#2563EB',
    marginTop: 1,
  },
  xpVal: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 10,
    color: '#D97706',
    marginTop: 1,
  },
  doneButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
