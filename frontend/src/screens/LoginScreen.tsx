/**
 * Purpose: Child & Parent Login Screen for Gyannn ("The Living Learning World").
 *          The first screen when application starts.
 *          Features friendly animated companion mascot, frosted Level 2 island surface,
 *          tactile 4-box PIN indicators, Level 3 PrimaryAdventureButton, and responsive layout.
 * Module: Screens
 * Folder: frontend/src/screens
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  CartoonBackground,
  ResponsiveContainer,
  IslandPanel,
  PrimaryAdventureButton,
  LearningBuddyAvatar,
} from '../components';
import {
  WorldPalettes,
  WorldRadii,
  WorldSpacing,
  WorldTypography,
} from '../theme/tokens';
import { useAuthStore } from '../state/authStore';
import { localDatabase } from '../services/localDatabase';
import { audioManager } from '../services/audioManager';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotTip, setShowForgotTip] = useState(false);
  const pinInputRef = useRef<TextInput>(null);

  // Sparkle animation for header
  const sparkleRotate = useSharedValue(0);

  useEffect(() => {
    sparkleRotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-15, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [sparkleRotate]);

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));

  // Auto-fill last used username for convenience
  useEffect(() => {
    let isMounted = true;
    localDatabase.getLastUsername().then((last) => {
      if (isMounted && last) {
        setUsername(last);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    if (isLoading) return; // Prevent duplicate requests from repeated taps

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    audioManager.playTapSound();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    if (!cleanUsername) {
      setErrorMessage('Please type your explorer name! 👤');
      return;
    }

    if (!cleanPin || cleanPin.length !== 4) {
      setErrorMessage('Enter your 4-digit PIN! (e.g. 1234) 🔢');
      return;
    }

    try {
      const res = await login(cleanUsername, cleanPin);
      if (res.success) {
        audioManager.playCelebrationSound();
        navigation.reset({
          index: 0,
          routes: [{ name: 'ChildDashboard' }],
        });
      } else {
        setErrorMessage(
          res.error || 'Username or PIN does not match. Try again! 🌟'
        );
      }
    } catch (err) {
      setErrorMessage("Oops! An error occurred during login. Let's try again! 🌟");
    }
  };

  const isCompact = windowHeight < 680 || windowWidth < 360;

  return (
    <View style={styles.outerContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <CartoonBackground theme="hub" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ResponsiveContainer maxWidth="standard" padding="sm">
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingVertical: isCompact ? 10 : 20 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Brand Wordmark */}
              <View style={styles.brandContainer}>
                <View style={styles.brandPill}>
                  <Animated.Text style={[styles.brandStar, animatedSparkleStyle]}>
                    ⭐
                  </Animated.Text>
                  <Text style={styles.brandTitle}>GYANNN</Text>
                  <Animated.Text style={[styles.brandStar, animatedSparkleStyle]}>
                    ✨
                  </Animated.Text>
                </View>
                <Text style={styles.brandTagline}>Your Magical Learning World 🏰</Text>
              </View>

              {/* Central Animated Learning Companion Hero */}
              <View style={[styles.heroArea, isCompact && styles.heroAreaCompact]}>
                <View style={styles.buddyWrapper}>
                  <LearningBuddyAvatar
                    avatar="🦁"
                    size="hero"
                    variant="gold"
                    animated
                  />
                </View>

                {/* Welcoming Speech Pill */}
                <View style={styles.welcomeBubble}>
                  <Text style={styles.welcomeTitle}>Welcome back, Explorer! 🌟</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Ready for today's learning adventure?
                  </Text>
                </View>
              </View>

              {/* Main Floating Adventure Island (Level 2 Surface) */}
              <IslandPanel
                variant="frosted"
                elevation="floating"
                style={styles.islandContainer}
                padding="md"
              >
                {/* Error Notification */}
                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                  </View>
                )}

                {/* Field 1: Explorer Username */}
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>EXPLORER NAME 👤</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconCircle}>
                      <Text style={styles.inputIcon}>👤</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. aarav"
                      placeholderTextColor="#94A3B8"
                      value={username}
                      onChangeText={(val) => {
                        setUsername(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Explorer Username"
                    />
                  </View>
                </View>

                {/* Field 2: 4-Digit Secret PIN with Visual Cells */}
                <View style={styles.fieldBlock}>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>SECRET 4-DIGIT PIN 🔢</Text>
                    <Pressable
                      onPress={() => setShowPin(!showPin)}
                      hitSlop={8}
                      style={styles.showPinToggle}
                      accessibilityRole="button"
                      accessibilityLabel={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      <Text style={styles.showPinText}>
                        {showPin ? '🙈 Hide' : '👁️ Show'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Tactile 4-Digit Indicator Blocks */}
                  <Pressable
                    onPress={() => pinInputRef.current?.focus()}
                    style={styles.pinCellsContainer}
                    accessibilityLabel="Tap to type your 4-digit PIN"
                    accessibilityRole="button"
                  >
                    {[0, 1, 2, 3].map((idx) => {
                      const digit = pin[idx];
                      const isFilled = digit !== undefined;
                      return (
                        <View
                          key={idx}
                          style={[
                            styles.pinCell,
                            isFilled && styles.pinCellFilled,
                          ]}
                        >
                          {isFilled ? (
                            <Text style={styles.pinCellDigit}>
                              {showPin ? digit : '●'}
                            </Text>
                          ) : (
                            <View style={styles.pinCellPlaceholder} />
                          )}
                        </View>
                      );
                    })}
                  </Pressable>

                  {/* Hidden native numeric input that receives keyboard events */}
                  <TextInput
                    ref={pinInputRef}
                    style={styles.hiddenPinInput}
                    value={pin}
                    onChangeText={(val) => {
                      const digitsOnly = val.replace(/[^0-9]/g, '').slice(0, 4);
                      setPin(digitsOnly);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry={!showPin}
                    accessibilityLabel="Enter 4-digit PIN"
                  />
                </View>

                {/* Forgot PIN Helper Link */}
                <Pressable
                  onPress={() => {
                    audioManager.playTapSound();
                    setShowForgotTip(!showForgotTip);
                  }}
                  style={styles.forgotLink}
                  accessibilityRole="button"
                  accessibilityLabel="Need help with your PIN?"
                >
                  <Text style={styles.forgotLinkText}>
                    Forgot PIN? Ask a parent or teacher 🗝️
                  </Text>
                </Pressable>

                {showForgotTip && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>
                      💡 Ask your parent or teacher to check your 4-digit PIN! If you want to start a new adventure, you can tap "Create My Profile" below!
                    </Text>
                  </View>
                )}

                {/* Primary Action: START ADVENTURE (Level 3 Tactile CTA) */}
                <View style={styles.loginBtnContainer}>
                  <PrimaryAdventureButton
                    label={isLoading ? 'OPENING GATES... 🏰' : 'START ADVENTURE! 🚀'}
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    disabled={isLoading || !username.trim() || pin.length !== 4}
                    onPress={handleLogin}
                    accessibilityLabel="Log in and start adventure"
                  />
                </View>

                {/* Separator */}
                <View style={styles.separatorRow}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Secondary Action: Create My Profile */}
                <View style={styles.signupBlock}>
                  <Text style={styles.newHereText}>New to Gyannn?</Text>
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
                      navigation.navigate('SignUpProfile');
                    }}
                    style={({ pressed }) => [
                      styles.createProfilePill,
                      pressed && styles.createProfilePillPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Create a new child profile"
                  >
                    <Text style={styles.createProfileEmoji}>🎒</Text>
                    <Text style={styles.createProfileText}>Create My Profile ✨</Text>
                  </Pressable>
                </View>
              </IslandPanel>
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
    backgroundColor: '#38BDF8',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Brand Header */
  brandContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: WorldRadii.pill,
    borderWidth: 2,
    borderColor: '#FDE047',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  brandStar: {
    fontSize: 18,
    marginHorizontal: 4,
  },
  brandTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 22,
    fontWeight: '700',
    color: '#312E81',
    letterSpacing: 2,
  },
  brandTagline: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1B4B',
    marginTop: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  /* Hero Avatar Area */
  heroArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heroAreaCompact: {
    marginBottom: 6,
  },
  buddyWrapper: {
    marginBottom: 6,
  },
  welcomeBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: WorldRadii.pill,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeTitle: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  welcomeSubtitle: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: '#4B5563',
    marginTop: 1,
  },

  /* Floating Adventure Island */
  islandContainer: {
    width: '100%',
    marginBottom: 16,
  },

  /* Error Box */
  errorBox: {
    backgroundColor: WorldPalettes.feedback.errorBg,
    borderWidth: 1.5,
    borderColor: WorldPalettes.feedback.errorBorder,
    borderRadius: WorldRadii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    color: WorldPalettes.feedback.errorText,
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Field Blocks */
  fieldBlock: {
    marginBottom: 12,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.5,
  },
  showPinToggle: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: WorldRadii.xs,
  },
  showPinText: {
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },

  /* Username Input */
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.md,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 50,
  },
  inputIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  inputIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: WorldTypography.fonts.semibold,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F2042',
    padding: 0,
  },

  /* 4-Digit PIN Indicators */
  pinCellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pinCell: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: WorldRadii.md,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCellFilled: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  pinCellDigit: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  pinCellPlaceholder: {
    width: 10,
    height: 3,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  hiddenPinInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  /* Forgot PIN Link */
  forgotLink: {
    alignSelf: 'center',
    paddingVertical: 4,
    marginBottom: 6,
  },
  forgotLinkText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 11,
    color: '#4B5563',
    textDecorationLine: 'underline',
  },
  tipBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: WorldRadii.sm,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    padding: 8,
    marginBottom: 10,
  },
  tipText: {
    fontFamily: WorldTypography.fonts.regular,
    fontSize: 11,
    color: '#713F12',
    lineHeight: 16,
    textAlign: 'center',
  },

  /* Primary Action Container */
  loginBtnContainer: {
    marginTop: 2,
    marginBottom: 6,
  },

  /* Separator */
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  separatorText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 10,
  },

  /* Create Profile Secondary Action */
  signupBlock: {
    alignItems: 'center',
  },
  newHereText: {
    fontFamily: WorldTypography.fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  createProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: WorldRadii.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
  },
  createProfilePillPressed: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    transform: [{ scale: 0.98 }],
  },
  createProfileEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  createProfileText: {
    fontFamily: WorldTypography.fonts.bold,
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
});
