'use client';

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { 
  Globe, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  HelpCircle, 
  AlertTriangle,
  Calculator,
  Percent,
  Coins,
  ShieldAlert
} from 'lucide-react';

const AFRICAN_COUNTRIES = [
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'EG', name: 'Egypt' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'CM', name: 'Cameroon' }
];

export default function AfCFTAChecker() {
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [destination, setDestination] = useState('GH');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // DVA Calculator State
  const [domesticMaterials, setDomesticMaterials] = useState<number | ''>('');
  const [processingLabor, setProcessingLabor] = useState<number | ''>('');
  const [importedMaterials, setImportedMaterials] = useState<number | ''>('');
  const [computedDVA, setComputedDVA] = useState<number | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !hsCode) {
      setErrorMsg('Product name and HS tariff code are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const checkRes = await fetch(`${apiUrl}/api/v1/afcfta/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          product_name: productName,
          hs_code: hsCode,
          destination_country: destination,
        }),
      });

      const data = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(data.detail || 'AfCFTA Rules check failed');
      }

      setResult(data);

      // Save checks to Supabase database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('afcfta_checks').insert({
          user_id: user.id,
          product_name: productName,
          hs_code: hsCode,
          destination_country: destination,
          eligible: data.eligible ?? true,
          tariff_saving_percent: data.tariff_saving_percent ?? 15.0,
          roo_eligible: data.roo_eligible ?? true,
          explanation: data.explanation || '',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDVA = () => {
    const domestic = Number(domesticMaterials || 0);
    const labor = Number(processingLabor || 0);
    const imported = Number(importedMaterials || 0);
    const total = domestic + labor + imported;

    if (total === 0) {
      alert('Please fill in material cost details.');
      return;
    }

    const dvaPercent = ((domestic + labor) / total) * 100;
    setComputedDVA(parseFloat(dvaPercent.toFixed(2)));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-brand-emerald">AfCFTA Trade Infrastructure</span>
        <h1 className="font-space text-3xl font-bold text-white mt-1">Rules of Origin (RoO) Checker</h1>
        <p className="text-xs text-slate-500 mt-1 font-jakarta">Verify export commodities against regional origin rules to secure continental tariff exemptions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Rules checker Form */}
        <div className="lg:col-span-2 bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 self-start">
          <h3 className="font-space text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Globe className="w-5 h-5 text-brand-emerald" /> AfCFTA Tariff Estimator
          </h3>

          <form onSubmit={handleCheck} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Export Commodity Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black border border-white/5 focus:border-brand-emerald/40 outline-none rounded-2xl px-4 h-14 text-sm text-white placeholder-slate-600 transition-colors"
                  placeholder="e.g. Shea Butter, Raw Cashew Nuts"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Commodity HS Code</label>
                <input
                  type="text"
                  required
                  className="w-full bg-black border border-white/5 focus:border-brand-emerald/40 outline-none rounded-2xl px-4 h-14 text-sm text-white placeholder-slate-600 transition-colors"
                  placeholder="e.g. 1515.90.00"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Destination African Country</label>
              <select
                className="w-full bg-black border border-white/5 focus:border-brand-emerald/40 outline-none rounded-2xl px-4 h-14 text-sm text-white placeholder-slate-600 transition-colors"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {AFRICAN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/5 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Regional Content...
                </>
              ) : (
                <>
                  Verify Origin Eligibility <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl p-4 mt-4">
              {errorMsg}
            </div>
          )}

          {/* Result view */}
          {result && (
            <div className="bg-black/50 border border-white/5 rounded-2xl p-6 space-y-6 mt-6 animate-in slide-in-from-bottom-3 duration-250">
              <div className="flex items-center gap-3">
                {result.eligible ? (
                  <CheckCircle className="w-6 h-6 text-brand-emerald" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {result.eligible ? 'AFCFTA ORIGIN COMPLIANT' : 'REVIEW ORIGIN COMPLIANCE'}
                  </h4>
                  <span className="text-[10px] text-slate-500">Suggested HS Code: {result.suggested_hs_code}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">AfCFTA Tariff Saving</span>
                  <span className="text-xl font-bold font-space text-brand-emerald">{result.tariff_saving_percent}% DISCOUNT</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">RoO Eligibility</span>
                  <span className="text-xl font-bold font-space text-white">{result.roo_eligible ? 'QUALIFIED' : 'PENDING'}</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Executive Summary</span>
                <p className="text-xs text-slate-400 leading-relaxed font-jakarta">{result.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* DVA Calculator panel */}
        <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 self-start">
          <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Calculator className="w-4 h-4 text-brand-cyan" /> DVA Calculator
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed font-jakarta">
            To qualify under the **Value-Added Threshold**, your domestic content (local materials + processing labor) must represent at least **35%** of the finished product value.
          </p>

          <div className="space-y-4">
            {/* Local raw */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Domestic Raw Materials</label>
              <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                <Coins className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="number"
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                  placeholder="e.g. 500000"
                  value={domesticMaterials}
                  onChange={(e) => setDomesticMaterials(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            {/* Local labor */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Processing/Labor Cost</label>
              <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                <Coins className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="number"
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                  placeholder="e.g. 150000"
                  value={processingLabor}
                  onChange={(e) => setProcessingLabor(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            {/* Imported raw */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Imported Components</label>
              <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-12">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="number"
                  className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
                  placeholder="e.g. 100000"
                  value={importedMaterials}
                  onChange={(e) => setImportedMaterials(e.target.value ? Number(e.target.value) : '')}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={calculateDVA}
              className="w-full h-11 rounded-full font-bold text-xs text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              Compute Domestic Content <Percent className="w-4 h-4 text-brand-cyan" />
            </button>

            {/* Calculated indicator */}
            {computedDVA !== null && (
              <div className={`border rounded-2xl p-4 text-center mt-4 animate-in zoom-in-95 duration-200 ${
                computedDVA >= 35 
                  ? 'bg-emerald-500/10 border-brand-emerald/30 text-brand-emerald' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <span className="text-[9px] uppercase tracking-widest font-bold block mb-1 text-slate-400">Domestic Value Added</span>
                <span className="text-2xl font-bold font-space block">{computedDVA}%</span>
                <span className="text-[10px] block mt-1 leading-normal">
                  {computedDVA >= 35 
                    ? '✅ QUALIFIES! Exceeds AfCFTA 35% minimum local value addition.' 
                    : '❌ DOES NOT QUALIFY. Below the required 35% threshold.'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
