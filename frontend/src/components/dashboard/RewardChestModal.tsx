/**
 * Purpose: Interactive Animated Mystery Reward Chest Modal.
 *          Celebrates daily quest completion or milestone unlocks with a
 *          wobbling treasure chest, celebration sound fanfare, and collectible reward reveals.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { BigTouchTarget } from '../BigTouchTarget';
import { audioManager } from '../../services/audioManager';
import { useProgressStore } from '../../state/useProgressStore';

interface MysteryReward {
  id: string;
  icon: string;
  title: string;
  category: string;
  bonusXp: number;
  description: string;
}

const REWARDS_POOL: MysteryReward[] = [
  {
    id: 'crown_perk',
    icon: '👑',
    title: 'Royal Crown Badge',
    category: 'Avatar Perk',
    bonusXp: 50,
    description: 'You unlocked the golden crown! Wear it with pride!',
  },
  {
    id: 'star_gem',
    icon: '💎',
    title: 'Diamond Brain Gem',
    category: 'Trophy Perk',
    bonusXp: 60,
    description: 'Your brain power is shining bright like a diamond!',
  },
  {
    id: 'rocket_sticker',
    icon: '🚀',
    title: 'Cosmic Explorer Sticker',
    category: 'Collector Sticker',
    bonusXp: 40,
    description: 'Zoom to the stars! Added to your sticker collection!',
  },
  {
    id: 'rainbow_theme',
    icon: '🌈',
    title: 'Rainbow Adventure Theme',
    category: 'World Perk',
    bonusXp: 45,
    description: 'Brings vibrant rainbow sunshine to your learning world!',
  },
  {
    id: 'champion_shield',
    icon: '🛡️',
    title: 'Super Learner Shield',
    category: 'Mastery Badge',
    bonusXp: 55,
    description: 'Protects your streak and supercharges your curiosity!',
  },
];

interface RewardChestModalProps {
  visible: boolean;
  onClose: () => void;
  onRewardClaimed?: (reward: MysteryReward) => void;
}

export const RewardChestModal: React.FC<RewardChestModalProps> = ({
  visible,
  onClose,
  onRewardClaimed,
}) => {
  const [stage, setStage] = useState<'closed' | 'opening' | 'revealed'>('closed');
  const [selectedReward, setSelectedReward] = useState<MysteryReward>(REWARDS_POOL[0]);

  // Animation values
  const chestScale = useSharedValue(1);
  const chestRotate = useSharedValue(0);
  const rewardScale = useSharedValue(0.3);
  const rewardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setStage('closed');
      // Pick a reward from the pool
      const randomIndex = Math.floor(Math.random() * REWARDS_POOL.length);
      setSelectedReward(REWARDS_POOL[randomIndex]);

      // Idle chest bounce
      chestScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1,
        true
      );
      rewardScale.value = 0.3;
      rewardOpacity.value = 0;
    }
  }, [visible, chestScale, rewardScale, rewardOpacity]);

  const handleOpenChest = () => {
    audioManager.playTapSound();
    setStage('opening');

    // Wobble animation
    chestRotate.value = withSequence(
      withTiming(-12, { duration: 80 }),
      withTiming(12, { duration: 80 }),
      withTiming(-10, { duration: 80 }),
      withTiming(10, { duration: 80 }),
      withTiming(0, { duration: 80 })
    );

    chestScale.value = withSequence(
      withTiming(1.3, { duration: 350 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // After brief opening delay, reveal reward with celebration fanfare!
    setTimeout(() => {
      audioManager.playCelebrationSound();
      setStage('revealed');

      rewardOpacity.value = withTiming(1, { duration: 250 });
      rewardScale.value = withSequence(
        withSpring(1.2, { damping: 6, stiffness: 240 }),
        withSpring(1, { damping: 10, stiffness: 180 })
      );
    }, 600);
  };

  const handleClaim = async () => {
    audioManager.playTapSound();
    const todayStr = new Date().toISOString().split('T')[0];
    const eventId = `daily_chest_${todayStr}`;
    await useProgressStore.getState().recordXPEvent({
      eventId,
      sessionId: `chest_${todayStr}`,
      eventType: 'GAME_COMPLETION',
      xpAmount: selectedReward.bonusXp,
      metadata: {
        rewardId: selectedReward.id,
        rewardTitle: selectedReward.title,
      },
    });

    if (onRewardClaimed) {
      onRewardClaimed(selectedReward);
    }
    onClose();
  };

  const chestAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestScale.value },
      { rotate: `${chestRotate.value}deg` },
    ],
  }));

  const rewardAnimStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ scale: rewardScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Close X */}
          <Pressable
            onPress={onClose}
            style={styles.closeButton}
            accessibilityLabel="Close reward modal"
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {stage !== 'revealed' ? (
            /* CLOSED / OPENING CHEST STATE */
            <View style={styles.chestView}>
              <View style={styles.titlePill}>
                <Text style={styles.titlePillText}>MYSTERY REWARD CHEST 🎁</Text>
              </View>

              <Text style={styles.headline}>Quest Milestone Completed!</Text>
              <Text style={styles.subheadline}>
                You earned an enchanted chest! Tap to unlock your treasure:
              </Text>

              {/* Animated Treasure Chest */}
              <Pressable
                onPress={handleOpenChest}
                accessibilityLabel="Tap to open mystery chest"
                accessibilityRole="button"
                style={styles.chestPressable}
              >
                <Animated.View style={[styles.chestContainer, chestAnimStyle]}>
                  <Text style={styles.chestEmoji}>🎁</Text>
                  <View style={styles.sparkleRow}>
                    <Text style={styles.sparkleText}>✨ ⭐ ✨</Text>
                  </View>
                </Animated.View>
              </Pressable>

              <BigTouchTarget
                onPress={handleOpenChest}
                style={styles.unlockButton}
                accessibilityLabel="Unlock chest now"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={['#F59E0B', '#EAB308', '#CA8A04']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.unlockButtonText}>TAP TO UNLOCK 🎁</Text>
                </LinearGradient>
              </BigTouchTarget>
            </View>
          ) : (
            /* REVEALED REWARD STATE */
            <Animated.View style={[styles.rewardView, rewardAnimStyle]}>
              <View style={styles.celebrationPill}>
                <Text style={styles.celebrationPillText}>TREASURE UNLOCKED! 🎉</Text>
              </View>

              {/* Reward Icon Halo */}
              <View style={styles.rewardHalo}>
                <Text style={styles.rewardIcon}>{selectedReward.icon}</Text>
              </View>

              <Text style={styles.rewardTitle}>{selectedReward.title}</Text>
              <Text style={styles.rewardCategory}>{selectedReward.category}</Text>
              <Text style={styles.rewardDesc}>{selectedReward.description}</Text>

              <View style={styles.bonusXpPill}>
                <Text style={styles.bonusXpText}>+{selectedReward.bonusXp} BONUS XP 🌟</Text>
              </View>

              <BigTouchTarget
                onPress={handleClaim}
                style={styles.claimButton}
                accessibilityLabel="Claim reward"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.claimButtonText}>AWESOME! KEEP IT 🌟</Text>
                </LinearGradient>
              </BigTouchTarget>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: '100%',
    maxWidth: 380,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  chestView: {
    alignItems: 'center',
    width: '100%',
  },
  titlePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 10,
  },
  titlePillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F2042',
    textAlign: 'center',
    marginBottom: 4,
  },
  subheadline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  chestPressable: {
    padding: 10,
    alignItems: 'center',
  },
  chestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  chestEmoji: {
    fontSize: 76,
  },
  sparkleRow: {
    marginTop: 6,
  },
  sparkleText: {
    fontSize: 18,
  },
  unlockButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 14,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  claimButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  rewardView: {
    alignItems: 'center',
    width: '100%',
  },
  celebrationPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: 12,
  },
  celebrationPillText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rewardHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    borderWidth: 4,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  rewardIcon: {
    fontSize: 48,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F2042',
    textAlign: 'center',
    marginTop: 6,
  },
  rewardCategory: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  rewardDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  bonusXpPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    marginTop: 12,
  },
  bonusXpText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
  },
});
