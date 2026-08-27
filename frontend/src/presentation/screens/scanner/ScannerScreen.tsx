import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTradeMode } from '../../../context/TradeModeContext';
import { supabase } from '../../../infrastructure/supabase';
import { ScreenLayout } from '../../components/ScreenLayout';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'selection' | 'camera' | 'preview'>('selection');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const { mode: tradeMode } = useTradeMode();

  if (!permission) return <View className="flex-1 bg-black" />;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setInputMode('preview');
    }
  };

  const handleAnalyse = async () => {
    setIsAnalysing(true);
    try {
      let imageUri = selectedImage;

      if (inputMode === 'camera' && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          skipProcessing: true,
        });
        imageUri = photo.uri;
      }

      if (!imageUri && !description.trim()) {
        Toast.show({ type: 'error', text1: 'Input Required', text2: 'Please capture a photo, upload an image, or enter a description.' });
        return;
      }

      let complianceData;

      if (imageUri) {
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 640 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.75 }
        );

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${API_URL}/api/v1/compliance/analyze_image`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            base64_image: manipulated.base64,
            direction: tradeMode,
          }),
        });

        if (!response.ok) {
          throw new Error(`Vision analysis failed (${response.status})`);
        }
        complianceData = await response.json();
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${API_URL}/api/v1/compliance/check`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            product_name: description.trim(),
            hs_code: null,
            direction: tradeMode,
          }),
        });

        if (!response.ok) throw new Error('Text analysis failed');
        complianceData = await response.json();
      }

      navigation.navigate('HSResult', {
        result: {
          label: complianceData.product_name || description.trim() || 'Product',
          complianceData,
          direction: tradeMode,
        },
      });

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: error.message || 'Could not reach the compliance service.',
      });
    } finally {
      setIsAnalysing(false);
    }
  };

  if (!permission.granted) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Camera Permission">
        <View className="flex-1 items-center justify-center">
          <Feather name="camera-off" size={64} color="rgba(255,255,255,0.2)" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-xl mt-6 mb-2">Camera Access</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-center mb-8 px-6 leading-6">
            We need camera access to visually identify products and determine compliance.
          </Text>
          <View className="w-full">
            <Button title="GRANT ACCESS" onPress={requestPermission} />
          </View>
        </View>
      </ScreenLayout>
    );
  }

  // CAMERA MODE
  if (inputMode === 'camera') {
    return (
      <View className="flex-1 bg-black">
        <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
          <View className="flex-1 justify-between p-6">
            <View className="flex-row justify-between items-center mt-12">
              <TouchableOpacity
                onPress={() => setInputMode('selection')}
                className="w-12 h-12 rounded-full bg-black/50 items-center justify-center border border-white/10"
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
              <View className={`px-4 py-2 rounded-full ${tradeMode === 'export' ? 'bg-cyan-500/20' : 'bg-purple-500/20'} border border-white/10`}>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className={`text-[10px] uppercase tracking-widest ${tradeMode === 'export' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {tradeMode === 'export' ? '↑ Export Mode' : '↓ Import Mode'}
                </Text>
              </View>
            </View>

            <View className="items-center mb-10">
              <View className="w-64 h-64 border-2 border-white/50 rounded-[40px] mb-10 items-center justify-center bg-white/5">
                 <Feather name="maximize" size={48} color="rgba(255,255,255,0.2)" />
              </View>
              
              <TouchableOpacity
                onPress={handleAnalyse}
                disabled={isAnalysing}
                className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-emerald-500"
              >
                {isAnalysing ? <ActivityIndicator color="black" /> : <Feather name="aperture" size={32} color="black" />}
              </TouchableOpacity>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 mt-4 text-xs uppercase tracking-widest">
                {isAnalysing ? "Analyzing..." : "Capture"}
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // SELECTION & PREVIEW MODE
  return (
    <ScreenLayout scrollable={true} onBackPress={() => navigation.goBack()} headerTitle="Product Classification">
      
      <View className="mb-8">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-2xl mb-2">Classify Product</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-sm leading-6">
          Upload an image, take a photo, or describe your product to instantly get its HS Code and compliance requirements.
        </Text>
      </View>

      {/* Trade Mode Indicator */}
      <View className="flex-row items-center justify-center mb-8">
         <View className={`px-4 py-2 rounded-full ${tradeMode === 'export' ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-purple-500/10 border border-purple-500/20'}`}>
           <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className={`text-[10px] uppercase tracking-widest ${tradeMode === 'export' ? 'text-cyan-400' : 'text-purple-400'}`}>
             Currently checking for {tradeMode}
           </Text>
         </View>
      </View>

      {inputMode === 'preview' && selectedImage ? (
        <View className="mb-8 items-center">
          <View className="w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 mb-4 bg-[#0d0d0d]">
            <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity
              onPress={() => { setSelectedImage(null); setInputMode('selection'); }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 items-center justify-center border border-white/10"
            >
              <Feather name="x" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View className="w-full">
            <Button
              title={isAnalysing ? "ANALYZING IMAGE..." : `ANALYZE IMAGE FOR ${tradeMode.toUpperCase()}`}
              onPress={handleAnalyse}
              loading={isAnalysing}
            />
          </View>
        </View>
      ) : (
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity 
            onPress={() => setInputMode('camera')}
            activeOpacity={0.8}
            className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-[32px] p-6 items-center justify-center"
          >
            <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center mb-4">
              <Feather name="camera" size={28} color="#10b981" />
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-base mb-1">Camera</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs text-center">Scan product directly</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickImage}
            activeOpacity={0.8}
            className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-[32px] p-6 items-center justify-center"
          >
            <View className="w-16 h-16 rounded-full bg-blue-500/10 items-center justify-center mb-4">
              <Feather name="image" size={28} color="#3b82f6" />
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-base mb-1">Upload</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs text-center">From photo gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="mb-4 flex-row items-center">
        <View className="flex-1 h-px bg-white/5" />
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/20 text-[10px] uppercase tracking-widest mx-4">OR DESCRIBE IT</Text>
        <View className="flex-1 h-px bg-white/5" />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="bg-[#0d0d0d] rounded-3xl border border-white/5 p-4 mb-6">
          <TextInput
            style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
            className="text-white text-base min-h-[100px]"
            placeholder={`E.g., 500kg of dried ginger for ${tradeMode}`}
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {description.trim().length > 0 && inputMode !== 'preview' && (
          <View className="w-full mb-10">
            <Button
              title={isAnalysing ? "ANALYZING TEXT..." : `CHECK COMPLIANCE`}
              onPress={handleAnalyse}
              loading={isAnalysing}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

export default ScannerScreen;