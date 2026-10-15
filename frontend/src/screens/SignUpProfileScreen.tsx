/**
 * Purpose: Single-Page Child Onboarding & Profile Creation Screen for Gyannn ("The Living Learning World").
 *          Re-architected with cohesive Level 2 IslandPanels, Level 3 PrimaryAdventureButtons,
 *          SectionHeaders, and ResponsiveContainer, eliminating repetitive white cards.
 *          1. Choose Your Buddy (6 mascots)
 *          2. Child's Name
 *          3. Username & 4-digit PIN
 *          4. Age Selection (Responsive 2x2 grid: 5, 6, 7, 8)
 *          5. App Language (English, Hindi, Marathi)
 *          6. Learning Language (English, Hindi, Marathi)
 *          7. Start My Adventure Button & Login link
 * Module: Screens
 * Folder: frontend/src/screens
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ResponsiveContainer,
  IslandPanel,
  PrimaryAdventureButton,
  SectionHeader,
  LearningBuddyAvatar,
  BigTouchTarget,
  CartoonBackground,
} from '../components';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import { AppLanguage, LearningLanguage, AppAge } from '../state/appLanguageStore';
import { AVATAR_OPTIONS } from '../state/childProfileStore';
import { useAuthStore } from '../state/authStore';
import { localDatabase } from '../services/localDatabase';
import { audioManager } from '../services/audioManager';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUpProfile'>;

interface LanguageOption {
  code: AppLanguage;
  name: string;
  flag: string;
}

const APP_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🔤' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🚩' },
];

const LEARNING_LANGUAGES: { code: LearningLanguage; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🔤' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🚩' },
];

const AGES: AppAge[] = [5, 6, 7, 8];

export const SignUpProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { width: screenWidth } = useWindowDimensions();

  const signup = useAuthStore((s) => s.signup);

  // Form states
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [selectedAge, setSelectedAge] = useState<AppAge>(5);
  const [selectedAppLanguage, setSelectedAppLanguage] = useState<AppLanguage>('en');
  const [selectedLearningLanguage, setSelectedLearningLanguage] = useState<LearningLanguage>('hi');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const clearErrors = () => {
    setErrorMessage(null);
    setNameError(null);
    setUsernameError(null);
    setPinError(null);
  };

  const handleStartAdventure = async () => {
    if (isSubmitting) return;
    clearErrors();
    audioManager.playTapSound();

    const cleanName = name.trim();
    let cleanUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    console.log('[SignUpProfile] handleStartAdventure triggered', {
      name: cleanName,
      username: cleanUsername,
      pinLength: cleanPin.length,
      age: selectedAge,
      appLanguage: selectedAppLanguage,
      learningLanguage: selectedLearningLanguage,
    });

    // 1. Validate Name
    if (!cleanName) {
      const msg = 'Please tell us your name! 👋';
      setErrorMessage(msg);
      setNameError(msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // 2. Auto-generate username if blank (with non-Latin fallback)
    if (!cleanUsername) {
      const sanitized = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const base = sanitized.length >= 2 ? sanitized : 'explorer';
      cleanUsername = `${base}${Math.floor(100 + Math.random() * 900)}`;
      setUsername(cleanUsername);
    }

    // 3. Validate Username Length
    if (cleanUsername.length < 3) {
      const msg = 'Username must be at least 3 letters long! 👤';
      setErrorMessage(msg);
      setUsernameError(msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // 4. Validate PIN (must be exactly 4 digits)
    if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      const msg = 'Please create a 4-digit secret PIN (like 1234)! 🔢';
      setErrorMessage(msg);
      setPinError(msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    // 5. Check username availability locally
    try {
      const isTaken = await localDatabase.isUsernameTaken(cleanUsername);
      if (isTaken) {
        const msg = 'This username is already taken. Try another one! 🌟';
        setErrorMessage(msg);
        setUsernameError(msg);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }
    } catch (checkErr) {
      console.warn('[SignUpProfile] Error checking username availability:', checkErr);
    }

    setIsSubmitting(true);

    try {
      console.log('[SignUpProfile] Calling authStore signup for:', cleanUsername);
      const res = await signup({
        username: cleanUsername,
        pin: cleanPin,
        name: cleanName,
        age: selectedAge,
        avatar: selectedAvatar,
        appLanguage: selectedAppLanguage,
        learningLanguage: selectedLearningLanguage,
        motherTongue: selectedAppLanguage,
      });

      console.log('[SignUpProfile] Signup response:', res);

      if (res.success) {
        audioManager.playCelebrationSound();
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          try {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          } catch {}
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'ChildDashboard' }],
        });
      } else {
        const msg = res.error || "Oops! We couldn't save your profile. Let's try again! 🌟";
        setErrorMessage(msg);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    } catch (err: any) {
      console.error('[SignUpProfile] Unexpected signup error:', err);
      const msg = "Oops! An error occurred. Let's try again! 🌟";
      setErrorMessage(msg);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <CartoonBackground theme="onboarding" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ResponsiveContainer maxWidth="standard" padding="md">
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Navigation Row */}
              <View style={styles.topNavRow}>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'web' && typeof document !== 'undefined') {
                      try {
                        if (document.activeElement instanceof HTMLElement) {
                          document.activeElement.blur();
                        }
                      } catch {}
                    }
                    audioManager.playTapSound();
                    navigation.navigate('Login');
                  }}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to Login"
                >
                  <Text style={styles.backButtonText}>← Back to Login</Text>
                </Pressable>
              </View>

              {/* Header Hero Island */}
              <IslandPanel variant="frosted" elevation="floating" style={styles.headerIsland}>
                <View style={styles.headerHeroRow}>
                  <LearningBuddyAvatar
                    avatar={selectedAvatar}
                    size="hero"
                    variant="gold"
                    animated
                  />
                  <View style={styles.headerTextCol}>
                    <Text style={styles.headerTitle}>Create Your World ✨</Text>
                    <Text style={styles.headerSubtitle}>
                      Let's set up your personal learning adventure playground!
                    </Text>
                  </View>
                </View>
              </IslandPanel>

              {/* Error Box if any */}
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* SECTION 1: Choose Your Buddy */}
              <IslandPanel variant="sunshine" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="Choose Your Buddy"
                  icon="🐾"
                  subtitle="Pick your learning companion!"
                />
                <View style={styles.avatarGrid}>
                  {AVATAR_OPTIONS.map((item) => {
                    const isSelected = selectedAvatar === item.emoji;
                    return (
                      <BigTouchTarget
                        key={item.id}
                        onPress={() => {
                          audioManager.playTapSound();
                          setSelectedAvatar(item.emoji);
                        }}
                        style={[
                          styles.avatarCard,
                          isSelected && styles.avatarCardSelected,
                        ]}
                        accessibilityLabel={`Buddy: ${item.label}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.avatarEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.avatarLabel,
                            isSelected && styles.avatarLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </BigTouchTarget>
                    );
                  })}
                </View>
              </IslandPanel>

              {/* SECTION 2: Name */}
              <IslandPanel variant="frosted" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="What's your name?"
                  icon="✍️"
                  subtitle="We will call you by this name"
                />
                <TextInput
                  style={[styles.textInput, nameError ? styles.textInputError : null]}
                  placeholder="e.g. Aarav"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (nameError) setNameError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  maxLength={25}
                  autoCapitalize="words"
                />
                {nameError ? (
                  <Text style={styles.fieldErrorText}>⚠️ {nameError}</Text>
                ) : null}
              </IslandPanel>

              {/* SECTION 3: Username */}
              <IslandPanel variant="frosted" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="Create your username"
                  icon="🏷️"
                  subtitle="For signing in on any device"
                />
                <TextInput
                  style={[styles.textInput, usernameError ? styles.textInputError : null]}
                  placeholder="e.g. aarav8"
                  placeholderTextColor="#94A3B8"
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    if (usernameError) setUsernameError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                {usernameError ? (
                  <Text style={styles.fieldErrorText}>⚠️ {usernameError}</Text>
                ) : null}
              </IslandPanel>

              {/* SECTION 4: 4-Digit PIN */}
              <IslandPanel variant="parchment" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="Create your 4-digit PIN"
                  icon="🔢"
                  subtitle="Keep it secret and easy to remember"
                />
                <TextInput
                  style={[
                    styles.textInput,
                    styles.pinInput,
                    pinError ? styles.textInputError : null,
                  ]}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  value={pin}
                  onChangeText={(val) => {
                    setPin(val);
                    if (pinError) setPinError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={4}
                />
                {pinError ? (
                  <Text style={styles.fieldErrorText}>⚠️ {pinError}</Text>
                ) : null}
              </IslandPanel>

              {/* SECTION 5: How Old Are You? (2x2 Grid) */}
              <IslandPanel variant="emerald" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="How old are you?"
                  icon="🎂"
                  subtitle="Games adjust automatically to your age"
                />
                <View style={styles.ageGrid}>
                  {AGES.map((age) => {
                    const isSelected = selectedAge === age;
                    return (
                      <BigTouchTarget
                        key={age}
                        onPress={() => {
                          audioManager.playTapSound();
                          setSelectedAge(age);
                        }}
                        style={[styles.ageCard, isSelected && styles.ageCardSelected]}
                        accessibilityLabel={`Age ${age} Years`}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.ageNumber,
                            isSelected && styles.ageNumberSelected,
                          ]}
                        >
                          {age}
                        </Text>
                        <Text
                          style={[
                            styles.ageLabel,
                            isSelected && styles.ageLabelSelected,
                          ]}
                        >
                          Years
                        </Text>
                      </BigTouchTarget>
                    );
                  })}
                </View>
              </IslandPanel>

              {/* SECTION 6: App Language */}
              <IslandPanel variant="frosted" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="App Language"
                  icon="🌐"
                  subtitle="Language used for instructions and menus"
                />
                <View style={styles.languageOptionsList}>
                  {APP_LANGUAGES.map((lang) => {
                    const isSelected = selectedAppLanguage === lang.code;
                    return (
                      <BigTouchTarget
                        key={lang.code}
                        onPress={() => {
                          audioManager.playTapSound();
                          setSelectedAppLanguage(lang.code);
                        }}
                        style={[
                          styles.languagePill,
                          isSelected && styles.languagePillSelected,
                        ]}
                        accessibilityLabel={`App Language: ${lang.name}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.langFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.langText,
                            isSelected && styles.langTextSelected,
                          ]}
                        >
                          {lang.name}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </BigTouchTarget>
                    );
                  })}
                </View>
              </IslandPanel>

              {/* SECTION 7: Learning Language */}
              <IslandPanel variant="frosted" elevation="floating" style={styles.sectionIsland}>
                <SectionHeader
                  title="What do you want to learn?"
                  icon="🎯"
                  subtitle="Target language for speech and vocabulary games"
                />
                <View style={styles.languageOptionsList}>
                  {LEARNING_LANGUAGES.map((lang) => {
                    const isSelected = selectedLearningLanguage === lang.code;
                    return (
                      <BigTouchTarget
                        key={lang.code}
                        onPress={() => {
                          audioManager.playTapSound();
                          setSelectedLearningLanguage(lang.code);
                        }}
                        style={[
                          styles.languagePill,
                          isSelected && styles.languagePillSelected,
                        ]}
                        accessibilityLabel={`Learning Language: ${lang.name}`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.langFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.langText,
                            isSelected && styles.langTextSelected,
                          ]}
                        >
                          {lang.name}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </BigTouchTarget>
                    );
                  })}
                </View>
              </IslandPanel>

              {/* Bottom Error Box - immediately visible to child at bottom of scroll */}
              {errorMessage ? (
                <View style={[styles.errorBox, styles.bottomErrorBox]}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              ) : null}

              {/* Primary Action Button: START MY ADVENTURE */}
              <View style={styles.submitContainer}>
                <PrimaryAdventureButton
                  label={
                    isSubmitting
                      ? 'CREATING YOUR WORLD... 🌟'
                      : 'START MY ADVENTURE 🚀'
                  }
                  variant="success"
                  size="lg"
                  loading={isSubmitting}
                  onPress={handleStartAdventure}
                  accessibilityLabel="Start My Adventure"
                />
              </View>

              {/* Footer: Already have an account? LOGIN */}
              <View style={styles.loginFooter}>
                <Text style={styles.alreadyText}>Already have an account?</Text>
                <Pressable
                  onPress={() => {
                    audioManager.playTapSound();
                    navigation.navigate('Login');
                  }}
                  style={styles.loginLink}
                  accessibilityRole="button"
                  accessibilityLabel="Go to Login screen"
                >
                  <Text style={styles.loginLinkText}>LOGIN 🚀</Text>
                </Pressable>
              </View>
            </ScrollView>
          </ResponsiveContainer>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0F2042',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: WorldSpacing.sm,
    paddingBottom: 48,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: WorldSpacing.sm,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: WorldRadii.sm,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
  },
  backButtonText: {
    color: '#0F2042',
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.subtext,
    fontWeight: '700',
  },
  headerIsland: {
    marginBottom: WorldSpacing.md,
  },
  headerHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WorldSpacing.md,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.sectionTitle,
    fontWeight: '700',
    color: WorldPalettes.text.primary,
    letterSpacing: WorldTypography.letterSpacing.normal,
  },
  headerSubtitle: {
    fontFamily: WorldTypography.fonts.regular,
    fontSize: WorldTypography.sizes.subtext,
    color: WorldPalettes.text.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: WorldPalettes.feedback.errorBg,
    borderRadius: WorldRadii.md,
    padding: WorldSpacing.sm,
    marginBottom: WorldSpacing.md,
    borderWidth: 1.5,
    borderColor: WorldPalettes.feedback.errorBorder,
  },
  errorText: {
    color: WorldPalettes.feedback.errorText,
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.subtext,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionIsland: {
    marginBottom: WorldSpacing.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  avatarCard: {
    width: '31%',
    minWidth: 90,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  avatarCardSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  avatarLabel: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.caption,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  avatarLabelSelected: {
    color: '#B45309',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: WorldRadii.md,
    paddingHorizontal: WorldSpacing.md,
    paddingVertical: 12,
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.button,
    fontWeight: '600',
    color: WorldPalettes.text.primary,
    marginTop: 4,
  },
  textInputError: {
    borderColor: '#EF4444',
    borderWidth: 2.5,
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    color: '#DC2626',
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: WorldTypography.sizes.caption,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  bottomErrorBox: {
    marginTop: WorldSpacing.sm,
    marginBottom: 0,
  },
  pinInput: {
    letterSpacing: 8,
    fontSize: 20,
    textAlign: 'center',
  },
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  ageCard: {
    width: '47%',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  ageCardSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  ageNumber: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 26,
    fontWeight: '700',
    color: '#334155',
  },
  ageNumberSelected: {
    color: '#B45309',
  },
  ageLabel: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: WorldTypography.sizes.subtext,
    color: '#64748B',
    marginTop: 2,
  },
  ageLabelSelected: {
    color: '#B45309',
    fontWeight: '600',
  },
  languageOptionsList: {
    gap: 8,
    marginTop: 4,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.pill,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  languagePillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  langFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  langText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: WorldTypography.sizes.button,
    color: '#334155',
    flex: 1,
  },
  langTextSelected: {
    color: '#1D4ED8',
    fontFamily: WorldTypography.fonts.bold,
    fontWeight: '700',
  },
  checkIcon: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '800',
  },
  submitContainer: {
    marginTop: WorldSpacing.sm,
    marginBottom: WorldSpacing.md,
  },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  alreadyText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: WorldTypography.sizes.body,
    color: '#FFFFFF',
  },
  loginLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: WorldRadii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginLinkText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: WorldTypography.sizes.body,
    fontWeight: '700',
    color: '#FEF08A',
  },
});
