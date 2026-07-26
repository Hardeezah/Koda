'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useTradeMode } from '../../context/TradeModeContext';
import { 
  ShieldCheck, 
  Globe, 
  FileText, 
  Layers, 
  TrendingUp, 
  Inbox, 
  ArrowRight,
  ChevronRight,
  Download,
  Upload,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardHome() {
  const { mode } = useTradeMode();
  const [profile, setProfile] = useState<any>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Trader Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // 2. Fetch Ledger activity
      const { data: ledgerData } = await supabase
        .from('ledger')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(mode === 'import' ? 3 : 2);

      let recent = ledgerData || [];

      // 3. For Export mode, also merge AfCFTA checks
      if (mode === 'export') {
        const { data: afcftaData } = await supabase
          .from('afcfta_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        const normalised = (afcftaData || []).map((c: any) => ({
          ...c,
          type: 'afcfta',
          product_name: c.product_description || 'AfCFTA Check',
          status: c.roo_eligible ? 'compliant' : 'review',
        }));

        recent = [...recent, ...normalised]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
      }

      setRecentEntries(recent);

      // 4. Calculate Readiness Score (Same logic as mobile app)
      let computed = 10; // Base baseline
      if (profileData?.business_name) computed += 15;
      if (profileData?.business_type) computed += 10;
      if (profileData?.trade_type) computed += 10;
      if (profileData?.primary_category) computed += 10;
      if (profileData?.cac_number) computed += 25;

      const totalEntries = ledgerData?.length || 0;
      computed += Math.min(totalEntries * 5, 10);

      const compliantEntries = (ledgerData || []).filter(
        (e: any) => e.status === 'compliant'
      ).length;
      computed += Math.min(compliantEntries * 5, 10);

      setScore(Math.min(computed, 100));
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [mode]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-NG', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-brand-emerald text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            ALLOWED
          </span>
        );
      case 'non_compliant':
        return (
          <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            PROHIBITED
          </span>
        );
      default:
        return (
          <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            DRAFT
          </span>
        );
    }
  };

  const getTradeModeHeading = () => {
    if (mode === 'import') {
      return {
        subtitle: 'Your import compliance dashboard',
        scoreLabel: 'Import Readiness Score',
        emptyLabel: 'Scan or check an import to create your first ledger entry.',
      };
    }
    return {
      subtitle: 'Your AfCFTA & export compliance dashboard',
      scoreLabel: 'Export & AfCFTA Readiness Score',
      emptyLabel: 'Run an AfCFTA check or scan an export to get started.',
    };
  };

  const info = getTradeModeHeading();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 animate-spin text-brand-cyan" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs uppercase font-bold tracking-widest text-slate-600">Gathering Ledger Metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* ── TOP HERO HEADER GREETING ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-cyan">{info.subtitle}</span>
          <h1 className="font-space text-3xl md:text-4xl font-bold text-white mt-1">
            {profile?.business_name || profile?.full_name || 'Trade Partner'}
          </h1>
        </div>
        <Link 
          href="/dashboard/profile"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-full self-start transition-colors"
        >
          View Trader Passport <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── SCORECARD / READINESS PROGRESS ── */}
      <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-cyan" />
            <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">{info.scoreLabel}</h3>
          </div>
          <span className="text-sm font-bold text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1 rounded-full">
            {score} / 100 COMPLETED
          </span>
        </div>
        
        {/* Loading Bar */}
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-6 relative z-10">
          <div 
            className="h-full bg-gradient-to-r from-brand-cyan to-brand-emerald rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${score}%` }}
          ></div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed font-jakarta">
          Your readiness score represents compliance data completeness. Linking your registered business name, selecting trade categories, and verifying your **CAC incorporation details** will advance your score to 100% and unlock automated draft generation capabilities.
        </p>
      </div>

      {/* ── QUICK ACTION MATRIX ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Action 1 */}
        <Link 
          href="/dashboard/compliance" 
          className="bg-[#09090a] border border-white/5 hover:border-brand-cyan/20 rounded-3xl p-6 group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-4 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">AI Tariff Check</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-jakarta">Run immediate compliance checks on items and get customs scores.</p>
        </Link>

        {/* Action 2 */}
        <Link 
          href="/dashboard/afcfta" 
          className="bg-[#09090a] border border-white/5 hover:border-brand-emerald/20 rounded-3xl p-6 group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mb-4 group-hover:scale-105 transition-transform">
            <Globe className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">AfCFTA Rules</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-jakarta">Verify Rules of Origin eligibility to access trade discounts continental-wide.</p>
        </Link>

        {/* Action 3 */}
        <Link 
          href="/dashboard/documents" 
          className="bg-[#09090a] border border-white/5 hover:border-indigo-500/20 rounded-3xl p-6 group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">AI Documents</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-jakarta">Generate full, printable drafts of Form M, COO, and NXP certificates.</p>
        </Link>

        {/* Action 4 */}
        <Link 
          href="/dashboard/ledger" 
          className="bg-[#09090a] border border-white/5 hover:border-amber-500/20 rounded-3xl p-6 group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Trade Ledger</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-jakarta">Access complete histories of previous scans and compliance scores.</p>
        </Link>

      </div>

      {/* ── RECENT ACTIVITY LEDGER ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="font-space text-lg font-bold text-white">Recent Compliance Logs</h3>
          <Link href="/dashboard/ledger" className="text-xs font-bold text-brand-cyan hover:underline">
            View All Entries
          </Link>
        </div>

        {recentEntries.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-3xl py-12 px-6 flex flex-col items-center justify-center text-center">
            <Inbox className="w-8 h-8 text-slate-700 mb-3" />
            <h4 className="text-sm font-bold text-slate-400">No entries recorded</h4>
            <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed font-jakarta">
              {info.emptyLabel}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((item) => {
              const isAfCFTA = item.type === 'afcfta';
              return (
                <div 
                  key={item.id}
                  className="bg-[#080809] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0 border border-white/5">
                      {isAfCFTA ? <Globe className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white leading-tight">{item.product_name}</h4>
                        {isAfCFTA && (
                          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                            AfCFTA Check
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-jakarta">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" /> {formatDate(item.created_at)}
                        </span>
                        {item.hs_code && (
                          <span>HS Code: {item.hs_code}</span>
                        )}
                        {isAfCFTA && item.destination_country && (
                          <span>To: {item.destination_country}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {getStatusBadge(item.status)}
                    <Link 
                      href={isAfCFTA ? `/dashboard/afcfta` : `/dashboard/ledger`}
                      className="text-xs font-bold text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
