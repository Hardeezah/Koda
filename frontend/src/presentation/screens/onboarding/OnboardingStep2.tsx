import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';

const CATEGORY_MAPPING: Record<string, string[]> = {
  'Agricultural': ['Ginger', 'Cocoa', 'Cashew', 'Shea Butter', 'Sesame', 'Hibiscus', 'Soybeans'],
  'Solid Minerals': ['Lead Ore', 'Zinc Ore', 'Lithium', 'Tin', 'Coal', 'Limestone'],
  'Textiles & Garments': ['Cotton', 'Finished Leather', 'Woven Fabrics', 'Traditional Attire'],
  'Manufactured Goods': ['Plastics', 'Packaged Foods', 'Cosmetics', 'Furniture', 'Building Materials'],
  'Energy & Petroleum': ['Crude Oil', 'Natural Gas', 'Refined Petroleum', 'Lubricants'],
  'Tech & Electronics': ['Software', 'Hardware Components', 'Consumer Electronics']
};

const OnboardingStep2 = ({ navigation, route }: any) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else if (selectedCategories.length < 3) {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Trade Partner',
            business_name: route.params.data.businessName,
            business_type: route.params.data.businessType,
            trade_type: route.params.data.tradeType,
            primary_category: route.params.data.category,
            sub_categories: selectedCategories,
            target_countries: countries.split(',').map(c => c.trim()),
            onboarding_completed: true
          });

        if (error) throw error;

        // Trigger auth listener in App.tsx by updating user metadata
        await supabase.auth.updateUser({
          data: { onboarding_completed: true }
        });
      }
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Error saving onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'Trade Partner',
            onboarding_completed: true 
          });

        if (error) throw error;

        await supabase.auth.updateUser({
          data: { onboarding_completed: true }
        });
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    } finally {
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <ScreenLayout
      scrollable={true}
      bottomAction={
        <View>
          <Button
            title="COMPLETE SETUP"
            onPress={handleFinish}
            loading={loading}
            disabled={selectedCategories.length === 0}
          />
          <TouchableOpacity 
            onPress={handleSkip} 
            className="mt-4 self-center"
            disabled={loading}
          >
            <Text 
              className="font-jakarta-bold text-white/20 text-sm uppercase tracking-widest"
            >
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View className="flex-row gap-2 mb-8">
        <View className="flex-1 h-1 bg-[#10b981] rounded-full" />
        <View className="flex-1 h-1 bg-[#10b981] rounded-full" />
      </View>

      <Text className="font-jakarta-bold text-xl text-white mb-2">
        Specifics
      </Text>
      <Text className="font-jakarta text-white/40 text-sm mb-10">
        Select up to 3 specific goods and target countries.
      </Text>

      <View className="mb-8">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-4 ml-1 uppercase tracking-widest">Goods Categories ({route.params.data.category})</Text>
        <View className="flex-row flex-wrap gap-2">
          {(CATEGORY_MAPPING[route.params.data.category] || []).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategory(cat)}
              className={`px-4 py-3 rounded-2xl border ${
                selectedCategories.includes(cat) ? 'bg-emerald border-emerald' : 'bg-white/5 border-white/10'
              }`}
            >
              <Text 
                className={`font-jakarta-semi text-sm ${selectedCategories.includes(cat) ? 'text-black' : 'text-white/40'}`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-10">
        <Text className="font-jakarta-bold text-white/60 text-xs mb-2 ml-1 uppercase tracking-widest">Target Countries</Text>
        <View className="bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-16 justify-center">
          <TextInput
            className="color-white font-inter text-sm"
            placeholder="e.g. China, USA, UAE (comma separated)"
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            value={countries}
            onChangeText={setCountries}
          />
        </View>
      </View>
    </ScreenLayout>
  );
};

export default OnboardingStep2;
