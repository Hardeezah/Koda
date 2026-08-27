import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { calculateScore, ScoreBreakdown } from '../../../utils/score';
import { LinearGradient } from 'expo-linear-gradient';

const ExportScoreScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState<ScoreBreakdown>({
    total: 0,
    compliancePoints: 0,
    profilePoints: 0,
    cacPoints: 0,
    ledgerPoints: 0,
    tier: 'Bronze',
  });
  const [checksCount, setChecksCount] = useState(0);
  const [needsCac, setNeedsCac] = useState(false);

  const fetchScore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: ledger } = await supabase
        .from('ledger')
        .select('*')
        .eq('profile_id', user.id);

      const totalEntries = ledger?.length || 0;
      const compliantEntries = (ledger || []).filter((e: any) => e.status === 'compliant').length;

      const calculated = calculateScore({
        profile,
        compliantEntries,
        totalEntries,
      });

      setScoreData(calculated);
      setNeedsCac(!profile?.cac_number);
      setChecksCount(totalEntries);
    } catch (err) {
      console.error('Fetch score error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchScore();
    }, [])
  );

  const getTierColors = (tier: string) => {
    switch(tier) {
      case 'Platinum': return ['#e2e8f0', '#94a3b8']; // Silver/Platinum look
      case 'Gold': return ['#fcd34d', '#d97706'];
      case 'Silver': return ['#cbd5e1', '#64748b'];
      default: return ['#b45309', '#78350f']; // Bronze
    }
  };

  if (loading) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="KodaTrade Passport">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </ScreenLayout>
    );
  }

  const colors = getTierColors(scoreData.tier);

  return (
    <ScreenLayout
      scrollable={true}
      onBackPress={() => navigation.goBack()}
      headerTitle="KodaTrade Passport"
      bottomAction={
        <Button title="SHARE PASSPORT" onPress={() => {}} />
      }
    >
      {/* Passport Card */}
      <View className="mt-4 mb-8 w-full rounded-[32px] overflow-hidden border border-white/10" style={{ elevation: 10, shadowColor: colors[0], shadowOpacity: 0.1, shadowRadius: 20 }}>
        <LinearGradient
          colors={['#1a1a1a', '#0d0d0d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-8"
        >
          {/* Card Header */}
          <View className="flex-row justify-between items-start mb-8">
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
                Status Tier
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors[0] }} className="text-2xl uppercase tracking-wider">
                {scoreData.tier}
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full border-2 border-white/10 items-center justify-center">
              <Feather name="shield" size={20} color={colors[0]} />
            </View>
          </View>

          {/* Main Score Display */}
          <View className="items-center justify-center mb-8">
            <View className="relative items-center justify-center">
              <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white text-[80px] leading-[90px]">
                {scoreData.total}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-xs uppercase tracking-widest mt-[-10px]">
                Readiness Score
              </Text>
            </View>
          </View>

          {/* Progress to next tier */}
          {scoreData.nextTier ? (
            <View className="mt-2">
              <View className="flex-row justify-between mb-2">
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-xs">
                  {scoreData.pointsToNextTier} points to {scoreData.nextTier}
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 text-xs">
                  {scoreData.total}/100
                </Text>
              </View>
              <View className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full" 
                  style={{ width: `${scoreData.total}%`, backgroundColor: colors[0] }} 
                />
              </View>
            </View>
          ) : (
            <View className="mt-2 items-center">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', color: colors[0] }} className="text-xs uppercase tracking-widest">
                Maximum Tier Reached
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Score Breakdown Details */}
      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-4 ml-2">
        Score Breakdown
      </Text>
      <View className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 mb-8">
         <View className="flex-row justify-between mb-5 items-center">
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 text-sm mb-1">Profile Completeness</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Basic business details</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-base">+{scoreData.profilePoints}</Text>
         </View>
         <View className="flex-row justify-between mb-5 items-center">
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 text-sm mb-1">CAC Verification</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Verified corporate identity</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-base">+{scoreData.cacPoints}</Text>
         </View>
         <View className="flex-row justify-between mb-5 items-center">
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 text-sm mb-1">Trade Ledger Activity</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Consistent trade logging</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-base">+{scoreData.ledgerPoints}</Text>
         </View>
         <View className="flex-row justify-between items-center">
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/80 text-sm mb-1">Compliance Validations</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Cleared product checks</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-base">+{scoreData.compliancePoints}</Text>
         </View>
      </View>

      {/* Actionable Steps */}
      <View className="mb-10">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-4 ml-2">
          How To Improve
        </Text>
        
        {needsCac && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileTab')}
            activeOpacity={0.8}
            className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-3xl mb-3"
          >
            <View className="w-12 h-12 rounded-2xl bg-amber-500/10 items-center justify-center mr-4">
              <Feather name="file-text" size={20} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm mb-1">Add CAC Number</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs leading-5">Speeds up customs clearance and unlocks Gold tier.</Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        )}

        {checksCount < 5 && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Camera')}
            activeOpacity={0.8}
            className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-3xl mb-3"
          >
            <View className="w-12 h-12 rounded-2xl bg-emerald/10 items-center justify-center mr-4">
              <Feather name="search" size={20} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm mb-1">Analyze {5 - checksCount} more products</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs leading-5">Builds your trade ledger to demonstrate compliance history.</Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        )}

        {!needsCac && checksCount >= 5 && (
          <View className="flex-row items-center bg-[#0a1a0a] border border-green-500/20 p-5 rounded-3xl mb-3">
            <View className="w-12 h-12 rounded-2xl bg-emerald/20 items-center justify-center mr-4">
              <Feather name="check-circle" size={20} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm mb-1">Profile Fully Optimized</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-xs leading-5">Your digital passport is ready for seamless global trade.</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};

export default ExportScoreScreen;
