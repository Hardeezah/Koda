import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading, BodyText, FormLabel } from '../../components/Typography';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import { supabase } from '../../../infrastructure/supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const CommunicationScreen = ({ route, navigation }: any) => {
  const { entry } = route.params;
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isDrafting, setIsDrafting] = useState(true);

  useEffect(() => {
    const draftEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token && entry.id) {
          const response = await fetch(
            `${API_URL}/api/v1/communication/draft?entry_id=${entry.id}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            },
          );

          if (response.ok) {
            const data = await response.json();
            setSubject(data.subject || '');
            setBody(data.body || data.message || '');
            setIsDrafting(false);
            return;
          }
        }

        // Fallback: generate locally if API unavailable
        setSubject(`Customs Clearance Request: ${entry.product}`);
        setBody(`Dear Customs Broker,\n\nPlease find attached the Form M for our upcoming import of ${entry.qty || ''} ${entry.product} (HS Code: ${entry.hs_code || entry.compliance?.suggested_hs_code || 'Pending'}).\n\nKindly advise on the next steps for PAAR generation.\n\nBest regards,\nKodaTrade User`);
        setIsDrafting(false);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Drafting Failed',
          text2: 'Could not generate AI email draft.',
        });
        setIsDrafting(false);
      }
    };
    draftEmail();
  }, [entry]);

  const handleSend = async () => {
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No email client found on this device.',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not open email client.',
      });
    }
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <View className="mb-8">
          <Heading className="text-3xl">Agent Communication</Heading>
          <BodyText className="text-primary mt-1">AI-Drafted Broker Request</BodyText>
        </View>

        <View className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-6">
          <View className="mb-5">
            <FormLabel className="mb-2">Subject</FormLabel>
            <TextInput
              className="bg-white/10 rounded-xl p-4 color-white font-inter"
              value={subject}
              onChangeText={setSubject}
              editable={!isDrafting}
            />
          </View>

          <View className="mb-6">
            <FormLabel className="mb-2">Message Body</FormLabel>
            <TextInput
              className="bg-white/10 rounded-xl p-4 color-white font-inter min-h-[150px]"
              value={isDrafting ? 'AI is drafting your message...' : body}
              onChangeText={setBody}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!isDrafting}
            />
          </View>

          <View className="bg-primary/10 p-3 rounded-lg mb-8 border border-primary/30">
            <BodyText className="text-primary text-sm">📎 Form_M_Draft.pdf attached</BodyText>
          </View>

          <Button
            title={isDrafting ? 'Drafting...' : 'Open Email Client'}
            onPress={handleSend}
            disabled={isDrafting}
            loading={isDrafting}
          />
        </View>
        
        <Button
          variant="secondary"
          title="Back to Preview"
          onPress={() => navigation.goBack()}
          className="border-none"
        />
      </ScrollView>
    </LinearGradient>
  );
};

export default CommunicationScreen;
