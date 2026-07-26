import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive';
  className?: string;
}

export const Button = ({
  onPress,
  title,
  loading,
  disabled,
  variant = 'primary',
  className
}: ButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  const getVariantStyles = () => {
    if (disabled && !loading) {
      return 'bg-neutral-800 border-none rounded-2xl';
    }
    switch (variant) {
      case 'primary':
        return 'bg-[#10b981] border-none rounded-2xl';
      case 'secondary':
        return 'bg-transparent border-2 border-[#10b981] rounded-2xl';
      case 'destructive':
        return 'bg-red-500/20 border border-red-500 rounded-2xl';
      default:
        return 'bg-[#10b981] rounded-2xl';
    }
  };

  const getTextColor = () => {
    if (disabled && !loading) {
      return 'text-neutral-500';
    }
    switch (variant) {
      case 'primary':
        return 'text-black';
      case 'secondary':
        return 'text-[#10b981]';
      case 'destructive':
        return 'text-red-500';
      default:
        return 'text-black';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      className={`rounded-2xl overflow-hidden ${getVariantStyles()} ${className}`}
    >
      <AnimatedView style={animatedStyle}>
        <View className="h-14 items-center justify-center px-6">
          {loading ? (
            <ActivityIndicator color={variant === 'primary' ? 'black' : '#10b981'} />
          ) : (
            <Text 
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }} 
              className={`text-sm uppercase tracking-wider ${getTextColor()}`}
            >
              {title}
            </Text>
          )}
        </View>
      </AnimatedView>
    </TouchableOpacity>
  );
};
