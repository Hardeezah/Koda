import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';

const BUSINESS_TYPES = ['Individual Trader', 'Limited Liability Company', 'Enterprise', 'Cooperative'];
const GOODS_CATEGORIES = ['Agricultural', 'Solid Minerals', 'Textiles & Garments', 'Manufactured Goods', 'Energy & Petroleum', 'Tech & Electronics'];

const OnboardingStep1 = ({ navigation }: any) => {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [tradeType, setTradeType] = useState<'import' | 'export' | 'both'>('export');
  const [category, setCategory] = useState('');

  const handleNext = () => {
    navigation.navigate('Onboarding2', {
      data: { businessName, businessType, tradeType, category }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScreenLayout
      scrollable={true}
      bottomAction={
        <View className="gap-2">
          <Button
            title="CONTINUE"
            onPress={handleNext}
            disabled={!businessName || !businessType || !category}
          />

        </View>
      }
    >
      <View className="flex-row gap-2 mb-8">
        <View className="flex-1 h-1 bg-[#10b981] rounded-full" />
        <View className="flex-1 h-1 bg-white/10 rounded-full" />
      </View>

      <Text className="font-jakarta-bold text-xl text-white mb-2">
        Business Info
      </Text>
      <Text className="font-jakarta text-white/40 text-sm mb-10">
        Tell us about your trade activity.
      </Text>

      <View className="mb-6">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-2 ml-1 uppercase tracking-widest">Business Name</Text>
        <View className="bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16 justify-center">
          <TextInput
            className="color-white font-inter text-sm"
            placeholder="Enter your registered name"
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>
      </View>

      <View className="mb-6">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-2 ml-1 uppercase tracking-widest">Business Type</Text>
        <View className="flex-row flex-wrap gap-2">
          {BUSINESS_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setBusinessType(type)}
              className={`px-4 py-3 rounded-xl border ${businessType === type ? 'bg-emerald/20 border-emerald' : 'bg-white/5 border-white/10'
                }`}
            >
              <Text
                className={`font-jakarta-semi text-sm ${businessType === type ? 'text-emerald' : 'text-white/40'}`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-6">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-2 ml-1 uppercase tracking-widest">Trade Focus</Text>
        <View className="flex-row bg-[#0d0d0d] p-1 rounded-2xl border border-white/5 h-14">
          {(['import', 'export', 'both'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setTradeType(type)}
              className={`flex-1 items-center justify-center rounded-xl ${tradeType === type ? 'bg-emerald' : 'bg-transparent'
                }`}
            >
              <Text
                className={`font-jakarta-bold text-xs uppercase ${tradeType === type ? 'text-black' : 'text-white/40'}`}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-10">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-2 ml-1 uppercase tracking-widest">Primary Goods</Text>
        <View className="bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16 justify-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ alignItems: 'center' }}>
            {GOODS_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                className={`mr-2 px-4 h-10 items-center justify-center rounded-full border ${category === cat ? 'bg-emerald border-emerald' : 'bg-white/5 border-white/10'
                  }`}
              >
                <Text
                  className={`font-jakarta-semi text-xs ${category === cat ? 'text-black' : 'text-white/40'}`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </ScreenLayout>
  );
};

export default OnboardingStep1;
