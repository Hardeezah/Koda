import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenLayout } from '../../components/ScreenLayout';
import { supabase } from '../../../infrastructure/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useTradeMode } from '../../../context/TradeModeContext';
import { calculateScore } from '../../../utils/score';

// ── Mode-specific dashboard config ───────────────────────────────────────────

const IMPORT_ACTIONS = [
  { icon: 'maximize', label: 'Scan Product', color: '#00d2ff', screen: 'Scan' },
  { icon: 'shield', label: 'Import Check', color: '#10b981', screen: 'ComplianceSearch' },
  { icon: 'book', label: 'Trade Ledger', color: '#f59e0b', screen: 'LedgerTab' },
  { icon: 'trending-up', label: 'My Score', color: '#8b5cf6', screen: 'ExportScore' },
];

const EXPORT_ACTIONS = [
  { icon: 'maximize', label: 'Scan Product', color: '#00d2ff', screen: 'Scan' },
  { icon: 'globe', label: 'AfCFTA Check', color: '#10b981', screen: 'ComplianceSearch' },
  { icon: 'book', label: 'Trade Ledger', color: '#f59e0b', screen: 'LedgerTab' },
  { icon: 'trending-up', label: 'My Score', color: '#8b5cf6', screen: 'ExportScore' },
];

const MODE_CONFIG = {
  import: {
    actions: IMPORT_ACTIONS,
    scoreLabel: 'Import Readiness',
    activityEmpty: 'Scan or check an import to create your first entry.',
    greetingSub: 'Your import compliance dashboard',
    accentColor: '#10b981',
  },
  export: {
    actions: EXPORT_ACTIONS,
    scoreLabel: 'Export Readiness',
    activityEmpty: 'Run an AfCFTA check or scan an export to get started.',
    greetingSub: 'Your AfCFTA & export dashboard',
    accentColor: '#10b981',
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const QuickAction = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 w-[48%] mb-4"
    activeOpacity={0.7}
  >
    <View
      className="w-10 h-10 rounded-2xl items-center justify-center mb-4 bg-white/5 border border-white/10"
    >
      <Feather name={icon} size={18} color={color} />
    </View>
    <Text
      style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
      className="text-white text-sm leading-tight"
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'compliant':
      return { bg: 'bg-emerald-500/10', text: 'text-green-700', label: 'ALLOWED' };
    case 'non_compliant':
      return { bg: 'bg-red-500/10', text: 'text-red-500', label: 'PROHIBITED' };
    default:
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'DRAFT' };
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });

// ── Screen ───────────────────────────────────────────────────────────────────

const DashboardScreen = ({ navigation }: any) => {
  const { mode } = useTradeMode();
  const config = MODE_CONFIG[mode];

  const [profile, setProfile] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [score, setScore] = useState(0);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Recent entries — for export mode pull AfCFTA checks too
      const { data: ledgerData } = await supabase
        .from('ledger')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(mode === 'import' ? 3 : 2);

      let recent = ledgerData || [];

      if (mode === 'export') {
        const { data: afcftaData } = await supabase
          .from('afcfta_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        const normalised = (afcftaData || []).map((c: any) => ({
          ...c,
          type: 'afcfta',
          product_name: c.product_description || 'AfCFTA Check',
          status: c.roo_eligible ? 'compliant' : 'review',
        }));

        recent = [...recent, ...normalised]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
      }

      setRecentEntries(recent);

      // Score
      const totalEntries = ledgerData?.length || 0;
      const compliantEntries = (ledgerData || []).filter(
        (e: any) => e.status === 'compliant'
      ).length;

      const { total } = calculateScore({
        profile: profileData,
        compliantEntries,
        totalEntries,
      });

      setScore(total);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [mode]) // re-fetch when mode switches
  );

  return (
    <ScreenLayout scrollable showGlow showTradeToggle>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View className="flex-row justify-between items-center pb-6">
        <View>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white/40 text-[10px] uppercase tracking-widest mb-1"
          >
            {config.greetingSub}
          </Text>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white text-2xl"
          >
            {profile?.business_name || profile?.full_name || 'Trade Partner'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileTab')}
          className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 items-center justify-center"
        >
          <Feather name="user" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* ── Quick actions — changes per mode ───────────────────────────── */}
      <View className="flex-row flex-wrap justify-between mt-2">
        {config.actions.map((action) => (
          <QuickAction
            key={action.label}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={() =>
              action.screen === 'LedgerTab'
                ? navigation.navigate('LedgerTab')
                : navigation.navigate(action.screen)
            }
          />
        ))}
      </View>

      {/* ── Score card ─────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ExportScore')}
        className="mt-2 bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 overflow-hidden"
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(16,185,129,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-2">
            <Feather
              name={mode === 'export' ? 'upload' : 'download'}
              size={12}
              color="rgba(255,255,255,0.3)"
            />
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
              className="text-white/40 text-[10px] uppercase tracking-widest"
            >
              {config.scoreLabel}
            </Text>
          </View>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-green-700 text-sm"
          >
            {score} / 100
          </Text>
        </View>
        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${score}%` }}
          />
        </View>
      </TouchableOpacity>

      {/* ── Recent activity ─────────────────────────────────────────────── */}
      <View className="mt-9 mb-6">
        <View className="flex-row justify-between items-center mb-5">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white text-base"
          >
            Recent Activity
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('LedgerTab')}>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
              className="text-green-700 text-sm"
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentEntries.length === 0 ? (
          <View className="items-center py-6 bg-[#0d0d0d] border border-white/5 rounded-2xl">
            <Feather name="inbox" size={28} color="rgba(255,255,255,0.08)" />
            <Text
              style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
              className="text-white/30 text-sm mt-3"
            >
              No recent activity yet
            </Text>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
              className="text-white/20 text-xs text-center mt-1 px-8"
            >
              {config.activityEmpty}
            </Text>
          </View>
        ) : (
          recentEntries.map((item) => {
            const isAfCFTA = item.type === 'afcfta';
            const statusStyle = getStatusStyle(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  isAfCFTA
                    ? navigation.navigate('AfCFTAReport', { id: item.id })
                    : navigation.navigate('HSResult', {
                      result: { label: item.product_name, complianceData: null },
                    })
                }
                className="flex-row items-center bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 mb-2.5"
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-xl bg-white/5 items-center justify-center mr-3">
                  <Feather
                    name={isAfCFTA ? 'globe' : 'box'}
                    size={16}
                    color="rgba(255,255,255,0.35)"
                  />
                </View>
                <View className="flex-1">
                  {/* Direction micro-badge */}
                  <View className="flex-row items-center gap-1.5 mb-1">
                    <View className={`px-1.5 py-0.5 rounded-full ${isAfCFTA ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                      <Text
                        style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                        className={`text-[8px] uppercase tracking-wider ${isAfCFTA ? 'text-blue-400' : 'text-white/25'}`}
                      >
                        {isAfCFTA ? 'Export' : 'Import'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                    className="text-white text-sm"
                    numberOfLines={1}
                  >
                    {item.product_name}
                  </Text>
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                    className="text-white/30 text-xs mt-0.5"
                  >
                    {formatDate(item.created_at)}
                    {item.hs_code ? ` \u2022 HS ${item.hs_code}` : ''}
                    {isAfCFTA && item.destination_country
                      ? ` \u2022 ${item.destination_country}`
                      : ''}
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-lg ml-2 ${statusStyle.bg}`}>
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                    className={`text-[9px] ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScreenLayout>
  );
};

export default DashboardScreen;