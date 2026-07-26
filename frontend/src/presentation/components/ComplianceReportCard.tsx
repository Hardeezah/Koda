import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading, BodyText, FormLabel } from './Typography';

interface Risk {
  level: string;
  reason: string;
  action_required?: string;
}

interface ComplianceReportProps {
  status: string;
  risks: Risk[];
  summary: string;
}

const ComplianceReportCard = ({ status, risks, summary }: ComplianceReportProps) => {
  const isCompliant = status === 'compliant';

  return (
    <View className="my-3">
      <LinearGradient
        colors={isCompliant ? ['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)'] : ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
        className="rounded-2xl p-4 border border-white/10"
      >
        <View className="mb-4">
          <Heading className={isCompliant ? 'text-emerald' : 'text-destructive'}>
            {status.toUpperCase()}
          </Heading>
          <BodyText className="text-white/80 mt-1">{summary}</BodyText>
        </View>

        {risks.map((risk, index) => (
          <View key={index} className="flex-row mt-3 bg-white/5 rounded-xl p-3">
            <View className={`px-2 py-1 rounded-md h-6 justify-center ${risk.level === 'high' ? 'bg-destructive' : 'bg-amber-500'}`}>
              <FormLabel className="text-white text-[10px]">{risk.level.toUpperCase()}</FormLabel>
            </View>
            <View className="flex-1 ml-3">
              <BodyText className="text-white font-semibold">{risk.reason}</BodyText>
              {risk.action_required && (
                <BodyText className="text-primary text-xs mt-1">Action: {risk.action_required}</BodyText>
              )}
            </View>
          </View>
        ))}
      </LinearGradient>
    </View>
  );
};

export default ComplianceReportCard;
