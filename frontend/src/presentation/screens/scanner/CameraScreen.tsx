import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';

// FIX: removed visionService — it was causing "vision analysis failed".
// Now hits the same backend endpoint as ScannerScreen, which is known to work.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const CameraScreen = ({ navigation }: any) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<any>(null);

  // ── Permission gates ─────────────────────────────────────────────────────

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Feather name="camera-off" size={48} color="rgba(255,255,255,0.1)" />
        <Text
          style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
          className="text-white text-xl mt-6 mb-3"
        >
          Camera Permission
        </Text>
        <Text
          style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
          className="text-white/40 text-center mb-8 text-sm leading-6"
        >
          KodaTrade needs camera access to identify trade commodities and
          verify compliance.
        </Text>
        <Button title="Grant Access" onPress={requestPermission} />
      </View>
    );
  }

  // ── Capture + analyse ────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);

    try {
      console.log("📸 Starting capture...");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (!photo?.uri) throw new Error("Failed to take photo");

      console.log("✅ Photo captured, compressing...");

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
      );

      if (!manipulated.base64) throw new Error("Image compression failed");

      console.log(`✅ Image compressed | base64 length: ${manipulated.base64.length}`);

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${API_URL}/api/v1/compliance/analyze_image`;

      console.log(`🚀 Sending request to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ base64_image: manipulated.base64 }),
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error body:", errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Success! Data received:", data);

      navigation.navigate('HSResult', {
        result: {
          label: data.product_name || "Scanned Product",
          complianceData: data,
        },
      });

    } catch (error: any) {
      console.error("🔥 Full Error in handleCapture:", error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: error.message || 'Unknown error occurred',
      });
    } finally {
      setIsScanning(false);
    }
  };


  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-black">
      <CameraView className="flex-1" ref={cameraRef} facing="back">
        <SafeAreaView className="flex-1 justify-between">

          {/* Top label */}
          <View className="items-center mt-6">
            <View className="bg-black/50 px-4 py-2 rounded-full flex-row items-center gap-2">
              <Feather name="maximize" size={12} color="rgba(255,255,255,0.5)" />
              <Text
                style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                className="text-white/70 text-xs"
              >
                Centre product in frame
              </Text>
            </View>
          </View>

          {/* Scan frame */}
          <View className="w-[70%] aspect-square self-center relative">
            {/* Corner markers */}
            <View className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

            {/* Scanning line */}
            {isScanning && (
              <View className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-400/70" />
            )}
          </View>

          {/* Bottom actions */}
          <View className="px-6 pb-6 gap-3">
            {isScanning && (
              <View className="flex-row items-center justify-center gap-2 mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                  className="text-green-700 text-xs uppercase tracking-widest"
                >
                  Analysing with AI...
                </Text>
              </View>
            )}
            <Button
              title={isScanning ? 'Processing...' : 'Capture & Analyse'}
              onPress={handleCapture}
              loading={isScanning}
            />
            <Button
              variant="secondary"
              title="Cancel"
              onPress={() => navigation.goBack()}
            />
          </View>

        </SafeAreaView>
      </CameraView>
    </View>
  );
};

export default CameraScreen;