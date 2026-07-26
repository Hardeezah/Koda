import React, { useState } from 'react';
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { authService } from '../../../infrastructure/authService';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Required fields missing',
      });
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await authService.signUp(email, password, fullName);
        Toast.show({
          type: 'success',
          text1: 'Account Created',
          text2: 'You can now sign in immediately.',
        });
        setIsSignUp(false);
      } else {
        await authService.signIn(email, password);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isSignUp ? 'Signup Failed' : 'Login Failed',
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute top-[-150] left-[-150]">
        <LinearGradient
          colors={['rgba(0, 210, 255, 0.25)', 'rgba(16, 185, 129, 0.1)', 'transparent']}
          className="w-[600] h-[600] rounded-full"
        />
      </View>

      <SafeAreaView className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48, paddingBottom: 48 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row justify-between items-center mb-12">
                <TouchableOpacity
                  className="bg-transparent w-8 h-8 rounded-full items-center justify-center border border-white/10"
                >
                  <Feather name="globe" size={16} color="white" />
                </TouchableOpacity>
                <View className="flex-row items-center">
                  <Image
                    source={require('../../../../assets/images/logo.png')}
                    className="w-8 h-8 mr-[-4px]"
                    resizeMode="contain"
                  />
                  <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-[#cbd5e1] text-lg uppercase tracking-tight">
                    ODA
                  </Text>
                </View>
              </View>

              <View className="mb-10">
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-4xl text-white mb-2 tracking-tight">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-base">
                  {isSignUp
                    ? 'Create your account for daily trade updates.'
                    : 'Login to view daily trade updates.'}
                </Text>
              </View>

              <View className="space-y-6">
                {isSignUp && (
                  <View className="mb-4">
                    <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 ml-1">Full Name</Text>
                    <View className="flex-row items-center bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16">
                      <Feather name="user" size={18} color="rgba(255,255,255,0.4)" />
                      <TextInput
                        className="flex-1 color-white font-inter ml-3 text-sm"
                        placeholder="Enter your name"
                        placeholderTextColor="rgba(255, 255, 255, 0.2)"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>
                )}

                <View className="mb-4">
                  <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 ml-1">Email</Text>
                  <View className="flex-row items-center bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16">
                    <Feather name="mail" size={18} color="rgba(255,255,255,0.4)" />
                    <TextInput
                      className="flex-1 color-white font-inter ml-3 text-sm"
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 ml-1">Password</Text>
                  <View className="flex-row items-center bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16">
                    <Feather name="lock" size={18} color="rgba(255,255,255,0.4)" />
                    <TextInput
                      className="flex-1 color-white font-inter ml-3 text-sm"
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.2)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                      <Feather
                        name={isPasswordVisible ? "eye" : "eye-off"}
                        size={18}
                        color="rgba(255,255,255,0.4)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isSignUp && (
                  <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity className="flex-row items-center">
                      <View className="w-5 h-5 rounded bg-white/5 border border-white/10 mr-2" />
                      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-xs">Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-xs">Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                  className="mt-6 rounded-full overflow-hidden"
                >
                  <LinearGradient
                    colors={['#00d2ff', '#10b981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-16 rounded-full items-center justify-center shadow-lg shadow-primary/20"
                  >
                    <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-black text-base">
                      {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View className="flex-row items-center my-8">
                  <View className="flex-1 h-[0.5px] bg-white/10" />
                  <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/20 mx-4 text-[10px] uppercase">Or</Text>
                  <View className="flex-1 h-[0.5px] bg-white/10" />
                </View>

                <View className="flex-row justify-between space-x-4">
                  <TouchableOpacity
                    className="flex-1 mr-2 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-2xl h-14"
                    onPress={() => Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Google sign-in will be available in the next release.' })}
                  >
                    <Ionicons name="logo-google" size={18} color="white" />
                    <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-white ml-2 text-sm">Google</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 ml-2 flex-row items-center justify-center bg-white/5 border border-white/10 rounded-2xl h-14"
                    onPress={() => Toast.show({ type: 'info', text1: 'Coming Soon', text2: 'Apple sign-in will be available in the next release.' })}
                  >
                    <Ionicons name="logo-apple" size={20} color="white" />
                    <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-white ml-2 text-sm">Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mt-auto pt-12 items-center">
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-sm">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                    <Text className="text-white">
                      {isSignUp ? 'Login' : 'Create an account'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
