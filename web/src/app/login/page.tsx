'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Eye, EyeOff, Globe, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if already authenticated and redirect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data?.session) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-slate-100 min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden font-sans">
      {/* Background Neon Overlay */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full ambient-glow-cyan pointer-events-none"></div>
      
      {/* Back to Home Button */}
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors bg-white/5 border border-white/5 px-3 py-1.5 rounded-full"
      >
        <Globe className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-[#09090a] border border-white/5 rounded-3xl p-8 relative shadow-2xl z-10">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent"></div>
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-1 mb-2">
            <img src="/logo.png" className="w-8 h-8 object-contain mr-[-4px]" alt="Koda Logo" />
            <span className="font-space text-lg font-bold text-slate-300 tracking-wider">ODA</span>
          </div>
          <h2 className="font-space text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1 font-jakarta">Login to access your trade dashboard</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 mb-6 leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 ml-1">Email Address</label>
            <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-14 transition-colors">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="email"
                required
                className="flex-1 bg-transparent border-0 outline-none text-sm text-white pl-3 placeholder-slate-600 focus:ring-0"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500">Password</label>
              <a href="#" onClick={(e) => {e.preventDefault(); alert('Password reset is managed on mobile currently.');}} className="text-[10px] text-slate-500 hover:text-slate-300">Forgot?</a>
            </div>
            <div className="flex items-center bg-black border border-white/5 focus-within:border-brand-cyan/40 rounded-2xl px-4 h-14 transition-colors">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="flex-1 bg-transparent border-0 outline-none text-sm text-white pl-3 placeholder-slate-600 focus:ring-0"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center px-1">
            <input
              type="checkbox"
              id="remember"
              className="rounded bg-black border-white/15 text-brand-cyan focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <label htmlFor="remember" className="text-xs text-slate-400 ml-2 select-none">Remember my session</label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="border-t border-white/5 mt-8 pt-6 text-center text-xs text-slate-500 font-jakarta">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-cyan hover:underline font-bold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
