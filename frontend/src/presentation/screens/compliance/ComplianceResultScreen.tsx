import React, { useState, useEffect } from 'react';
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

import { useTradeMode } from '../../../context/TradeModeContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const ComplianceResultScreen = ({ navigation, route }: any) => {
  const { query, tradeMode } = route.params;
  const { mode } = useTradeMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`${API_URL}/api/v1/compliance/check`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_name: query,
            hs_code: null,
            direction: tradeMode || mode || 'import',
          }),
        });

        if (!response.ok) throw new Error('Compliance service unavailable');

        const data = await response.json();
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to check compliance');
      } finally {
        setLoading(false);
      }
    };

    fetchCompliance();
  }, [query]);

  const getVerdictColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10b981';
      case 'non_compliant': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const handleSaveToLedger = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && result) {
        await supabase.from('ledger').insert({
          profile_id: user.id,
          product_name: query,
          hs_code: result.suggested_hs_code || null,
          status: result.status,
          quantity: 0,
          value_usd: 0,
          unit: 'kg',
        });
      }
      navigation.navigate('Main', { screen: 'LedgerTab' });
    } catch (err) {
      console.error('Failed to save to ledger:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Compliance Verdict">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-sm mt-4">Analysing with AI...</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/20 text-xs mt-2">Checking Nigerian trade regulations</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !result) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Compliance Verdict">
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-lg mt-4 text-center">{error || 'Something went wrong'}</Text>
          <Button title="TRY AGAIN" onPress={() => { setLoading(true); setError(null); }} className="mt-8" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      scrollable={true}
      onBackPress={() => navigation.goBack()}
      headerTitle="Compliance Verdict"
      bottomAction={
        <Button
          title={saving ? "SAVING..." : "SAVE TO TRADE LEDGER"}
          onPress={handleSaveToLedger}
          loading={saving}
        />
      }
    >
      <View className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-8 mt-4">
         <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs italic">"{query}"</Text>
      </View>

      <View className="bg-[#0d0d0d] border border-white/5 p-6 rounded-3xl mb-8">
         <Text
           style={{ fontFamily: 'PlusJakartaSans_700Bold', color: getVerdictColor(result.status) }}
           className="text-xl mb-4 uppercase"
         >
           {result.status === 'compliant' ? 'COMPLIANT' : result.status === 'non_compliant' ? 'NON-COMPLIANT' : result.status.toUpperCase()}
         </Text>
         {result.suggested_hs_code && (
           <View className="bg-white/5 rounded-xl p-3 mb-4">
             <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs uppercase tracking-widest">Suggested HS Code</Text>
             <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white text-2xl mt-1">{result.suggested_hs_code}</Text>
           </View>
         )}
         <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 leading-7 text-base">
           {result.summary}
         </Text>
      </View>

      {result.risks && result.risks.length > 0 && (
        <View className="mb-10">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-4 uppercase tracking-widest">Risk Assessment</Text>
          {result.risks.map((risk: any, i: number) => (
            <View key={i} className="bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl mb-2">
              <View className="flex-row items-center mb-2">
                <View className={`w-2 h-2 rounded-full mr-2 ${risk.level === 'high' ? 'bg-red-500' : risk.level === 'medium' ? 'bg-amber-500' : 'bg-emerald'}`} />
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm uppercase">{risk.level} Risk</Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-sm leading-5">{risk.reason}</Text>
              {risk.action_required && (
                <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-emerald text-xs mt-2">{risk.action_required}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
};

export default ComplianceResultScreen;
