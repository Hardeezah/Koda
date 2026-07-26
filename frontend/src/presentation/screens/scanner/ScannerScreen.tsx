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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTradeMode } from '../../../context/TradeModeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const ScannerScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera'); // ← renamed
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const { mode: tradeMode } = useTradeMode(); // ← renamed to tradeMode

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Text className="text-white text-xl font-jakarta-bold mb-4">Camera Permission</Text>
        <Text className="text-white/40 text-center mb-8">
          We need camera access to identify products and check compliance.
        </Text>
        <Button title="Grant Access" onPress={requestPermission} />
      </View>
    );
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleAnalyse = async () => {
    setIsAnalysing(true);
    try {
      console.log(`🚀 Starting ${tradeMode} analysis... Input: ${inputMode}`);

      let imageUri = selectedImage;

      if (inputMode === 'camera' && cameraRef.current) {
        console.log("📸 Taking photo...");
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          skipProcessing: true,
        });
        imageUri = photo.uri;
      }

      if (!imageUri && !description.trim()) {
        Toast.show({ type: 'error', text1: 'Input Required', text2: 'Please capture a photo or enter a description.' });
        return;
      }

      let complianceData;

      if (imageUri) {
        console.log("🖼️ Compressing image...");
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 640 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.75 }
        );

        console.log(`✅ Compressed | base64 length: ${manipulated.base64?.length}`);

        const response = await fetch(`${API_URL}/api/v1/compliance/analyze_image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64_image: manipulated.base64,
            direction: tradeMode,  // ← correct variable
          }),
        });

        console.log(`📡 Response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Server Error:", errorText);
          throw new Error(`Vision analysis failed (${response.status})`);
        }

        complianceData = await response.json();
        console.log("✅ Image analysis successful:", complianceData.product_name);

      } else {
        console.log("📝 Using text analysis...");
        const response = await fetch(`${API_URL}/api/v1/compliance/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_name: description.trim(),
            hs_code: null,
            direction: tradeMode,  // ← correct variable
          }),
        });

        if (!response.ok) throw new Error('Text analysis failed');
        complianceData = await response.json();
      }

      navigation.navigate('HSResult', {
        result: {
          label: complianceData.product_name || description.trim() || 'Product',
          complianceData,
          direction: tradeMode,  // ← correct variable
        },
      });

    } catch (error: any) {
      console.error("🔥 Full Error in handleAnalyse:", error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: error.message || 'Could not reach the compliance service.',
      });
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <View className="flex-1 bg-black">

      {/* Trade mode indicator */}
      <View className={`absolute top-14 right-6 z-10 px-3 py-1.5 rounded-full ${tradeMode === 'export' ? 'bg-cyan-500/20' : 'bg-purple-500/20'}`}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className={`text-[10px] uppercase tracking-widest ${tradeMode === 'export' ? 'text-cyan-400' : 'text-purple-400'}`}>
          {tradeMode === 'export' ? '↑ Export' : '↓ Import'}
        </Text>
      </View>

      <View className="h-[65%] w-full overflow-hidden">
        {inputMode === 'camera' ? (  /* ← renamed */
          <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
            <View className="flex-1 items-center justify-center">
              <View className="w-64 h-64 border-2 border-emerald/50 rounded-3xl" />
            </View>
          </CameraView>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="flex-1 items-center justify-center bg-[#0d0d0d]"
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <>
                <Feather name="image" size={48} color="rgba(255,255,255,0.1)" />
                <Text className="text-white/20 mt-4 font-jakarta-bold">Tap to select a photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-12 left-6 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
        >
          <Feather name="x" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-6 bg-black" keyboardShouldPersistTaps="handled">

          {/* Camera/Upload toggle — uses inputMode */}
          <View className="flex-row bg-[#0d0d0d] p-1 rounded-2xl border border-white/5 mb-6">
            <TouchableOpacity
              onPress={() => { setInputMode('camera'); setSelectedImage(null); }}  /* ← renamed */
              className={`flex-1 flex-row items-center justify-center h-12 rounded-xl ${inputMode === 'camera' ? 'bg-emerald' : 'bg-transparent'}`}
            >
              <Feather name="camera" size={16} color={inputMode === 'camera' ? 'black' : 'white'} />
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className={`ml-2 text-xs uppercase ${inputMode === 'camera' ? 'text-black' : 'text-white/40'}`}>
                Use Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setInputMode('upload')}  /* ← renamed */
              className={`flex-1 flex-row items-center justify-center h-12 rounded-xl ${inputMode === 'upload' ? 'bg-emerald' : 'bg-transparent'}`}
            >
              <Feather name="upload" size={16} color={inputMode === 'upload' ? 'black' : 'white'} />
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className={`ml-2 text-xs uppercase ${inputMode === 'upload' ? 'text-black' : 'text-white/40'}`}>
                Upload Photo
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16 justify-center mb-6">
            <TextInput
              className="color-white font-inter text-sm"
              placeholder={`Product name for ${tradeMode} check (e.g. Dried Ginger)`}
              placeholderTextColor="rgba(255, 255, 255, 0.2)"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <Button
            title={isAnalysing ? "ANALYSING..." : `ANALYSE FOR ${tradeMode.toUpperCase()}`}
            onPress={handleAnalyse}
            loading={isAnalysing}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ScannerScreen;