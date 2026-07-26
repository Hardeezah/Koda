'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  User, 
  Building2, 
  Building, 
  MapPin, 
  FileCheck2, 
  ShieldCheck, 
  Loader2, 
  Save, 
  Check, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';

export default function TraderProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile forms
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [tradeType, setTradeType] = useState('both');
  const [primaryCategory, setPrimaryCategory] = useState('');

  // Score computation checklist
  const [score, setScore] = useState(0);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is standard single row empty error code
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setBusinessName(data.business_name || '');
        setBusinessAddress(data.business_address || '');
        setCacNumber(data.cac_number || '');
        setBusinessType(data.business_type || '');
        setTradeType(data.trade_type || 'both');
        setPrimaryCategory(data.primary_category || '');
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Compute profile completeness score dynamically
  useEffect(() => {
    let computed = 10; // baseline
    if (fullName) computed += 5;
    if (businessName) computed += 15;
    if (businessAddress) computed += 10;
    if (businessType) computed += 10;
    if (tradeType) computed += 10;
    if (primaryCategory) computed += 10;
    if (cacNumber) computed += 30; // CAC verification represents highest completeness

    setScore(Math.min(computed, 100));
  }, [fullName, businessName, businessAddress, businessType, tradeType, primaryCategory, cacNumber]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session not discovered.');

      const record = {
        id: user.id,
        full_name: fullName || null,
        business_name: businessName || null,
        business_address: businessAddress || null,
        cac_number: cacNumber || null,
        business_type: businessType || null,
        trade_type: tradeType || null,
        primary_category: primaryCategory || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(record);

      if (error) throw error;
      setSuccessMsg('Trader Passport updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-brand-cyan">Verified Trader Credentials</span>
        <h1 className="font-space text-3xl font-bold text-white mt-1">Koda Passport</h1>
        <p className="text-xs text-slate-500 mt-1 font-jakarta font-medium">Link official corporate details to automate Form declaration details and elevate readiness levels.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Main profile forms */}
        <div className="lg:col-span-2 bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 self-start">
          <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Building className="w-4 h-4 text-brand-cyan" /> Business Identity Details
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Contact Name</label>
                <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    required
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Registered Company Name</label>
                <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                    placeholder="e.g. Koda Trade Ltd"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              
              {/* CAC Number */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">CAC Registration Number</label>
                <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                  <FileCheck2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                    placeholder="e.g. RC-1234567"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Registered Entity Type</label>
                <select
                  className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white transition-colors"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="">Select type...</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Distributor/Supplier">Distributor / Supplier</option>
                  <option value="Agro-Processor">Agro-Processor / Exporter</option>
                  <option value="Logistics/Agent">Logistics Broker / Clearing Agent</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Trade Type */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Trade Direction Role</label>
                <select
                  className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white transition-colors"
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                >
                  <option value="import">Importer (Into Nigeria)</option>
                  <option value="export">Exporter (From Nigeria)</option>
                  <option value="both">Both Importer and Exporter</option>
                </select>
              </div>

              {/* Primary Category */}
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Primary Trade Category</label>
                <select
                  className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white transition-colors"
                  value={primaryCategory}
                  onChange={(e) => setPrimaryCategory(e.target.value)}
                >
                  <option value="">Select commodity...</option>
                  <option value="Agricultural Produce">Agricultural Produce (Cocoa, Ginger, Nuts)</option>
                  <option value="Textiles & Apparel">Textiles &amp; African Apparel</option>
                  <option value="Chemicals & Plastics">Chemicals &amp; Petrochemicals</option>
                  <option value="Manufactured Products">Manufactured consumer goods</option>
                </select>
              </div>
            </div>

            {/* Corporate Location */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Corporate Address</label>
              <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-16">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                <textarea
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0 resize-none h-10 mt-2"
                  placeholder="Street details, City, State, Nigeria"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl p-4">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-xs rounded-2xl p-4 flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/5 mt-4"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Passport...
                </>
              ) : (
                <>
                  Save Trader Passport <Save className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Scoring checklist panel */}
        <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 self-start">
          <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <TrendingUp className="w-4 h-4 text-brand-cyan" /> Passport Completeness
          </h3>

          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Completeness Level</span>
              <span className="text-xl font-bold font-space text-white">{score}% Complete</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Completeness Checklist</h4>
            
            <div className="space-y-3 font-jakarta text-xs text-slate-500">
              <div className="flex items-center justify-between">
                <span>1. Contact Name Verified (+5%)</span>
                {fullName ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between">
                <span>2. Business Name Configured (+15%)</span>
                {businessName ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between">
                <span>3. Registered Entity Class (+10%)</span>
                {businessType ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between">
                <span>4. Trade Role Established (+10%)</span>
                {tradeType ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between">
                <span>5. Primary Commodity Selected (+10%)</span>
                {primaryCategory ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between">
                <span>6. Corporate Address Verified (+10%)</span>
                {businessAddress ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>7. CAC Number Linked (+30%)</span>
                {cacNumber ? <ShieldCheck className="w-4 h-4 text-brand-emerald" /> : <AlertTriangle className="w-4 h-4 text-slate-700" />}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
