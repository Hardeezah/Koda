import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#10b981', backgroundColor: '#1a1a2e' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff'
      }}
      text2Style={{
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)'
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ backgroundColor: '#ef4444' }}
      text1Style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff'
      }}
      text2Style={{
        fontSize: 12,
        color: '#fff'
      }}
    />
  ),
  warning: ({ text1, text2 }) => (
    <View className="bg-surface border-l-4 border-amber-500 p-4 rounded-lg flex-row items-center w-[90%] self-center">
      <View className="flex-1">
        <Text className="text-white font-bold text-sm">{text1}</Text>
        <Text className="text-white/60 text-xs mt-1">{text2}</Text>
      </View>
    </View>
  )
};
