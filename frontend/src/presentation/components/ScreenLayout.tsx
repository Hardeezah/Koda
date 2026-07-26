import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { TradeModeToggle } from './TradeModeToggle';

interface ScreenLayoutProps {
  children: React.ReactNode;
  showGlow?: boolean;
  scrollable?: boolean;
  onBackPress?: () => void;
  headerTitle?: string;
  bottomAction?: React.ReactNode;
  topAction?: React.ReactNode;
  showTradeToggle?: boolean;
}

export const ScreenLayout = ({
  children,
  showGlow = true,
  scrollable = true,
  onBackPress,
  headerTitle,
  bottomAction,
  topAction,
  showTradeToggle = false,
}: ScreenLayoutProps) => {
  return (
    <View className="flex-1 bg-black">
      {showGlow && (
        <View className="absolute top-[-150] left-[-150]">
          <LinearGradient
            colors={['rgba(0, 210, 255, 0.25)', 'rgba(16, 185, 129, 0.1)', 'transparent']}
            className="w-[600] h-[600] rounded-full"
          />
        </View>
      )}

      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center justify-between">
            {/* LEFT: back button OR trade toggle */}
            <View className="flex-row items-center">
              {onBackPress ? (
                <TouchableOpacity
                  onPress={onBackPress}
                  className="w-10 h-10 rounded-full border border-white/10 items-center justify-center mr-3"
                >
                  <Feather name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
              ) : showTradeToggle ? (
                <TradeModeToggle />
              ) : (
                <View className="w-10" />
              )}
            </View>

            {/* CENTER: title */}
            {headerTitle && (
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className="text-white/40 uppercase tracking-widest text-xs flex-1 text-center"
              >
                {headerTitle}
              </Text>
            )}

            {/* RIGHT: logo or custom action */}
            {topAction ? topAction : (
              <View className="flex-row items-center">
                <Image
                  source={require('../../../assets/images/logo.png')}
                  className="w-5 h-5 mr-[-2px]"
                  resizeMode="contain"
                />
                <Text
                  style={{ fontFamily: 'SpaceGrotesk_700Bold' }}
                  className="text-[#cbd5e1] text-base uppercase tracking-tight"
                >
                  ODA
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Body — KeyboardAvoidingView only when there is a bottomAction (i.e. a text input nearby) */}
        {bottomAction ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} // ← undefined on Android kills the phantom space
            className="flex-1"
          >
            {scrollable ? (
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View className="flex-1 px-6 pt-2">
                {children}
              </View>
            )}

            <View className="px-6 pt-4 pb-8">
              {bottomAction}
            </View>
          </KeyboardAvoidingView>
        ) : (
          // No bottomAction — no KeyboardAvoidingView at all, no phantom space
          scrollable ? (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View className="flex-1 px-6 pt-2">
              {children}
            </View>
          )
        )}
      </SafeAreaView>
    </View>
  );
};