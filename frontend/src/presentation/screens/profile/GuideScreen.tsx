import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/ScreenLayout';

interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const StepCard = ({ step, title, description, icon, color }: StepCardProps) => (
  <View className="bg-[#0d0d0d] border border-white/5 p-6 rounded-3xl mb-4">
    <View className="flex-row justify-between items-center mb-4">
      <View className="flex-row items-center">
        <View 
          className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
          style={{ backgroundColor: `${color}15` }}
        >
          <Feather name={icon} size={18} color={color} />
        </View>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-base">{title}</Text>
      </View>
      <View className="bg-white/5 px-3 py-1 rounded-full border border-white/5">
        <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white/40 text-xs">STEP {step}</Text>
      </View>
    </View>
    <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-sm leading-6">
      {description}
    </Text>
  </View>
);

const GuideScreen = ({ navigation }: any) => {
  return (
    <ScreenLayout
      scrollable={true}
      onBackPress={() => navigation.goBack()}
      headerTitle="KodaGuide"
      showGlow={true}
    >
      <View className="py-6">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-3xl mb-2">User Manual</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-sm mb-8 leading-6">
          KodaTrade streamlines Nigerian import/export processes using real-time automated AI systems. Here is how to make the most of it.
        </Text>

        <StepCard
          step="1"
          title="Setup Business Identity"
          description="Complete the onboarding flow by entering your business name, CAC number, and trade focus (Import, Export, or both). This dynamically builds your Trade Passport profile."
          icon="user-check"
          color="#8b5cf6"
        />

        <StepCard
          step="2"
          title="Scan or Upload Commodity"
          description="Navigate to the 'Scan' tab. Snap a photo of your goods or upload an invoice/document from your gallery. KodaTrade's Llama 3 Vision AI will automatically detect the commodity."
          icon="maximize"
          color="#00d2ff"
        />

        <StepCard
          step="3"
          title="Verify AI Compliance"
          description="The AI cross-checks Nigerian Customs tariffs, SONCAP, NAFDAC lists, NAQS requirements, and CBN Form M restrictions, giving you an instantaneous Allowed or Prohibited verdict."
          icon="shield"
          color="#10b981"
        />

        <StepCard
          step="4"
          title="Save to Trade Ledger"
          description="Save compliant scans directly to your Trade Ledger. The ledger maintains an active, auditable trade log linked directly to your Supabase profile."
          icon="book"
          color="#f59e0b"
        />

        <StepCard
          step="5"
          title="Boost Export Score"
          description="Check your Digital Trade Passport score. Complete outstanding profile details, add your CAC verification number, and execute compliance checks to earn rewards and speed up customs clearing."
          icon="trending-up"
          color="#ec4899"
        />

        <View className="bg-emerald/5 border border-emerald/20 p-6 rounded-3xl mt-6 items-center">
          <Feather name="info" size={24} color="#10b981" className="mb-2" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-center text-sm mb-1">Need help with Form M or NXP?</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-center text-xs leading-5 px-4">
            Click 'Help & Support' in your settings to email our trade concierge agents directly.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default GuideScreen;
