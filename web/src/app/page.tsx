'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Globe,
  ShieldCheck,
  Zap,
  FileText,
  TrendingUp,
  Download,
  Play,
  ExternalLink,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

const NEWS_ARTICLES = [
  {
    source: 'SmartSMS Solutions Nigeria ',
    title: '',
    summary: 'Using an incorrect HS code can result in duty reassessment plus interest, administrative penalties, goods detention, and future enhanced scrutiny. Under the 2025 Tax Act, imports with incorrect duty payment may also lose CIT deductibility entirely. Nigeria Customs is increasingly sophisticated at catching this.',
    link: 'https://smartsmssolutions.com/resources/blog/ng/hs-code-classification-risk-nigeria',
    tag: 'HS Code'
  },
  {
    source: 'SGK Global / Nigeria Customs',
    title: 'Nigeria Customs Import Regulations 2026',
    summary: 'Documentation is the backbone of Nigeria customs regulations 2026. Missing or incorrectly completed documents are the single most common cause of clearance delays, demurrage charges, and cargo seizure at Nigerian ports. Mandatory docs: Form M, PAAR, CCVO, NAFDAC, SON, Combined Declaration — each from a different agency.',
    link: 'https://sgkglobal.com/nigeria-customs-import-regulations-2026/',
    tag: 'Documentation'
  },
  {
    source: 'The Guardian Nigeria',
    title: 'Over 5,000 Cargoes Trapped at Ports Amid ₦2 Trillion Demurrage Losses',
    summary: 'Port users claim to have lost an estimated ₦2 trillion in demurrage in just two weeks. The disruption was caused by persistent network glitches on the Nigeria Customs Service ‘B’Odogwu digital platform, which left manufacturers and merchants incurring huge losses.',
    link: 'https://guardian.ng/business-services/maritime/over-5000-cargoes-trapped-at-ports-amid-n2tr-demurrage-losses/',
    tag: 'Port Glitch'
  }
];

export default function LandingPage() {
  return (
    <div className="bg-black text-slate-100 min-h-screen relative font-sans">
      {/* Background Lighting Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full ambient-glow-cyan pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full ambient-glow-emerald pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

      {/* Navigation Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo spelling KODA */}
            <div className="flex items-center">
              <img src="/logo.png" className="w-8 h-8 object-contain mr-[-4px]" alt="Koda Logo" />
              <span className="font-space text-lg font-bold text-slate-300 tracking-wider uppercase ml-1">
                ODA
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded-full ml-3">
              Web
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-bold text-black bg-white rounded-full hover:bg-slate-200 transition-colors px-5 py-2.5 shadow-md flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-slate-300 mb-8 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>AI-Powered Trade Compliance for Nigeria &amp; AfCFTA</span>
          </div>

          <h1 className="font-space text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 max-w-5xl mx-auto leading-none">
            Understand <span className="bg-gradient-to-r from-brand-cyan to-brand-emerald bg-clip-text text-transparent">HS Codes</span>.<br />
            Get Documents Instantly.
          </h1>

          <div className="max-w-3xl mx-auto">
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-jakarta mb-8">
              The <strong>HS Code</strong> (Harmonized System Code) is the universal language of international trade.
              It determines how much duty you pay, whether your goods are allowed into Nigeria or qualify for
              AfCFTA zero tariffs, and which government documents you need.
            </p>

            <p className="text-slate-400 text-base max-w-2xl mx-auto mb-10">
              Koda uses AI to instantly identify the correct HS Code for any product,
              checks compliance rules, and generates ready-to-submit drafts of Form M, PAAR,
              Certificate of Origin, NXP, and more — saving you weeks of delays at the port.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              Launch Web Portal <Play className="w-4 h-4 fill-black" />
            </Link>
            <a
              href="#download"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-white bg-[#0d0d0d] border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              Download Mobile App <Download className="w-4 h-4" />
            </a>
          </div>

          {/* Visual Mockup */}
          <div className="relative max-w-5xl mx-auto bg-[#0d0d0d] border border-white/10 rounded-3xl p-4 shadow-2xl shadow-cyan-500/5">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent"></div>

            <div className="flex items-center gap-1.5 mb-3 px-2 border-b border-white/5 pb-3">
              <span className="w-3 h-3 rounded-full bg-red-500/60"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/60"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/60"></span>
              <span className="text-xs text-slate-500 ml-4 font-mono font-medium">kodatrade-portal.web.app/analysis</span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/80 aspect-[16/9] flex items-center justify-center p-8 relative">
              <div className="text-left w-full max-w-lg space-y-6">
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-2xl font-bold text-brand-cyan">
                    HS
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Suggested HS Code</p>
                    <p className="text-2xl font-space font-bold text-brand-emerald tracking-tighter">0908.11.00</p>
                    <p className="text-xs text-slate-400 mt-1">Nutmeg — Wholly Obtained (AfCFTA Eligible)</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold text-emerald-400">
                    COMPLIANT
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Documents Generated</p>
                    <p className="text-xs text-slate-400">Form M • PAAR • Certificate of Origin • Cover Letter</p>
                  </div>
                  <div className="text-xs bg-white/10 px-3 py-1 rounded-lg text-slate-400">Ready in 8 seconds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 border-t border-white/5 bg-gradient-to-b from-black to-[#050505] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-red-500 font-bold mb-3 block">The Port Bottleneck</span>
              <h2 className="font-space text-3xl md:text-4xl font-bold text-white tracking-tight mb-6">
                Nigeria&apos;s Trade Paralysis
              </h2>
              <div className="space-y-6 text-slate-400 font-jakarta leading-relaxed text-base">
                <p>
                  Cross-border trading in Nigeria is crippled by bureaucracy. Importers and exporters face severe delays that drive up prices, waste goods, and make regional business impossible.
                </p>
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                    <span className="block text-4xl font-bold text-red-500 mb-1">73%</span>
                    <span className="text-xs text-slate-400">of port cargo dwell time is caused entirely by <strong>documentation delays</strong> and paperwork friction.</span>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                    <span className="block text-4xl font-bold text-yellow-500 mb-1">15-21d</span>
                    <span className="text-xs text-slate-400">Average cargo clearance delay in Nigeria, compared to a global standard of just 2-3 days.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#0c0c0d] border border-white/10 rounded-3xl p-6 relative">
                <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full mb-4 inline-block">SYSTEM ERROR IN 2026</span>
                <h3 className="text-lg font-bold text-white mb-2">National Single Window Glitches</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Launched to solve paperwork, the 2026 National Single Window deployment suffered severe integration failure, locking up thousands of commercial containers and adding billions of Naira in demurrage fees.
                </p>
                <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Official reports verify this crisis.</span>
                  <a href="#news-marquee" className="text-brand-cyan hover:underline flex items-center gap-1">Read reports below <ArrowRight className="w-3.5 h-3.5" /></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Sliding News Display */}
      <section id="news-marquee" className="py-16 bg-[#030303] border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 flex justify-between items-end">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-cyan font-bold block mb-1">Verify the facts</span>
            <h3 className="font-space text-2xl font-bold text-white tracking-tight">Real-Time News Coverage</h3>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline-block">Hover to pause carousel • Click to verify source</span>
        </div>

        {/* Marquee Container */}
        <div className="relative w-full flex items-center">
          <div className="animate-marquee-container flex gap-6 py-2">
            {/* Double the list to create a perfect infinite loop */}
            {[...NEWS_ARTICLES, ...NEWS_ARTICLES].map((article, idx) => (
              <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                key={idx}
                className="w-[380px] shrink-0 bg-[#0d0d0d]/90 hover:bg-[#111112] border border-white/10 hover:border-brand-cyan/30 rounded-2xl p-6 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-brand-cyan tracking-wider">{article.source}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{article.tag}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-brand-cyan transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Verify article</span>
                  <span className="text-brand-cyan flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Source Link <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-widest text-brand-emerald font-bold mb-3 block">Koda Solution</span>
            <h2 className="font-space text-3xl md:text-5xl font-bold text-white tracking-tight">
              One Tool, Instant Compliance
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto mt-4 font-jakarta">
              KodaTrade brings deep artificial intelligence to simplify trade clearance, rules of origin eligibility, and required government applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#080809] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-6">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Instant HS Code Search</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-jakarta">
                Enter your product name or scan commercial items to immediately retrieve matching HS tariff codes, duty percentages, and special regulatory status.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#080809] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-emerald/15 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">AfCFTA Rules of Origin Checker</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-jakarta">
                Verify if your export products qualify for 0% tariffs under AfCFTA. Check value-added thresholds and substantial transformations automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#080809] border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Automated AI Document Drafts</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-jakarta">
                Generate highly formatted draft documents including Form M, COO, NXP, and cover letters, directly addressed to the correct WCO and Customs desks in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download App & CTA */}
      <section id="download" className="py-24 border-t border-white/5 bg-[#030303]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/10 p-2">
            <img
              src="/logo.png"
              alt="Koda Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-space text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Get Koda Today
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-10 leading-relaxed font-jakarta">
            Clear goods faster, avoid port delays, and trade profitably across the African continent. Accessible on web and mobile devices.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-full font-bold text-white bg-[#0d0d0d] border border-white/10 hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2"
            >
              Sign In to Web Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://drive.google.com/file/d/1YP71kr4eId7DR5uPsrHCEI2Mx87ofAgr/view?usp=sharing"
              className="px-8 py-3.5 rounded-full font-bold text-black bg-white hover:bg-slate-200 transition-all flex items-center gap-2"
            >
              Download Mobile App <Download className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-6 h-6 object-contain grayscale opacity-60" alt="Koda Logo" />
            <span className="font-space text-sm font-bold text-slate-500 tracking-wider">KODA</span>
            <span className="text-slate-600 text-xs font-jakarta ml-4">© 2026 KodaTrade Inc. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-500">
            <Link href="/login" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/login" className="hover:text-slate-300">Terms of Trade</Link>
            <Link href="/login" className="hover:text-slate-300">FastAPI API docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
