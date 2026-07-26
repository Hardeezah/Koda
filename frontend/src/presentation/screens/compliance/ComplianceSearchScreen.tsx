import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenLayout } from '../../components/ScreenLayout';
import { useTradeMode } from '../../../context/TradeModeContext';

// ── Mode-specific config ─────────────────────────────────────────────────────

const IMPORT_FILTERS = ['All', 'NAFDAC', 'SON', 'CBN', 'NCS', 'NSW', 'NAQS'];
const EXPORT_FILTERS = ['All', 'AfCFTA', 'NEPC', 'SON', 'CBN', 'Rules of Origin'];

const IMPORT_SUGGESTIONS = [
  { text: 'Is frozen fish on the 2026 prohibition list?', filter: 'NCS' },
  { text: 'NAFDAC registration for imported food products', filter: 'NAFDAC' },
  { text: 'CBN Form M requirements for 2026', filter: 'CBN' },
  { text: 'SONCAP certification process for electronics', filter: 'SON' },
  { text: 'Import duty rate for Lithium Ore', filter: 'NCS' },
  { text: 'NSW submission steps for containerised goods', filter: 'NSW' },
  { text: 'NAQS permit for plant products', filter: 'NAQS' },
];

const EXPORT_SUGGESTIONS = [
  { text: 'Does Ginger qualify for AfCFTA zero tariff?', filter: 'AfCFTA' },
  { text: 'Rules of Origin for leather footwear to South Africa', filter: 'Rules of Origin' },
  { text: 'NEPC export certificate — how to apply', filter: 'NEPC' },
  { text: 'AfCFTA tariff rate for Shea Butter to Ghana', filter: 'AfCFTA' },
  { text: 'CBN Form NXP requirements for exporters', filter: 'CBN' },
  { text: 'SON conformity certificate for manufactured exports', filter: 'SON' },
  { text: 'Certificate of Origin — issuing bodies in Nigeria', filter: 'Rules of Origin' },
];

const MODE_CONFIG = {
  import: {
    title: 'Import Compliance',
    placeholder: 'Search import regulations, HS codes, permits...',
    filters: IMPORT_FILTERS,
    suggestions: IMPORT_SUGGESTIONS,
    icon: 'download' as const,
    accentLabel: 'Import',
  },
  export: {
    title: 'Export & AfCFTA',
    placeholder: 'Search AfCFTA rules, export permits, corridors...',
    filters: EXPORT_FILTERS,
    suggestions: EXPORT_SUGGESTIONS,
    icon: 'upload' as const,
    accentLabel: 'Export',
  },
};

// ── Screen ───────────────────────────────────────────────────────────────────

const ComplianceSearchScreen = ({ navigation }: any) => {
  const { mode } = useTradeMode();
  const config = MODE_CONFIG[mode];

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Reset filter to 'All' when mode changes so stale filter isn't carried over
  useEffect(() => {
    setActiveFilter('All');
  }, [mode]);

  useEffect(() => {
    AsyncStorage.getItem('@recent_searches')
      .then((stored) => {
        if (stored) setRecentSearches(JSON.parse(stored));
      })
      .catch(console.error);
  }, []);

  const saveSearch = async (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated)).catch(console.error);
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) return;
    saveSearch(term.trim());
    // Pass the current trade mode so ComplianceResult knows which RAG to query
    navigation.navigate('ComplianceResult', {
      query: term.trim(),
      tradeMode: mode,
    });
  };

  const filteredSuggestions =
    activeFilter === 'All'
      ? config.suggestions
      : config.suggestions.filter((s) => s.filter === activeFilter);

  return (
    <ScreenLayout
      scrollable={false}
      onBackPress={() => navigation.goBack()}
      headerTitle={config.title}
    >
      {/* Mode context banner */}
      <View className="flex-row items-center gap-2 mb-4 px-1">
        <View className="w-5 h-5 rounded-full bg-white/5 items-center justify-center">
          <Feather name={config.icon} size={11} color="rgba(255,255,255,0.4)" />
        </View>
        <Text
          style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
          className="text-white/30 text-xs"
        >
          Showing{' '}
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white/50"
          >
            {config.accentLabel}
          </Text>{' '}
          regulations • Switch mode from the top bar
        </Text>
      </View>

      {/* Search input */}
      <View className="flex-row items-center bg-[#0d0d0d] rounded-2xl border border-white/5 px-4 h-14 mb-5">
        <Feather name="search" size={18} color="rgba(255,255,255,0.3)" />
        <TextInput
          className="flex-1 text-white ml-3 text-sm"
          style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
          placeholder={config.placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch(query)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 mx-[-24px]" showsVerticalScrollIndicator={false}>

        {/* Agency / category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-7"
          contentContainerStyle={{ alignItems: 'center', paddingRight: 24 }}
        >
          {config.filters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`mr-2 px-4 h-9 items-center justify-center rounded-full border ${activeFilter === f
                ? 'bg-emerald-500 border-emerald-500'
                : 'bg-white/5 border-white/10'
                }`}
            >
              <Text
                style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                className={`text-xs ${activeFilter === f ? 'text-black' : 'text-white/40'
                  }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <View className="px-6 mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className="text-white/40 text-[10px] uppercase tracking-widest"
              >
                Recent
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  setRecentSearches([]);
                  await AsyncStorage.removeItem('@recent_searches');
                }}
              >
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                  className="text-white/20 text-[10px]"
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {recentSearches.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => handleSearch(item)}
                  className="flex-row items-center gap-1.5 bg-white/5 px-3 py-2 rounded-xl border border-white/10"
                >
                  <Feather name="clock" size={10} color="rgba(255,255,255,0.3)" />
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                    className="text-white/50 text-xs"
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Suggestions */}
        <View className="px-6 pb-12">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className="text-white/40 text-[10px] mb-4 uppercase tracking-widest"
          >
            {activeFilter === 'All'
              ? `Common ${config.accentLabel} queries`
              : `${activeFilter} queries`}
          </Text>

          {filteredSuggestions.length === 0 ? (
            <View className="items-center py-8">
              <Feather name="search" size={28} color="rgba(255,255,255,0.08)" />
              <Text
                style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                className="text-white/20 text-xs mt-3"
              >
                No suggestions for this filter
              </Text>
            </View>
          ) : (
            filteredSuggestions.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSearch(item.text)}
                className="flex-row items-center justify-between bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl mb-2.5"
              >
                {/* Filter badge */}
                <View className="flex-row items-center flex-1 mr-3 gap-3">
                  <View className="bg-white/5 rounded-lg px-2 py-1">
                    <Text
                      style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                      className="text-white/30 text-[9px] uppercase tracking-wider"
                    >
                      {item.filter}
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
                    className="text-white/80 text-sm flex-1"
                  >
                    {item.text}
                  </Text>
                </View>
                <Feather name="arrow-right" size={15} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
};

export default ComplianceSearchScreen;