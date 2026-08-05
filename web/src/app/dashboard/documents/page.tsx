'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useTradeMode } from '../../../context/TradeModeContext';
import { 
  FileText, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Building2, 
  Copy, 
  Check, 
  Printer,
  ChevronDown
} from 'lucide-react';

const DOCUMENT_PRESETS = [
  { code: 'FORM_M', name: 'Form M (CBN Import Declaration)', direction: 'import' },
  { code: 'PAAR', name: 'PAAR (Customs Assessment Report)', direction: 'import' },
  { code: 'COO', name: 'Certificate of Origin (AfCFTA COO)', direction: 'export' },
  { code: 'NXP', name: 'Form NXP (CBN Export proceeds)', direction: 'export' },
  { code: 'NEPC', name: 'NEPC Export Certificate', direction: 'export' }
];

function DocumentGeneratorContent() {
  const searchParams = useSearchParams();
  const { mode } = useTradeMode();

  const [documentCode, setDocumentCode] = useState('FORM_M');
  const [productName, setProductName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [direction, setDirection] = useState<'import' | 'export'>('import');
  
  // Trader Passport fields
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync with global trade mode & load URL prefills
  useEffect(() => {
    setDirection(mode);
    const savedCode = mode === 'import' ? 'FORM_M' : 'COO';
    setDocumentCode(savedCode);

    // 1. Fetch Trader profile details for automated prefill
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setBusinessName(data.business_name || '');
              setBusinessAddress(data.business_address || '');
              setCacNumber(data.cac_number || '');
            }
          });
      }
    });

    // 2. Read prefill params
    const codeParam = searchParams.get('prefill_code');
    const nameParam = searchParams.get('prefill_name');
    const prodParam = searchParams.get('prefill_product');

    if (codeParam) setDocumentCode(codeParam);
    if (prodParam) setProductName(decodeURIComponent(prodParam));
  }, [mode, searchParams]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !documentCode) {
      setErrorMsg('Product name and document type are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setDraft(null);

    const presetName = DOCUMENT_PRESETS.find(p => p.code === documentCode)?.name || 'Custom Document';

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const docRes = await fetch(`${apiUrl}/api/v1/compliance/generate_document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          document_code: documentCode,
          document_name: presetName,
          product_name: productName,
          hs_code: hsCode || null,
          direction: direction,
          destination_country: direction === 'export' ? 'AfCFTA Region' : null,
          business_name: businessName || null,
          business_address: businessAddress || null,
          cac_number: cacNumber || null,
        }),
      });

      const data = await docRes.json();
      if (!docRes.ok) {
        throw new Error(data.detail || 'Failed to generate document draft');
      }

      setDraft(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during draft generation.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">AI Application Drafting Desk</span>
        <h1 className="font-space text-3xl font-bold text-white mt-1">Trade Document Generator</h1>
        <p className="text-xs text-slate-500 mt-1 font-jakarta">Automate formal cover letters and full regulatory drafts for Customs and CBN desks.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Form panel */}
        <div className="lg:col-span-1 bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 self-start">
          <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
            <Building2 className="w-4 h-4 text-indigo-400" /> Draft Request Form
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Select Document Preset */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Document Preset</label>
              <div className="relative">
                <select
                  className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white appearance-none transition-colors"
                  value={documentCode}
                  onChange={(e) => setDocumentCode(e.target.value)}
                >
                  {DOCUMENT_PRESETS.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">Commodity Name</label>
              <input
                type="text"
                required
                className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white placeholder-slate-600 transition-colors"
                placeholder="e.g. Cocoa Beans"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* HS Code */}
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-1.5 ml-1">HS Code (Optional)</label>
              <input
                type="text"
                className="w-full bg-black border border-white/5 focus:border-brand-cyan/40 outline-none rounded-2xl px-4 h-12 text-xs text-white placeholder-slate-600 transition-colors"
                placeholder="e.g. 1801.00.00"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 pt-4">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-3">Linked Passport Prefills</span>
              <div className="space-y-3">
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                  <span className="block font-bold text-slate-500 uppercase text-[9px]">Business Entity</span>
                  <span>{businessName || 'Passport Not Configured'}</span>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                  <span className="block font-bold text-slate-500 uppercase text-[9px]">CAC Incorporation Number</span>
                  <span>{cacNumber || 'Passport Not Configured'}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full font-bold text-black bg-gradient-to-r from-brand-cyan to-brand-emerald hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/5 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Drafting Draft Details...
                </>
              ) : (
                <>
                  Generate AI Draft <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl p-4 mt-4 leading-relaxed">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Workspace Display */}
        <div className="lg:col-span-2 space-y-8">
          
          {draft ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Draft Overview Cards */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                  <Clock className="w-5 h-5 text-brand-cyan shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Est. Clearance Timeline</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{draft.estimated_processing || '5-10 Days'}</h4>
                  </div>
                </div>

                <div className="bg-[#09090a] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                  <DollarSign className="w-5 h-5 text-brand-emerald shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Processing Fees</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{draft.estimated_cost || 'Varies'}</h4>
                  </div>
                </div>
              </div>

              {/* Cover Letter Workspace */}
              {draft.cover_letter && (
                <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h3 className="font-space text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-cyan" /> Formal Cover Letter
                    </h3>
                    <button
                      onClick={() => copyToClipboard(draft.cover_letter)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-brand-emerald" /> Copied Letter
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Letter Text
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-black/60 border border-white/5 rounded-2xl p-5 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                    {draft.cover_letter}
                  </pre>
                </div>
              )}

              {/* Form custom sections */}
              <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
                <h3 className="font-space text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                  <FileText className="w-4 h-4 text-brand-emerald" /> Application Form Sections
                </h3>
                
                <div className="space-y-4">
                  {draft.sections && draft.sections.map((sec: any, idx: number) => (
                    <div key={idx} className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-2">
                      <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider">{sec.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-jakarta">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist & steps */}
              <div className="bg-[#09090a] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-space text-base font-bold text-white border-b border-white/5 pb-3">Submission Checklists</h3>
                  <ol className="mt-4 space-y-3 list-decimal list-inside text-xs text-slate-400 font-jakarta leading-relaxed">
                    {draft.submission_steps && draft.submission_steps.map((step: string, idx: number) => (
                      <li key={idx} className="pl-1">{step}</li>
                    ))}
                  </ol>
                </div>

                {draft.supporting_documents_checklist && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Required Supporting Files</h4>
                    <div className="space-y-3">
                      {draft.supporting_documents_checklist.map((doc: any, idx: number) => (
                        <div key={idx} className="flex gap-3 bg-black/40 border border-white/5 rounded-xl p-3 text-xs">
                          <CheckCircle className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-white leading-normal">{doc.item}</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{doc.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-3xl py-24 px-6 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-slate-700 mb-4" />
              <h4 className="text-sm font-bold text-slate-400">Application drafting workspace</h4>
              <p className="text-xs text-slate-600 max-w-sm mt-1.5 leading-relaxed font-jakarta">
                Prefill commodity parameters in the form on the left, then click Generate to construct fully automated custom drafts and formal printable cover letters.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function DocumentGenerator() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
      </div>
    }>
      <DocumentGeneratorContent />
    </Suspense>
  );
}
