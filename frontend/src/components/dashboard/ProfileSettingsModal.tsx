/**
 * Purpose: Child & Parent Profile & Language Settings Modal.
 *          Allows editing Avatar, Age, Mother Tongue, and Learning Language in-place.
 * Module: Dashboard Components
 * Folder: frontend/src/components/dashboard
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { BigTouchTarget } from '../BigTouchTarget';
import { Typography } from '../../theme/typography';
import { AppLanguage, LearningLanguage, AppAge } from '../../state/appLanguageStore';
import { useChildProfileStore, AVATAR_OPTIONS } from '../../state/childProfileStore';
import { useAuthStore } from '../../state/authStore';
import { audioManager } from '../../services/audioManager';

interface ProfileSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onLogout?: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🔤' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🚩' },
];

const AGES: AppAge[] = [5, 6, 7, 8];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  visible,
  onClose,
  onSaved,
  onLogout,
}) => {
  const profile = useChildProfileStore();
  const logout = useAuthStore((s) => s.logout);

  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [age, setAge] = useState<AppAge>(profile.age);
  const [motherTongue, setMotherTongue] = useState<AppLanguage>(profile.motherTongue);
  const [learningLanguage, setLearningLanguage] = useState<LearningLanguage>(profile.learningLanguage);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(profile.appLanguage || profile.motherTongue);

  const [musicEnabled, setMusicEnabled] = useState(audioManager.getMusicEnabled());
  const [sfxEnabled, setSfxEnabled] = useState(true);

  const handleSave = async () => {
    audioManager.playCelebrationSound();
    audioManager.setMusicEnabled(musicEnabled);
    audioManager.setSfxEnabled(sfxEnabled);

    await profile.saveProfile({
      childId: profile.childId,
      name: name.trim() || profile.name,
      age,
      avatar,
      motherTongue,
      learningLanguage,
      appLanguage,
    });
    if (onSaved) onSaved();
    onClose();
  };

  const handleLogout = async () => {
    audioManager.playTapSound();
    await logout();
    onClose();
    if (onLogout) onLogout();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile & Settings ⚙️</Text>
            <BigTouchTarget
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close settings"
              accessibilityRole="button"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </BigTouchTarget>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Child Name */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Child Name</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                maxLength={20}
              />
            </View>

            {/* Avatar Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Learning Buddy Avatar</Text>
              <View style={styles.avatarRow}>
                {AVATAR_OPTIONS.map((item) => {
                  const isSel = avatar === item.emoji;
                  return (
                    <BigTouchTarget
                      key={item.id}
                      onPress={() => {
                        audioManager.playTapSound();
                        setAvatar(item.emoji);
                      }}
                      style={[styles.avatarOpt, isSel && styles.avatarOptSelected]}
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                    >
                      <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Age Selector (2x2 Grid) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Age Level (Games Curriculum)</Text>
              <View style={styles.ageRow}>
                {AGES.map((a) => {
                  const isSel = age === a;
                  return (
                    <BigTouchTarget
                      key={a}
                      onPress={() => {
                        audioManager.playTapSound();
                        setAge(a);
                      }}
                      style={[styles.ageOpt, isSel && styles.ageOptSelected]}
                      accessibilityLabel={`Age ${a}`}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.ageText, isSel && styles.ageTextSelected]}>
                        Age {a}
                      </Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Mother Tongue */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mother Tongue (App Interface & Voice)</Text>
              <View style={styles.langRow}>
                {LANGUAGES.map((l) => {
                  const isSel = motherTongue === l.code;
                  return (
                    <BigTouchTarget
                      key={`mt_${l.code}`}
                      onPress={() => {
                        audioManager.playTapSound();
                        setMotherTongue(l.code as AppLanguage);
                      }}
                      style={[styles.langOpt, isSel && styles.langOptSelected]}
                      accessibilityLabel={l.name}
                      accessibilityRole="button"
                    >
                      <Text style={styles.langFlag}>{l.flag}</Text>
                      <Text style={[styles.langText, isSel && styles.langTextSelected]}>
                        {l.name}
                      </Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Learning Language */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Learning Language (Words & Speech)</Text>
              <View style={styles.langRow}>
                {LANGUAGES.map((l) => {
                  const isSel = learningLanguage === l.code;
                  return (
                    <BigTouchTarget
                      key={`ll_${l.code}`}
                      onPress={() => {
                        audioManager.playTapSound();
                        setLearningLanguage(l.code as LearningLanguage);
                      }}
                      style={[styles.langOpt, isSel && styles.langOptSelected]}
                      accessibilityLabel={l.name}
                      accessibilityRole="button"
                    >
                      <Text style={styles.langFlag}>{l.flag}</Text>
                      <Text style={[styles.langText, isSel && styles.langTextSelected]}>
                        {l.name}
                      </Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>

            {/* App Interface Language */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>App Interface Language (Buttons & Labels)</Text>
              <View style={styles.langRow}>
                {LANGUAGES.map((l) => {
                  const isSel = appLanguage === l.code;
                  return (
                    <BigTouchTarget
                      key={`app_${l.code}`}
                      onPress={() => {
                        audioManager.playTapSound();
                        setAppLanguage(l.code as AppLanguage);
                      }}
                      style={[styles.langOpt, isSel && styles.langOptSelected]}
                      accessibilityLabel={l.name}
                      accessibilityRole="button"
                    >
                      <Text style={styles.langFlag}>{l.flag}</Text>
                      <Text style={[styles.langText, isSel && styles.langTextSelected]}>
                        {l.name}
                      </Text>
                    </BigTouchTarget>
                  );
                })}
              </View>
            </View>

            {/* Sound & Music Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Sound & Music 🎵</Text>
              <View style={styles.audioToggleRow}>
                <BigTouchTarget
                  onPress={() => {
                    audioManager.playTapSound();
                    setMusicEnabled(!musicEnabled);
                  }}
                  style={[styles.audioToggleBtn, musicEnabled && styles.audioToggleBtnActive]}
                  accessibilityLabel="Toggle Background Music"
                  accessibilityRole="button"
                >
                  <Text style={styles.audioToggleText}>
                    {musicEnabled ? '🎶 Music: ON' : '🔇 Music: OFF'}
                  </Text>
                </BigTouchTarget>

                <BigTouchTarget
                  onPress={() => {
                    audioManager.playTapSound();
                    setSfxEnabled(!sfxEnabled);
                  }}
                  style={[styles.audioToggleBtn, sfxEnabled && styles.audioToggleBtnActive]}
                  accessibilityLabel="Toggle Sound Effects"
                  accessibilityRole="button"
                >
                  <Text style={styles.audioToggleText}>
                    {sfxEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF'}
                  </Text>
                </BigTouchTarget>
              </View>
            </View>
          </ScrollView>

          {/* Buttons Row */}
          <View style={styles.actionsRow}>
            <BigTouchTarget
              onPress={handleSave}
              style={styles.saveBtn}
              accessibilityLabel="Save profile changes"
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>Save Preferences ✓</Text>
            </BigTouchTarget>

            <BigTouchTarget
              onPress={handleLogout}
              style={styles.logoutBtn}
              accessibilityLabel="Log out of account"
              accessibilityRole="button"
            >
              <Text style={styles.logoutBtnText}>Log Out 🚪</Text>
            </BigTouchTarget>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 3,
    borderColor: '#BAE6FD',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F2042',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '900',
  },
  modalScroll: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F2042',
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  avatarOpt: {
    width: '30%',
    height: 60,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarOptSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  ageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  ageOpt: {
    width: '48%',
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  ageOptSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  audioToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  audioToggleBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  audioToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2042',
  },
  ageText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  ageTextSelected: {
    color: '#B45309',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langOpt: {
    flex: 1,
    height: 54,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  langOptSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  langFlag: {
    fontSize: 18,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  langTextSelected: {
    color: '#1D4ED8',
  },
  actionsRow: {
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#10B981',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '800',
  },
});
