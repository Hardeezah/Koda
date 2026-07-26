import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { supabase } from '../../../infrastructure/supabase';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/Button';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Fields each document code requires from the profile
const DOCUMENT_REQUIRED_FIELDS: Record<string, { field: string; label: string }[]> = {
  FORM_M: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  PAAR: [{ field: 'business_name', label: 'Business Name' }],
  NAFDAC: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  SON_MANCAP: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  NAQS: [{ field: 'business_name', label: 'Business Name' }],
  NESREA: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  CCD: [{ field: 'business_name', label: 'Business Name' }],
  COO: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  NXP: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  NEPC: [{ field: 'business_name', label: 'Business Name' }, { field: 'cac_number', label: 'CAC Number' }],
  PHYTO: [{ field: 'business_name', label: 'Business Name' }],
};

const agencyFromCode = (code: string) => {
  const map: Record<string, string> = {
    FORM_M: 'Central Bank of Nigeria (CBN)',
    PAAR: 'Nigeria Customs Service',
    NAFDAC: 'National Agency for Food and Drug Administration and Control',
    SON_MANCAP: 'Standards Organisation of Nigeria (SON)',
    NAQS: 'National Agricultural Quarantine Service',
    NESREA: 'National Environmental Standards and Regulations Enforcement Agency',
    CCD: 'Nigeria Customs Service',
    COO: 'Nigerian Export Promotion Council (NEPC)',
    NXP: 'Central Bank of Nigeria (CBN)',
    NEPC: 'Nigerian Export Promotion Council (NEPC)',
    PHYTO: 'Federal Department of Agriculture and Rural Development',
  };
  return map[code] || 'Relevant Government Agency';
};

const todayFormatted = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const normaliseDocument = (raw: any, productName: string) => {
  // Already correct shape
  if (raw.document_title && Array.isArray(raw.sections)) {
    return injectDateAndSignature(raw);
  }

  // Flat content — convert to sections
  const content: string = raw.content || '';
  const chunks = content.split(/\n(?=[A-Z][A-Z\s]+\n|[A-Z][A-Z\s]+:)/);
  const sections: any[] = [];

  if (chunks.length <= 1) {
    // No clear section breaks — split on double newlines
    const blocks = content.split(/\n\n+/).filter(Boolean);
    blocks.forEach((block, i) => {
      const lines = block.trim().split('\n');
      sections.push({
        title: lines[0].replace(/:$/, '').trim() || `Section ${i + 1}`,
        content: lines.slice(1).join('\n').trim() || lines[0],
      });
    });
  } else {
    chunks.forEach((chunk, i) => {
      const lines = chunk.trim().split('\n').filter(Boolean);
      if (!lines.length) return;
      sections.push({
        title: lines[0].replace(/:$/, '').trim() || `Section ${i + 1}`,
        content: lines.slice(1).join('\n').trim() || lines[0],
      });
    });
  }

  const structured = {
    document_title: raw.document_name || raw.document_code || 'Document Draft',
    document_code: raw.document_code,
    agency: agencyFromCode(raw.document_code),
    agency_address: null,
    purpose: `This ${raw.document_name || raw.document_code} is required for the ${raw.direction || 'import'} of ${productName} in Nigeria.`,
    sections,
    cover_letter: buildCoverLetter(raw.document_name || raw.document_code, agencyFromCode(raw.document_code), productName),
    submission_steps: [
      'Fill in all fields marked [PLACEHOLDER] with your actual business details.',
      'Gather all documents listed in the checklist below.',
      'Visit your bank\'s trade finance desk (for CBN documents) or go directly to the relevant agency.',
      'Submit the completed form along with all supporting documents.',
      'Collect your stamped acknowledgement receipt and keep a copy.',
      'Follow up after the stated processing period if you have not received a response.',
    ],
    supporting_documents_checklist: [
      { item: 'Valid Government-Issued ID', description: 'National ID, International Passport, or Driver\'s License of the business owner or authorised signatory.', mandatory: true },
      { item: 'CAC Certificate of Incorporation', description: 'Proof of business registration with the Corporate Affairs Commission.', mandatory: true },
      { item: 'Commercial Invoice', description: 'Invoice from your supplier or buyer showing product details, quantity, and value.', mandatory: true },
      { item: 'Packing List', description: 'Itemised list of goods in the shipment with weight and dimensions.', mandatory: true },
      { item: 'Bill of Lading / Airway Bill', description: 'Shipping document issued by the carrier confirming receipt of goods for shipment.', mandatory: true },
    ],
    important_notes: `This is a KodaTrade-generated draft for ${productName}. Review all details before submission. Fields marked [PLACEHOLDER] must be completed by you. Date shown is the date of generation.`,
    estimated_processing: raw.estimated_processing || '5–15 business days',
    estimated_cost: raw.estimated_cost || 'Varies — confirm with issuing agency',
  };

  return injectDateAndSignature(structured);
};

const injectDateAndSignature = (doc: any) => {
  const today = todayFormatted();
  // Replace any date placeholders with today's date
  const injectIntoSections = (sections: any[]) =>
    sections.map((s: any) => ({
      ...s,
      content: s.content
        .replace(/\[DATE\]/gi, today)
        .replace(/Date:\s*Not Available/gi, `Date: ${today}`)
        .replace(/Date:\s*_+/gi, `Date: ${today}`)
        .replace(/Date:\s*\[.*?\]/gi, `Date: ${today}`),
    }));

  return {
    ...doc,
    sections: injectIntoSections(doc.sections || []),
    cover_letter: doc.cover_letter
      ? doc.cover_letter
        .replace(/\[DATE\]/gi, today)
        .replace(/\[TODAY'S DATE\]/gi, today)
      : doc.cover_letter,
    generated_date: today,
  };
};

const buildCoverLetter = (documentName: string, agency: string, productName: string) => {
  const today = todayFormatted();
  return `[YOUR BUSINESS NAME]
[YOUR BUSINESS ADDRESS]
[CITY, STATE, NIGERIA]
[YOUR PHONE NUMBER]
[YOUR EMAIL ADDRESS]

${today}

The Director/Manager
${agency}
[AGENCY ADDRESS]

Dear Sir/Madam,

RE: APPLICATION FOR ${documentName?.toUpperCase()} — ${productName?.toUpperCase()}

I write on behalf of [YOUR BUSINESS NAME] (CAC Registration No: [CAC NUMBER]) to formally submit our application for the above-referenced document in connection with the importation/exportation of ${productName} (HS Code: [HS CODE]).

Our company is duly registered under the laws of the Federal Republic of Nigeria and has been engaged in lawful trade activities. We hereby declare that all information provided in the attached documents is true, accurate, and complete to the best of our knowledge and belief.

We respectfully request the prompt processing of this application. We remain available to provide any additional information or documentation that may be required for this purpose.

Please find attached all required supporting documents for your review and necessary action.

Yours faithfully,

_______________________________
[AUTHORISED SIGNATORY NAME]
[DESIGNATION / TITLE]
[YOUR BUSINESS NAME]
${today}`;
};

interface ComplianceCardProps {
  item: any;
  productName: string;
  hsCode?: string;
  direction: string;
  navigation: any;
}

export const ComplianceCard = ({
  item,
  productName,
  hsCode,
  direction,
  navigation,
}: ComplianceCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);

  const validateProfile = (profile: any, documentCode: string): string[] => {
    const required = DOCUMENT_REQUIRED_FIELDS[documentCode] || [{ field: 'business_name', label: 'Business Name' }];
    return required
      .filter(r => !profile[r.field])
      .map(r => r.label);
  };

  const handleGenerateDocument = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, business_type, cac_number, phone, email')
        .eq('id', user.id)
        .single();

      if (profileError) console.warn('Profile fetch warning:', profileError.message);
      const profile: { business_name?: string; cac_number?: string } = profileData || {};

      // Check for missing required fields
      const missingFields = validateProfile(profile, item.code);
      if (missingFields.length > 0) {
        Toast.show({
          type: 'info',
          text1: 'Profile Incomplete',
          text2: `Please add your ${missingFields.join(' and ')} in Profile to generate this document.`,
          visibilityTime: 4000,
        });
        setGenerating(false);
        return;
      }

      const payload = {
        document_code: item.code,
        document_name: item.name,
        product_name: productName,
        hs_code: hsCode || null,
        direction,
        business_name: profile.business_name || null,
        cac_number: profile.cac_number || null,
      };

      console.log('Sending to generate_document:', payload);

      const response = await fetch(`${API_URL}/api/v1/compliance/generate_document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('generate_document error:', errorText);
        throw new Error(`Server error (${response.status})`);
      }

      const documentData = await response.json();
      console.log('Raw document keys:', Object.keys(documentData));

      // Always normalise — handles both flat and structured responses
      const normalisedDocument = normaliseDocument(documentData, productName);

      navigation.navigate('DocumentDraft', {
        document: normalisedDocument,
        productName,
        complianceItem: item,
      });

    } catch (err: any) {
      console.error('handleGenerateDocument failed:', err);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: err.message || 'Could not generate document.',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
      className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 mb-3"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            {item.is_critical && (
              <View className="bg-red-500/10 px-2 py-0.5 rounded-md">
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-red-400 text-[9px] uppercase">
                  Required
                </Text>
              </View>
            )}
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/30 text-[9px] uppercase tracking-widest">
              {item.agency_short}
            </Text>
          </View>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">
            {item.name}
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(255,255,255,0.3)"
        />
      </View>

      {expanded && (
        <View className="mt-4 pt-4 border-t border-white/5">
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-sm leading-6 mb-4">
            {item.description}
          </Text>

          <View className="bg-white/3 rounded-2xl p-4 mb-4">
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/30 text-[9px] uppercase tracking-widest mb-2">
              Procedure
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/70 text-sm leading-6">
              {item.how_to_obtain}
            </Text>
          </View>

          <View className="flex-row gap-3 mb-5">
            {item.processing_time && (
              <View className="flex-1 bg-white/3 rounded-2xl p-3">
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/30 text-[9px] uppercase mb-1">
                  Timeline
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-xs">
                  {item.processing_time}
                </Text>
              </View>
            )}
            {item.cost_estimate && (
              <View className="flex-1 bg-white/3 rounded-2xl p-3">
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/30 text-[9px] uppercase mb-1">
                  Cost
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-xs">
                  {item.cost_estimate}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleGenerateDocument}
            disabled={generating}
            className="bg-emerald-500/10 border border-green-500/20 rounded-2xl p-4 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#10b981" />
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-green-400 text-sm ml-3">
                  Drafting document...
                </Text>
              </>
            ) : (
              <>
                <Feather name="file-text" size={16} color="#10b981" />
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-green-400 text-sm ml-2">
                  Draft This Document
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/20 text-[10px] text-center mt-2">
            KodaTrade drafts this using your business profile. Complete your profile first for best results.
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const HSResultScreen = ({ navigation, route }: any) => {
  const { result } = route.params || {};
  const direction = result?.direction || result?.complianceData?.direction || 'import';

  const [loading, setLoading] = useState(!result?.complianceData);
  const [saving, setSaving] = useState(false);
  const [complianceData, setComplianceData] = useState<any>(result?.complianceData || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complianceData) return;
    const fetchCompliance = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/compliance/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_name: result?.label,
            hs_code: null,
            direction,
          }),
        });
        if (!response.ok) throw new Error('Compliance check unavailable');
        const data = await response.json();
        setComplianceData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to analyze product');
      } finally {
        setLoading(false);
      }
    };
    fetchCompliance();
  }, []);

  const handleSaveToLedger = async () => {
    if (!complianceData) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const productName = complianceData.product_name || result?.label || 'Unknown Product';

      const { error: dbError } = await supabase.from('ledger').insert({
        profile_id: user.id,
        product_name: productName,
        hs_code: complianceData.suggested_hs_code || null,
        status: complianceData.status || 'under_review',
        quantity: 0,
        value_usd: 0,
        unit: 'kg',
        compliance_report: {
          ...complianceData,
          direction,
          product_name: productName,
        },
      });

      if (dbError) throw dbError;

      Toast.show({ type: 'success', text1: 'Saved to Ledger' });
      navigation.navigate('Main', { screen: 'LedgerTab' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Save Failed', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10b981';
      case 'non_compliant': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusLabel = (status: string) => {
    if (complianceData?.prohibited) return 'PROHIBITED';
    switch (status) {
      case 'compliant': return direction === 'export' ? 'EXPORTABLE' : 'ALLOWED';
      case 'non_compliant': return 'NOT ALLOWED';
      default: return 'UNDER REVIEW';
    }
  };

  if (loading) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Analysis Result">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-sm mt-4">
            Running {direction} compliance check...
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  if (error || !complianceData) {
    return (
      <ScreenLayout scrollable={false} onBackPress={() => navigation.goBack()} headerTitle="Analysis Result">
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-lg mt-4 text-center">
            {error || 'Analysis failed'}
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  const statusColor = getStatusColor(complianceData.status);
  const statusLabel = getStatusLabel(complianceData.status);
  const productName = complianceData.product_name || result?.label || 'Product';
  const isExport = direction === 'export';

  return (
    <ScreenLayout
      scrollable={true}
      onBackPress={() => navigation.goBack()}
      headerTitle={isExport ? 'Export Analysis' : 'Import Analysis'}
      bottomAction={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title={saving ? 'SAVING...' : 'SAVE TO LEDGER'}
              onPress={handleSaveToLedger}
              loading={saving}
            />
          </View>
          <TouchableOpacity
            className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl items-center justify-center"
            onPress={() => navigation.navigate('Communication', { entry: { product: productName, qty: '', compliance: complianceData } })}
          >
            <Feather name="message-circle" size={20} color="white" />
          </TouchableOpacity>
        </View>
      }
    >
      {/* Direction badge + Product name */}
      <View className="items-center mt-4 mb-6">
        <View className={`px-3 py-1 rounded-full mb-3 ${isExport ? 'bg-cyan-500/10' : 'bg-purple-500/10'}`}>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
            className={`text-[10px] uppercase tracking-widest ${isExport ? 'text-cyan-400' : 'text-purple-400'}`}
          >
            {isExport ? 'Export Analysis' : 'Import Analysis'}
          </Text>
        </View>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-2xl text-center">
          {productName}
        </Text>
        {complianceData.suggested_hs_code && (
          <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white/30 text-sm mt-1">
            HS {complianceData.suggested_hs_code}
          </Text>
        )}
      </View>

      {/* Status badge */}
      <View
        style={{ backgroundColor: `${statusColor}15`, borderColor: `${statusColor}40` }}
        className="border self-center px-8 py-3 rounded-full mb-8"
      >
        <Text style={{ color: statusColor, fontFamily: 'PlusJakartaSans_700Bold' }} className="uppercase tracking-[2px] text-sm">
          {statusLabel}
        </Text>
      </View>

      {/* Export: AfCFTA eligibility block */}
      {isExport && (
        <View className="mb-8 p-5 bg-[#0a1a2a] border border-cyan-500/20 rounded-3xl">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-cyan-300 text-xs uppercase tracking-widest mb-4">
            AfCFTA Eligibility
          </Text>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-white/3 rounded-2xl p-3 items-center">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className={`text-lg ${complianceData.afcfta_eligible ? 'text-white/80' : 'text-red-400'}`}>
                {complianceData.afcfta_eligible ? 'Eligible' : 'Not Eligible'}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-[10px] mt-1">AfCFTA Status</Text>
            </View>
            {complianceData.tariff_saving_percent !== undefined && (
              <View className="flex-1 bg-white/3 rounded-2xl p-3 items-center">
                <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-cyan-400 text-lg">
                  {complianceData.tariff_saving_percent}%
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-[10px] mt-1">Tariff Saving</Text>
              </View>
            )}
            <View className="flex-1 bg-white/3 rounded-2xl p-3 items-center">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className={`text-lg ${complianceData.roo_eligible ? 'text-white/80' : 'text-red-400'}`}>
                {complianceData.roo_eligible ? 'Meets' : 'Review'}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-[10px] mt-1">Rules of Origin</Text>
            </View>
          </View>
          {complianceData.roo_type && (
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-xs">
              Rules of Origin type: {complianceData.roo_type}
            </Text>
          )}
        </View>
      )}

      {/* Import: duty info block */}
      {!isExport && complianceData.import_duty_percent !== undefined && (
        <View className="mb-8 flex-row gap-3">
          <View className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 items-center">
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white text-xl">
              {complianceData.import_duty_percent}%
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-xs mt-1">Import Duty</Text>
          </View>
          <View className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-2xl p-4 items-center">
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold' }} className="text-white text-xl">7.5%</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-xs mt-1">VAT</Text>
          </View>
          {complianceData.prohibited && (
            <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 items-center justify-center">
              <Feather name="x-circle" size={20} color="#ef4444" />
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-red-400 text-xs mt-1 text-center">Prohibited</Text>
            </View>
          )}
        </View>
      )}

      {/* Summary */}
      <View className="mb-8">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
          What This Means
        </Text>
        <View className="bg-[#0d0d0d] border border-white/5 p-5 rounded-3xl">
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/70 leading-6 text-sm">
            {complianceData.summary}
          </Text>
        </View>
      </View>

      {/* What to do — step by step */}
      {complianceData.what_to_do && (
        <View className="mb-8">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
            What You Need To Do
          </Text>
          <View className="bg-[#0a1a0a] border border-green-500/20 p-5 rounded-3xl">
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/70 leading-7 text-sm">
              {complianceData.what_to_do}
            </Text>
          </View>
        </View>
      )}

      {/* Required documents / compliance items */}
      {complianceData.compliance_items?.length > 0 && (
        <View className="mb-8">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
            {isExport ? 'Export Documents Required' : 'Import Documents Required'}
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-xs mb-4">
            Tap each document to see how to obtain it.
          </Text>
          {complianceData.compliance_items.map((item: any, i: number) => (
            <ComplianceCard
              key={item.code || i}
              item={item}
              productName={productName}
              hsCode={complianceData.suggested_hs_code}
              direction={direction}
              navigation={navigation}
            />
          ))}
        </View>
      )}

      {/* Risk assessment */}
      {complianceData.risks?.length > 0 && (
        <View className="mb-8">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-3">
            Risk Assessment
          </Text>
          {complianceData.risks.map((risk: any, i: number) => (
            <View key={i} className="flex-row items-start bg-[#0d0d0d] border border-white/5 p-4 rounded-2xl mb-2">
              <View className={`w-2.5 h-2.5 rounded-full mt-1.5 mr-3 flex-shrink-0 ${risk.level === 'high' ? 'bg-red-500' : risk.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              <View className="flex-1">
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">{risk.reason}</Text>
                {risk.action_required && (
                  <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-xs mt-1.5 leading-5">
                    → {risk.action_required}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Ask a question prompt */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Communication', { entry: { product: productName, qty: '', compliance: complianceData } })}
        className="mb-10 bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 flex-row items-center"
      >
        <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center mr-4">
          <Feather name="message-circle" size={18} color="rgba(255,255,255,0.4)" />
        </View>
        <View className="flex-1">
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-sm">Have a question?</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/30 text-xs mt-0.5">
            Ask about this product's compliance, documents, or next steps
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
      </TouchableOpacity>
    </ScreenLayout>
  );
};

export default HSResultScreen;