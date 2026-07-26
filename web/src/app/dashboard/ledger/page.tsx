'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTradeMode } from '../../../context/TradeModeContext';
import { 
  Layers, 
  Search, 
  Download, 
  Upload, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Inbox,
  ArrowRight,
  X,
  ShieldCheck,
  FileText,
  Loader2
} from 'lucide-react';

export default function TradeLedger() {
  const { mode } = useTradeMode();
  
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<'all' | 'import' | 'export'>('all');
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching ledger logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'compliant') {
      return (
        <span className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          ALLOWED
        </span>
      );
    }
    return (
      <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        PROHIBITED
      </span>
    );
  };

  // Filter & Search entries
  const filtered = entries.filter((item) => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.hs_code && item.hs_code.includes(searchTerm));
    
    if (filterDirection === 'all') return matchesSearch;
    return matchesSearch && item.direction === filterDirection;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-300 relative">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-brand-cyan">Auditable Ledger Logs</span>
        <h1 className="font-space text-3xl font-bold text-white mt-1">Trade Ledger</h1>
        <p className="text-xs text-slate-500 mt-1 font-jakarta">Review and verify historical compliance logs and generated AI regulatory reports.</p>
      </div>

      {/* Toolbar filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#09090a] border border-white/5 rounded-2xl p-4">
        
        {/* Search */}
        <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-xl px-3 w-full sm:max-w-xs h-11 transition-colors">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-xs text-white pl-2 placeholder-slate-600 focus:ring-0"
            placeholder="Search by product name or HS code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Direction Filters */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={() => setFilterDirection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterDirection === 'all' ? 'bg-[#111112] border border-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterDirection('import')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterDirection === 'import' ? 'bg-[#111112] border border-white/10 text-brand-cyan' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Imports
          </button>
          <button
            onClick={() => setFilterDirection('export')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterDirection === 'export' ? 'bg-[#111112] border border-white/10 text-brand-emerald' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Exports
          </button>
        </div>

      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl py-20 px-6 flex flex-col items-center justify-center text-center">
          <Inbox className="w-8 h-8 text-slate-700 mb-3" />
          <h4 className="text-sm font-bold text-slate-400">No ledger logs matching filters</h4>
          <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed font-jakarta">
            Run an AI Compliance Check on items or adjust search terms to see logs.
          </p>
        </div>
      ) : (
        <div className="bg-[#09090a] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/40 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Direction</th>
                  <th className="py-4 px-6">Product Description</th>
                  <th className="py-4 px-6">Suggested HS</th>
                  <th className="py-4 px-6">Clearance Date</th>
                  <th className="py-4 px-6">Customs Score</th>
                  <th className="py-4 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1.5 font-bold uppercase ${
                        item.direction === 'import' ? 'text-brand-cyan' : 'text-brand-emerald'
                      }`}>
                        {item.direction === 'import' ? <Download className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                        {item.direction}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white max-w-[200px] truncate">{item.product_name}</td>
                    <td className="py-4 px-6 font-mono text-slate-300">{item.hs_code || 'TBC'}</td>
                    <td className="py-4 px-6 text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" /> {formatDate(item.created_at)}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(item.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedEntry(item)}
                        className="text-xs font-bold text-brand-cyan hover:underline"
                      >
                        Review Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXPANDED AUDIT REPORT SLIDE-OUT PANEL (Drawer) ── */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedEntry(null)}
          ></div>
          
          <div className="w-full max-w-2xl bg-[#09090a] border-l border-white/5 h-full relative z-10 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="h-20 border-b border-white/5 px-6 md:px-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-cyan" />
                <h2 className="font-space text-lg font-bold text-white uppercase tracking-tight">Ledger Audit Report</h2>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
              
              {/* Product Card */}
              <div className="bg-black border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Commodity Description</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{selectedEntry.product_name}</h3>
                  </div>
                  {getStatusBadge(selectedEntry.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-4 text-xs font-jakarta">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Direction</span>
                    <span className={`font-bold uppercase ${selectedEntry.direction === 'import' ? 'text-brand-cyan' : 'text-brand-emerald'}`}>
                      {selectedEntry.direction}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Suggested HS Code</span>
                    <span className="font-mono text-white">{selectedEntry.hs_code || 'TBC'}</span>
                  </div>
                </div>
              </div>

              {/* Renders dynamic AI check fields saved inside json `compliance_data` */}
              {selectedEntry.compliance_data ? (
                <div className="space-y-6">
                  {selectedEntry.compliance_data.summary && (
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Executive Summary</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-jakarta">
                        {selectedEntry.compliance_data.summary}
                      </p>
                    </div>
                  )}

                  {selectedEntry.compliance_data.what_to_do && (
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Trader Roadmap</span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-jakarta">
                        {selectedEntry.compliance_data.what_to_do}
                      </p>
                    </div>
                  )}

                  {selectedEntry.compliance_data.compliance_items && selectedEntry.compliance_data.compliance_items.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Associated Document Checklist</span>
                      <div className="space-y-2">
                        {selectedEntry.compliance_data.compliance_items.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-black border border-white/5 rounded-xl p-3 text-xs leading-normal">
                            <FileText className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                            <div>
                              <h5 className="font-bold text-white">{item.code} — {item.name}</h5>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-600">No extended AI compliance payload structured inside this ledger index.</p>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="h-20 border-t border-white/5 px-6 md:px-8 flex items-center justify-end bg-black/40">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2.5 rounded-full border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
