/**
 * Purpose: Root stack navigator managing application entry flows.
 *          Enforces Login-first architecture: the application starts on the child-friendly
 *          Login screen, with "Create My Profile" leading into the multi-step Onboarding.
 * Module: Navigation
 * Folder: frontend/src/navigation
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpProfileScreen } from '../screens/SignUpProfileScreen';
import { ChildDashboardScreen } from '../screens/ChildDashboardScreen';
import { GameCatalogScreen } from '../screens/GameCatalogScreen';
import { LanguageGateScreen } from '../screens/LanguageGateScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { GamesNavigator } from './GamesNavigator';
import { useAppLanguageStore } from '../state/appLanguageStore';
import { useAuthStore } from '../state/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const initLanguage = useAppLanguageStore((s) => s.initLanguage);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    let isMounted = true;
    const prepareApp = async () => {
      try {
        await initLanguage();
        const hasSession = await restoreSession();
        if (hasSession && isMounted) {
          setInitialRoute('ChildDashboard');
        }
      } catch (err) {
        console.warn('[RootNavigator] Startup init warning:', err);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };
    prepareApp();
    return () => {
      isMounted = false;
    };
  }, [initLanguage, restoreSession]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUpProfile" component={SignUpProfileScreen} />
      <Stack.Screen name="ChildDashboard" component={ChildDashboardScreen} />
      <Stack.Screen name="GameCatalog" component={GameCatalogScreen} />
      <Stack.Screen name="LanguageGate" component={LanguageGateScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Games" component={GamesNavigator} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F2042',
  },
});
