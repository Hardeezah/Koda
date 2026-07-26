import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  useFonts,
  Inter_400Regular,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans';
import { RobotoMono_400Regular, RobotoMono_500Medium } from '@expo-google-fonts/roboto-mono';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';

import LoginScreen from './src/presentation/screens/auth/LoginScreen';
import ProfileScreen from './src/presentation/screens/profile/ProfileScreen';
import LedgerScreen from './src/presentation/screens/ledger/LedgerScreen';
import ScannerScreen from './src/presentation/screens/scanner/ScannerScreen';
import DocumentDraftScreen from './src/presentation/screens/shared/DocumentDraftScreen';
import CommunicationScreen from './src/presentation/screens/shared/CommunicationScreen';
import OnboardingStep1 from './src/presentation/screens/onboarding/OnboardingStep1';
import OnboardingStep2 from './src/presentation/screens/onboarding/OnboardingStep2';
import DashboardScreen from './src/presentation/screens/dashboard/DashboardScreen';
import HSResultScreen from './src/presentation/screens/compliance/HSResultScreen';
import ComplianceSearchScreen from './src/presentation/screens/compliance/ComplianceSearchScreen';
import ComplianceResultScreen from './src/presentation/screens/compliance/ComplianceResultScreen';
import ExportScoreScreen from './src/presentation/screens/passport/ExportScoreScreen';
import CameraScreen from './src/presentation/screens/scanner/CameraScreen';
import GuideScreen from './src/presentation/screens/profile/GuideScreen';

import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/infrastructure/supabase';
import { User } from '@supabase/supabase-js';
import { toastConfig } from './src/presentation/components/Toast';
import "./src/presentation/styles/global.css";
import { TradeModeProvider } from './src/context/TradeModeContext';

// Import TradeModeProvider

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 10,
          marginTop: 4,
        }
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Home', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tab.Screen name="Scan" component={ScannerScreen} options={{
        title: 'Scan',
        tabBarIcon: ({ color }) => (
          <View className="bg-emerald w-12 h-12 rounded-2xl items-center justify-center -mt-8 shadow-lg shadow-emerald/20">
            <Feather name="maximize" size={24} color="black" />
          </View>
        ),
        tabBarLabel: () => null
      }} />
      <Tab.Screen name="LedgerTab" component={LedgerScreen} options={{ title: 'Ledger', tabBarIcon: ({ color }) => <Feather name="book" size={22} color={color} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_700Bold, IBMPlexSans_500Medium,
    RobotoMono_400Regular, RobotoMono_500Medium,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data } = await supabase.from('profiles').select('onboarding_completed').eq('id', currentUser.id).single();
          setOnboardingCompleted(data?.onboarding_completed || false);
        } catch (err) {
          setOnboardingCompleted(false);
        }
      }
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        try {
          const { data } = await supabase.from('profiles').select('onboarding_completed').eq('id', currentUser.id).single();
          setOnboardingCompleted(data?.onboarding_completed || false);
        } catch (err) {
          setOnboardingCompleted(false);
        }
      } else {
        setOnboardingCompleted(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !initializing) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, initializing]);

  if (!fontsLoaded || initializing) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#00d2ff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TradeModeProvider>   {/* ← WRAPPER ADDED HERE */}
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : !onboardingCompleted ? (
              <>
                <Stack.Screen name="Onboarding1" component={OnboardingStep1} />
                <Stack.Screen name="Onboarding2" component={OnboardingStep2} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="HSResult" component={HSResultScreen} />
                <Stack.Screen name="ComplianceSearch" component={ComplianceSearchScreen} />
                <Stack.Screen name="ComplianceResult" component={ComplianceResultScreen} />
                <Stack.Screen name="ExportScore" component={ExportScoreScreen} />
                <Stack.Screen name="DocumentDraft" component={DocumentDraftScreen} />
                <Stack.Screen name="Communication" component={CommunicationScreen} />
                <Stack.Screen name="Camera" component={CameraScreen} />
                <Stack.Screen name="Guide" component={GuideScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="HSResult" component={HSResultScreen} />
                <Stack.Screen name="ComplianceSearch" component={ComplianceSearchScreen} />
                <Stack.Screen name="ComplianceResult" component={ComplianceResultScreen} />
                <Stack.Screen name="ExportScore" component={ExportScoreScreen} />
                <Stack.Screen name="DocumentDraft" component={DocumentDraftScreen} />
                <Stack.Screen name="Communication" component={CommunicationScreen} />
                <Stack.Screen name="Camera" component={CameraScreen} />
                <Stack.Screen name="Guide" component={GuideScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </TradeModeProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}