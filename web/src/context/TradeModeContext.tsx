'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type TradeMode = 'import' | 'export';

interface TradeModeContextType {
  mode: TradeMode;
  toggleMode: () => void;
  setMode: (mode: TradeMode) => void;
}

const TradeModeContext = createContext<TradeModeContextType | undefined>(undefined);

export function TradeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<TradeMode>('import');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('koda_trade_mode') as TradeMode;
    if (saved === 'import' || saved === 'export') {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: TradeMode) => {
    setModeState(newMode);
    localStorage.setItem('koda_trade_mode', newMode);
  };

  const toggleMode = () => {
    const nextMode = mode === 'import' ? 'export' : 'import';
    setMode(nextMode);
  };

  return (
    <TradeModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </TradeModeContext.Provider>
  );
}

export function useTradeMode() {
  const context = useContext(TradeModeContext);
  if (!context) {
    throw new Error('useTradeMode must be used within a TradeModeProvider');
  }
  return context;
}
