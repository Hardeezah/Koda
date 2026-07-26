import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useTradeMode } from '../../../context/TradeModeContext';
import { calculateScore } from '../../../utils/score';

const PERIODS = ['All', 'This Week', 'This Month'];

const LedgerScreen = ({ navigation }: any) => {
  const { mode: tradeMode } = useTradeMode();
  const [activePeriod, setActivePeriod] = useState('All');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // === Fetch Ledger Entries ===
      let ledgerQuery = supabase
        .from('ledger')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (activePeriod === 'This Week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        ledgerQuery = ledgerQuery.gte('created_at', weekAgo.toISOString());
      } else if (activePeriod === 'This Month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        ledgerQuery = ledgerQuery.gte('created_at', monthAgo.toISOString());
      }

      const { data: ledgerData, error: ledgerError } = await ledgerQuery;
      if (ledgerError) throw ledgerError;

      // === Fetch AfCFTA Checks (export only) ===
      let afcftaEntries: any[] = [];

      if (tradeMode === 'export') {
        let afcftaQuery = supabase
          .from('afcfta_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (activePeriod === 'This Week') {
          afcftaQuery = afcftaQuery.gte('created_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          );
        } else if (activePeriod === 'This Month') {
          const m = new Date();
          m.setMonth(m.getMonth() - 1);
          afcftaQuery = afcftaQuery.gte('created_at', m.toISOString());
        }

        const { data: afcftaData, error: afcftaErr } = await afcftaQuery;
        if (afcftaErr) console.error('AfCFTA fetch error', afcftaErr);

        afcftaEntries = (afcftaData || []).map((c: any) => ({
          ...c,
          type: 'afcfta',
        }));
      }

      // === Combine, filter by trade mode, sort ===
      const ledgerFiltered = (ledgerData || []).filter((item: any) => {
        const itemDirection = item.compliance_report?.direction || 'import';
        return itemDirection === tradeMode;
      });

      const combined = [...ledgerFiltered, ...afcftaEntries].sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(combined);

      // === Score Calculation ===
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, business_type, trade_type, primary_category, cac_number')
        .eq('id', user.id)
        .single();

      const totalEntries = ledgerFiltered.length;
      const compliantEntries = ledgerFiltered.filter(
        (e: any) => e.status === 'compliant'
      ).length;

      const { total } = calculateScore({
        profile,
        compliantEntries,
        totalEntries,
      });

      setScore(total);
    } catch (err) {
      console.error('Ledger fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'compliant':
        return { bg: 'bg-green-500/10', text: 'text-green-400', label: tradeMode === 'export' ? 'EXPORTABLE' : 'ALLOWED' };
      case 'non_compliant':
        return { bg: 'bg-red-500/10', text: 'text-red-400', label: 'PROHIBITED' };
      default:
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'REVIEW' };
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const renderItem = ({ item }: any) => {
    const isAfCFTA = item.type === 'afcfta';
    const direction = item.compliance_report?.direction || (isAfCFTA ? 'export' : 'import');
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        onPress={() => {
          if (isAfCFTA) {
            navigation.navigate('AfCFTAReport', { id: item.id });
          } else {
            navigation.navigate('HSResult', {
              result: {
                label: item.product_name,
                direction,
                complianceData: item.compliance_report
                  ? {
                    ...item.compliance_report,
                    status: item.status,
                    suggested_hs_code:
                      item.hs_code || item.compliance_report?.suggested_hs_code,
                  }
                  : null,
              },
            });
          }
        }}
        activeOpacity={0.7}
        className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-3xl mb-3"
      >
        {/* Icon */}
        <View className="w-12 h-12 rounded-2xl bg-white/5 items-center justify-center mr-4">
          <Feather
            name={isAfCFTA ? 'globe' : direction === 'export' ? 'upload' : 'download'}
            size={20}
            color="rgba(255,255,255,0.4)"
          />
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
              className="text-white text-sm flex-1"
              numberOfLines={1}
            >
              {item.product_name || (isAfCFTA ? 'AfCFTA Check' : 'Unknown Product')}
            </Text>
            {/* Direction badge */}
            <View
              className={`px-2 py-0.5 rounded-md ${isAfCFTA
                ? 'bg-blue-500/10'
                : direction === 'export'
                  ? 'bg-cyan-500/10'
                  : 'bg-purple-500/10'
                }`}
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className={`text-[9px] uppercase ${isAfCFTA
                  ? 'text-blue-400'
                  : direction === 'export'
                    ? 'text-cyan-400'
                    : 'text-purple-400'
                  }`}
              >
                {isAfCFTA ? 'AfCFTA' : direction}
              </Text>
            </View>
          </View>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
            className="text-white/30 text-xs"
          >
            {item.hs_code ? `HS ${item.hs_code} • ` : ''}{formatDate(item.created_at)}
          </Text>
        </View>

        {/* Status */}
        <View className={`ml-3 px-3 py-1 rounded-full ${statusStyle.bg}`}>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className={`text-[9px] ${statusStyle.text}`}
          >
            {statusStyle.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="items-center py-16">
      <Feather
        name={tradeMode === 'export' ? 'upload' : 'download'}
        size={36}
        color="rgba(255,255,255,0.06)"
      />
      <Text
        style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
        className="text-white/30 text-sm mt-4"
      >
        No {tradeMode} entries yet
      </Text>
      <Text
        style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
        className="text-white/20 text-xs mt-2 text-center px-10 leading-5"
      >
        {tradeMode === 'export'
          ? 'Scan a product in Export mode to check AfCFTA eligibility and required documents.'
          : 'Scan a product in Import mode to check Nigerian customs compliance and required permits.'}
      </Text>
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      fetchLedger();
    }, [activePeriod, tradeMode]) // ← re-fetch when period or trade mode changes
  );

  const isExport = tradeMode === 'export';

  return (
    <ScreenLayout scrollable={false} showGlow>

      {/* Readiness Score */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ExportScore')}
        className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-4 mb-6"
        activeOpacity={0.8}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center gap-1.5">
            <Feather
              name={isExport ? 'upload' : 'download'}
              size={10}
              color="rgba(255,255,255,0.3)"
            />
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
              className="text-white/40 text-[10px] uppercase tracking-widest"
            >
              {isExport ? 'Export' : 'Import'} Readiness Score
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white/50 text-[10px]"
          >
            {score} / 100
          </Text>
        </View>
        <View className="h-1 bg-white/5 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${score}%` }}
          />
        </View>
      </TouchableOpacity>

      {/* Header */}
      <View className="pb-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white text-3xl"
          >
            Trade Ledger
          </Text>
          {/* Mode indicator */}
          <View
            className={`px-3 py-1.5 rounded-full ${isExport ? 'bg-cyan-500/10' : 'bg-purple-500/10'}`}
          >
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
              className={`text-[10px] uppercase tracking-widest ${isExport ? 'text-cyan-400' : 'text-purple-400'}`}
            >
              {isExport ? '↑ Export' : '↓ Import'}
            </Text>
          </View>
        </View>

        {/* Period filter */}
        <View className="flex-row gap-2">
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setActivePeriod(period)}
              className={`px-4 py-2 rounded-xl border ${activePeriod === period
                ? 'bg-white/10 border-white/20'
                : 'bg-transparent border-white/5'
                }`}
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className={`text-xs ${activePeriod === period ? 'text-white' : 'text-white/40'}`}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.type || 'ledger'}-${item.id}`}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="mx-[-24px] px-6"
          ListEmptyComponent={renderEmpty}
        />
      )}
    </ScreenLayout>
  );
};

export default LedgerScreen;