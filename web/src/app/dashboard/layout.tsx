'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useTradeMode } from '../../context/TradeModeContext';
import { 
  Home, 
  ShieldCheck, 
  Globe, 
  FileText, 
  Layers, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Download,
  Upload
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleMode } = useTradeMode();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Authenticate user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        router.push('/login');
      } else {
        // Fetch trader profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUserProfile(data);
          });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push('/login');
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 animate-spin text-brand-cyan" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs tracking-widest uppercase font-bold text-slate-500">Securing Session...</span>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const NAV_ITEMS = [
    { label: 'Overview', path: '/dashboard', icon: Home },
    { label: mode === 'import' ? 'Import Checker' : 'Export Checker', path: '/dashboard/compliance', icon: ShieldCheck },
    { label: 'AfCFTA Rules', path: '/dashboard/afcfta', icon: Globe },
    { label: 'AI Documents', path: '/dashboard/documents', icon: FileText },
    { label: 'Trade Ledger', path: '/dashboard/ledger', icon: Layers },
    { label: 'Koda Passport', path: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="bg-black text-slate-100 min-h-screen flex font-sans overflow-hidden">
      
      {/* ── MOBILE NAV BAR HEADER ── */}
      <div className="md:hidden w-full h-16 border-b border-white/5 bg-[#0a0a0b] flex items-center justify-between px-6 fixed top-0 left-0 z-40">
        <div className="flex items-center gap-1.5">
          <img src="/logo.png" className="w-6 h-6 object-contain mr-[-2px]" alt="Koda Logo" />
          <span className="font-space font-bold uppercase tracking-wider text-slate-300">ODA</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* ── MOBILE OVERLAY DRAWER ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          
          <div className="w-[280px] bg-[#09090a] border-r border-white/5 h-full relative z-10 flex flex-col p-6 justify-between animate-in slide-in-from-left duration-250">
            <div>
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-1.5">
                  <img src="/logo.png" className="w-6 h-6 object-contain mr-[-2px]" alt="Koda Logo" />
                  <span className="font-space font-bold uppercase tracking-wider text-slate-300">ODA</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="mb-6">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2 block">Active Trade Direction</span>
                <button 
                  onClick={toggleMode}
                  className="w-full flex items-center justify-between bg-black border border-white/5 rounded-2xl p-3"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {mode === 'import' ? <Download className="w-4 h-4 text-brand-cyan" /> : <Upload className="w-4 h-4 text-brand-emerald" />}
                    {mode.toUpperCase()} MODE
                  </span>
                  <span className="text-[10px] text-brand-cyan font-bold underline">SWITCH</span>
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 h-12 rounded-2xl text-sm font-medium transition-colors ${
                        active 
                          ? 'bg-gradient-to-r from-brand-cyan/15 to-brand-emerald/5 border border-brand-cyan/20 text-white font-bold' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-brand-cyan' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile Drawer footer */}
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center font-bold text-brand-cyan text-sm">
                  {userProfile?.full_name?.charAt(0) || userProfile?.business_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{userProfile?.business_name || userProfile?.full_name || 'Trade Partner'}</h4>
                  <span className="text-[10px] text-slate-500 leading-none">Trader Profile</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-white/10 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP COLLAPSIBLE SIDEBAR ── */}
      <aside 
        className={`hidden md:flex flex-col justify-between border-r border-white/5 bg-[#080809] shrink-0 h-screen transition-all duration-300 relative ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-[#111112] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white z-20"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div>
          {/* Logo spelling KODA */}
          <div className={`h-20 flex items-center px-6 border-b border-white/5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-1.5">
              <img src="/logo.png" className="w-7 h-7 object-contain shrink-0 mr-[-2px]" alt="Koda Logo" />
              {!collapsed && (
                <span className="font-space text-base font-bold text-slate-300 tracking-wider uppercase">
                  ODA
                </span>
              )}
            </div>
          </div>

          {/* Trade Mode Toggle */}
          <div className="p-4 border-b border-white/5">
            {collapsed ? (
              <button 
                onClick={toggleMode}
                title={`Toggle to ${mode === 'import' ? 'export' : 'import'} mode`}
                className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto transition-colors ${
                  mode === 'import' ? 'bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan' : 'bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald'
                }`}
              >
                {mode === 'import' ? <Download className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </button>
            ) : (
              <div className="bg-black border border-white/5 rounded-2xl p-1.5 flex relative">
                {/* Slidable background capsule indicator */}
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[46%] rounded-xl transition-all duration-300 ease-out bg-[#0e0e10] border border-white/10 ${
                    mode === 'export' ? 'left-[51%]' : 'left-1.5'
                  }`}
                />
                
                <button 
                  onClick={() => mode !== 'import' && toggleMode()}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-1.5 ${
                    mode === 'import' ? 'text-brand-cyan' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Import
                </button>
                <button 
                  onClick={() => mode !== 'export' && toggleMode()}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-1.5 ${
                    mode === 'export' ? 'text-brand-emerald' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-4 h-12 rounded-2xl text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-gradient-to-r from-brand-cyan/15 to-brand-emerald/5 border border-brand-cyan/25 text-white font-bold' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-cyan' : 'text-slate-500'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-white/5">
          {collapsed ? (
            <button 
              onClick={handleLogout}
              title="Logout session"
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-brand-cyan text-sm shrink-0 border border-white/10">
                  {userProfile?.full_name?.charAt(0) || userProfile?.business_name?.charAt(0) || 'T'}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white leading-none truncate">{userProfile?.business_name || userProfile?.full_name || 'Trade Partner'}</h4>
                  <span className="text-[10px] text-slate-500 leading-none block truncate mt-1">CAC: {userProfile?.cac_number || 'Not Linked'}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-full border border-white/10 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout Session
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── PORTAL CONTENT SCROLL CONTAINER ── */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative pt-16 md:pt-0 overflow-y-auto">
        <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full pb-20">
          {children}
        </div>
      </main>

    </div>
  );
}
