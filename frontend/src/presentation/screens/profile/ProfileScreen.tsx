import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../infrastructure/supabase';
import { ScreenLayout } from '../../components/ScreenLayout';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

const SettingItem = ({ icon, label, sublabel, onPress, color = "white" }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="flex-row items-center bg-[#0d0d0d] border border-white/5 p-5 rounded-3xl mb-3"
  >
    <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center mr-4">
      <Feather name={icon} size={18} color={color === "white" ? "rgba(255,255,255,0.4)" : color} />
    </View>
    <View className="flex-1">
      <Text style={{ color, fontFamily: 'PlusJakartaSans_700Bold' }} className="text-sm">{label}</Text>
      {sublabel && <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/20 text-[10px] uppercase tracking-widest mt-1">{sublabel}</Text>}
    </View>
    <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.1)" />
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cacModalVisible, setCacModalVisible] = useState(false);

  // Edit State
  const [editData, setEditData] = useState({
    business_name: '',
    business_type: '',
    trade_type: '',
    primary_category: '',
  });
  const [cacNumber, setCacNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || '');
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setEditData({
          business_name: data.business_name || '',
          business_type: data.business_type || '',
          trade_type: data.trade_type || '',
          primary_category: data.primary_category || '',
        });
        setCacNumber(data.cac_number || '');
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@kodatrade.com?subject=KodaTrade Support Request');
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update(editData)
        .eq('id', user.id);

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'Profile Updated' });
      setEditModalVisible(false);
      fetchProfile();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveCac = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ cac_number: cacNumber })
        .eq('id', user.id);

      if (error) throw error;

      Toast.show({ type: 'success', text1: 'CAC Number Saved' });
      setCacModalVisible(false);
      fetchProfile();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Save Failed', text2: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout scrollable={true} showGlow={true}>
      <View className="items-center py-10">
         <View className="w-24 h-24 rounded-[32px] bg-emerald/10 border border-emerald/20 items-center justify-center mb-4">
            <Feather name="briefcase" size={32} color="#10b981" />
         </View>
         <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-2xl">{profile?.full_name || 'Trader'}</Text>
         {profile?.business_name && (
           <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-emerald text-sm mt-1">{profile.business_name}</Text>
         )}
         <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/40 text-sm mt-1">
           {profile?.business_type ? `${profile.business_type} • NG` : (email || 'No business type')}
         </Text>
         <TouchableOpacity 
           onPress={() => setEditModalVisible(true)}
           className="mt-4 px-6 py-2 rounded-full border border-white/10"
         >
            <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs">Edit Profile</Text>
         </TouchableOpacity>
      </View>

      <View className="mb-10">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-4 ml-2">Compliance & Verification</Text>
        <SettingItem 
          icon="hash" 
          label="CAC Number" 
          sublabel={profile?.cac_number ? `Verified: ${profile.cac_number}` : "Required for Form M"} 
          onPress={() => setCacModalVisible(true)} 
        />
        <SettingItem 
          icon="credit-card" 
          label="Subscription Plan" 
          sublabel="Free Plan" 
          onPress={() => {}} 
        />
      </View>

      <View className="mb-10">
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/40 text-[10px] uppercase tracking-widest mb-4 ml-2">Preferences</Text>
        <SettingItem 
          icon="bell" 
          label="Notifications" 
          onPress={() => {}} 
        />
        <SettingItem 
          icon="help-circle" 
          label="Help & Support" 
          onPress={handleSupport} 
        />
        <SettingItem 
          icon="book-open" 
          label="User Guide" 
          sublabel="Step-by-step instructions"
          onPress={() => navigation.navigate('Guide')} 
        />
      </View>

      <SettingItem 
        icon="log-out" 
        label="Sign Out" 
        color="#ef4444"
        onPress={handleSignOut} 
      />

      <View className="py-10 items-center">
         <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/10 text-[10px] uppercase tracking-widest">KodaTrade v0.1.0 (Alpha)</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/80">
          <View className="bg-[#0d0d0d] rounded-t-3xl border-t border-white/10 p-6 h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-xl">Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="w-8 h-8 items-center justify-center bg-white/5 rounded-full">
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 uppercase tracking-widest">Business Name</Text>
              <TextInput
                className="bg-black border border-white/10 rounded-2xl p-4 text-white font-inter mb-4"
                value={editData.business_name}
                onChangeText={(t) => setEditData({ ...editData, business_name: t })}
                placeholder="Enter business name"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 uppercase tracking-widest">Business Type</Text>
              <TextInput
                className="bg-black border border-white/10 rounded-2xl p-4 text-white font-inter mb-4"
                value={editData.business_type}
                onChangeText={(t) => setEditData({ ...editData, business_type: t })}
                placeholder="e.g. Sole Proprietorship, LLC"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 uppercase tracking-widest">Trade Type</Text>
              <TextInput
                className="bg-black border border-white/10 rounded-2xl p-4 text-white font-inter mb-4"
                value={editData.trade_type}
                onChangeText={(t) => setEditData({ ...editData, trade_type: t })}
                placeholder="e.g. Exporter, Importer"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white/60 text-xs mb-2 uppercase tracking-widest">Primary Category</Text>
              <TextInput
                className="bg-black border border-white/10 rounded-2xl p-4 text-white font-inter mb-6"
                value={editData.primary_category}
                onChangeText={(t) => setEditData({ ...editData, primary_category: t })}
                placeholder="e.g. Agriculture, Textiles"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />

              <Button title={saving ? "SAVING..." : "SAVE PROFILE"} onPress={saveProfile} loading={saving} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CAC Modal */}
      <Modal visible={cacModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/80">
          <View className="bg-[#0d0d0d] rounded-t-3xl border-t border-white/10 p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-white text-xl">CAC Verification</Text>
              <TouchableOpacity onPress={() => setCacModalVisible(false)} className="w-8 h-8 items-center justify-center bg-white/5 rounded-full">
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-white/60 text-sm mb-4">
              Enter your Corporate Affairs Commission (CAC) registration number. This is required for Form M processing.
            </Text>
            <TextInput
              className="bg-black border border-white/10 rounded-2xl p-4 text-white font-inter mb-6 text-xl text-center"
              value={cacNumber}
              onChangeText={setCacNumber}
              placeholder="RC-123456"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoCapitalize="characters"
            />
            <Button title={saving ? "VERIFYING..." : "VERIFY CAC"} onPress={saveCac} loading={saving} />
            <View className="h-8" />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenLayout>
  );
};

export default ProfileScreen;
