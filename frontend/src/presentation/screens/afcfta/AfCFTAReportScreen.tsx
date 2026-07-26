import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { supabase } from '../../../infrastructure/supabase';

export const AfCFTAReportScreen = ({ route }: any) => {
  const { id } = route.params;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('afcfta_checks').select('*').eq('id', id).single();
      if (!error) setReport(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" color="#10b981" />;

  return (
    <View className="p-6 bg-[#0d0d0d] flex-1">
      <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-2xl mb-4">
        AfCFTA Report
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        Product: {report.product_name}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        HS Code: {report.hs_code}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        Destination: {report.destination_country}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        Eligible: {report.eligible ? '✅ Yes' : '❌ No'}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        Tariff saving: {report.tariff_saving_percent}%
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 mb-2">
        RoO eligible: {report.roo_eligible ? '✅ Yes' : '❌ No'}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/80 mt-4">
        {report.explanation}
      </Text>
    </View>
  );
};
