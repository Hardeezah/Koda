'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTradeMode } from '../../../context/TradeModeContext';
import { supabase } from '../../../lib/supabase';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertTriangle, 
  Info, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertOctagon,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ComplianceChecker() {
  const router = useRouter();
  const { mode } = useTradeMode();
  
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [direction, setDirection] = useState<'import' | 'export'>('import');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync with global trade mode
  useEffect(() => {
    setDirection(mode);
  }, [mode]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) {
      setErrorMsg('Please enter a product name to analyze.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setReport(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const checkRes = await fetch(`${apiUrl}/api/v1/compliance/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: productName,
          hs_code: hsCode || null,
          direction: direction,
        }),
      });

      const data = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(data.detail || 'Compliance analysis failed');
      }

      setReport(data);

      // Save this run to the ledger database using Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ledger').insert({
          profile_id: user.id,
          product_name: data.product_name || productName,
          hs_code: data.suggested_hs_code || hsCode || null,
          direction: direction,
          status: data.status === 'compliant' ? 'compliant' : 'non_compliant',
          compliance_data: data,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBanner = (status: string, prohibited: boolean) => {
    if (prohibited || status === 'non_compliant') {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-start gap-4 text-left">
          <AlertOctagon className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-tight">PROHIBITED / RESTRICTED TRADE</h4>
            <p className="text-xs text-red-400 mt-1 leading-relaxed font-jakarta">
              {report.prohibition_reason || 'This product is prohibited or heavily restricted under active Nigerian Trade regulations. Proceeding without special licensing may lead to seizure and fines.'}
            </p>
          </div>
        </div>
      );
    }
    if (status === 'under_review' || status === 'under-review') {
      return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6 flex items-start gap-4 text-left">
          <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-tight">ADDITIONAL CLEARANCE REQUIRED</h4>
            <p className="text-xs text-yellow-400 mt-1 leading-relaxed font-jakarta">
              Compliance is pending further government audits. Specific regulatory permits must be drafted and submitted at physical trade finance desks.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-start gap-4 text-left">
        <CheckCircle className="w-8 h-8 text-brand-emerald shrink-0" />
        <div>
          <h4 className="text-base font-bold text-white uppercase tracking-tight">COMPLIANT / ALLOWED</h4>
          <p className="text-xs text-brand-emerald mt-1 leading-relaxed font-jakarta">
            This product is fully eligible for lawful {direction} transactions. Ensure all critical documentation drafts in the checklist below are generated and filed.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-brand-cyan">Trade Intelligence System</span>
        <h1 className="font-space text-3xl font-bold text-white mt-1">AI Compliance Checker</h1>
        <p className="text-xs text-slate-500 mt-1 font-jakarta">Analyze custom import/export items against WCO, CBN, and customs databases.</p>
      </div>

      {/* Input Form */}
      <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8">
        <form onSubmit={handleCheck} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Product Description</label>
              <input
                type="text"
                required
                className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-14 text-sm text-white placeholder-slate-600 transition-colors"
                placeholder="e.g. Cocoa Beans, Dried Ginger, Nutmeg"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* HS Code */}
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">HS Tariff Code (Optional)</label>
              <input
                type="text"
                className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-14 text-sm text-white placeholder-slate-600 transition-colors"
                placeholder="e.g. 1801.00.00"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-white/5">
            {/* Direction Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-bold">Direction:</span>
              <div className="bg-black border border-white/5 rounded-full p-1 flex">
                <button
                  type="button"
                  onClick={() => setDirection('import')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    direction === 'import' ? 'bg-[#0d0d0e] border border-white/10 text-brand-cyan' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('export')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    direction === 'export' ? 'bg-[#0d0d0e] border border-white/10 text-brand-emerald' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Export
                </button>
              </div>
            </div>

            {/* Check Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 h-12 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/5 self-end"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Regulations...
                </>
              ) : (
                <>
                  Analyze Compliance <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl p-5 leading-relaxed">
          {errorMsg}
        </div>
      )}

      {/* ── STUNNING COMPLIANCE REPORT CARD ── */}
      {report && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-300">
          
          {/* 1. Status Banner */}
          {getStatusBanner(report.status, report.prohibited || false)}

          {/* 2. Key Metrics Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Suggested HS Tariff</span>
              <span className="text-xl font-bold font-space text-white">{report.suggested_hs_code || 'TBC'}</span>
              <span className="text-[10px] text-slate-500 mt-2 block">Standard WCO Harmonized System</span>
            </div>

            {direction === 'import' ? (
              <>
                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Estimated Import Duty</span>
                  <span className="text-xl font-bold font-space text-brand-cyan">{report.import_duty_percent ?? '0'}%</span>
                  <span className="text-[10px] text-slate-500 mt-2 block">Plus standard 7.5% VAT rate</span>
                </div>
                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Prohibited Item</span>
                  <span className="text-xl font-bold font-space uppercase text-red-400">{report.prohibited ? 'YES' : 'NO'}</span>
                  <span className="text-[10px] text-slate-500 mt-2 block">Nigerian Import Prohibition List</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">AfCFTA Duty Saving</span>
                  <span className="text-xl font-bold font-space text-brand-emerald">{report.tariff_saving_percent ?? '0'}% SAVING</span>
                  <span className="text-[10px] text-slate-500 mt-2 block">Estimated discount continental-wide</span>
                </div>
                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Rules of Origin (RoO)</span>
                  <span className="text-xs font-bold font-space text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2.5 py-1 rounded-full uppercase mt-1 self-start">
                    {report.roo_type || 'Eligible'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2 block">Basis of AfCFTA tariff status</span>
                </div>
              </>
            )}
          </div>

          {/* 3. Executive Summary */}
          <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <Info className="w-4 h-4 text-brand-cyan" /> Executive Analysis Summary
            </h3>
            <p className="text-slate-300 font-jakarta text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* 4. Instructions */}
          {report.what_to_do && (
            <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
              <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <CheckCircle className="w-4 h-4 text-brand-emerald" /> Step-by-Step Trader Roadmap
              </h3>
              <p className="text-slate-300 font-jakarta text-sm leading-relaxed whitespace-pre-line">
                {report.what_to_do}
              </p>
            </div>
          )}

          {/* 5. Documents checklist */}
          <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 overflow-hidden">
            <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <FileText className="w-4 h-4 text-indigo-400" /> Required Custom Permits &amp; Documents
            </h3>
            
            {report.compliance_items && report.compliance_items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Permit Name</th>
                      <th className="py-3 px-4">Agency</th>
                      <th className="py-3 px-4">Est. Cost</th>
                      <th className="py-3 px-4">Est. Time</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.compliance_items.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-bold text-brand-cyan">{item.code}</td>
                        <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                        <td className="py-3 px-4 text-slate-400">{item.agency_short || item.agency}</td>
                        <td className="py-3 px-4 text-slate-400">{item.cost_estimate || 'Varies'}</td>
                        <td className="py-3 px-4 text-slate-400">{item.processing_time || 'Instant'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              // Direct action mapping - prefill generator
                              router.push(`/dashboard/documents?prefill_code=${item.code}&prefill_name=${encodeURIComponent(item.name)}&prefill_product=${encodeURIComponent(report.product_name)}`);
                            }}
                            className="bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/20 text-brand-cyan px-2.5 py-1 rounded font-bold text-[10px] uppercase transition-colors"
                          >
                            Draft AI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No specific regulatory documents returned for this commodity.</p>
            )}
          </div>

          {/* 6. Risks */}
          {report.risks && report.risks.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-space text-lg font-bold text-white border-b border-white/5 pb-3">Critical Risk Audits</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {report.risks.map((risk: any, i: number) => (
                  <div 
                    key={i} 
                    className="bg-[#09090a] border border-white/5 rounded-2xl p-6 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                        risk.level === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {risk.level} RISK
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{risk.reason}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-jakarta">
                      <strong>Mitigation Required:</strong> {risk.action_required}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
