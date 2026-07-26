import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { calculateScore } from '../../../utils/score';

const ExportScoreScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState({
    total: 0,
    compliancePoints: 0,
    profilePoints: 0,
    cacPoints: 0,
    ledgerPoints: 0,
    needsCac: false,
    checksCount: 0,
  });

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

      const { total, compliancePoints, profilePoints, cacPoints, ledgerPoints } = calculateScore({
        profile,
        compliantEntries,
        totalEntries,
      });

      setScoreData({
        total,
        compliancePoints,
        profilePoints,
        cacPoints,
        ledgerPoints,
        needsCac: !profile?.cac_number,
        checksCount: totalEntries,
      });

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

  if (loading) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Digital Trade Passport">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      scrollable={true}
      onBackPress={() => navigation.goBack()}
      headerTitle="Digital Trade Passport"
      bottomAction={
        <Button title="SHARE TRADE PASSPORT" onPress={() => {}} />
      }
    >
      <View className="items-center py-10">
        <View className="w-48 h-48 rounded-full border-8 border-white/5 items-center justify-center relative">
           <View 
             className="absolute inset-0 rounded-full border-8 border-emerald"
             style={{ 
               borderRightColor: scoreData.total < 25 ? 'transparent' : '#10b981',
               borderBottomColor: scoreData.total < 50 ? 'transparent' : '#10b981',
               borderLeftColor: scoreData.total < 75 ? 'transparent' : '#10b981',
               borderTopColor: scoreData.total === 100 ? '#10b981' : 'transparent',
               transform: [{ rotate: '-45deg' }]
             }} 
           />
           <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white text-6xl">{scoreData.total}</Text>
           <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-xs uppercase tracking-widest">Readiness</Text>
        </View>
      </View>

      <View className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 mb-8">
         <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-6 uppercase tracking-widest text-center">Score Breakdown</Text>
         
         <View className="flex-row justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 text-sm">Profile Completeness</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-sm">+{scoreData.profilePoints}</Text>
         </View>
         <View className="flex-row justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 text-sm">CAC Verification</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-sm">+{scoreData.cacPoints}</Text>
         </View>
         <View className="flex-row justify-between mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 text-sm">Trade Ledger Activity</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-sm">+{scoreData.ledgerPoints}</Text>
         </View>
         <View className="flex-row justify-between">
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 text-sm">Compliance Validations</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-sm">+{scoreData.compliancePoints}</Text>
         </View>
      </View>

      <View className="mb-10">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-6 uppercase tracking-widest">How to improve</Text>
        
        {scoreData.needsCac && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('ProfileTab')}
            className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-2xl mb-3"
          >
            <View className="w-10 h-10 rounded-xl bg-amber-500/20 items-center justify-center mr-4">
              <Feather name="file-plus" size={18} color="#f59e0b" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">Add CAC Number</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Required for full export verification</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        )}

        {scoreData.checksCount < 5 && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Camera')}
            className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-2xl mb-3"
          >
            <View className="w-10 h-10 rounded-xl bg-emerald/20 items-center justify-center mr-4">
              <Feather name="shield" size={18} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">Complete 5 Trade Entries</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">{5 - scoreData.checksCount} more to reach "Silver" status</Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        )}

        {!scoreData.needsCac && scoreData.checksCount >= 5 && (
          <View className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-2xl mb-3">
            <View className="w-10 h-10 rounded-xl bg-emerald/20 items-center justify-center mr-4">
              <Feather name="check-circle" size={18} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">You're doing great!</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">Keep up the good work</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenLayout>
  );
};

export default ExportScoreScreen;
