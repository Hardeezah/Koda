import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../infrastructure/supabase';

type TradeMode = 'import' | 'export';

interface TradeModeContextType {
    mode: TradeMode;
    setMode: (mode: TradeMode) => Promise<void>;
    isExport: boolean;
    isImport: boolean;
}

const TradeModeContext = createContext<TradeModeContextType | undefined>(undefined);

export const TradeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<TradeMode>('export'); // default to export

    useEffect(() => {
        loadSavedMode();
    }, []);

    const loadSavedMode = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('trade_mode')
            .eq('id', user.id)
            .single();

        if (data?.trade_mode) {
            setModeState(data.trade_mode as TradeMode);
        }
    };

    const setMode = async (newMode: TradeMode) => {
        setModeState(newMode);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ trade_mode: newMode })
                .eq('id', user.id);
        }
    };

    return (
        <TradeModeContext.Provider value={{
            mode,
            setMode,
            isExport: mode === 'export',
            isImport: mode === 'import',
        }}>
            {children}
        </TradeModeContext.Provider>
    );
};

export const useTradeMode = () => {
    const context = useContext(TradeModeContext);
    if (!context) throw new Error('useTradeMode must be used within TradeModeProvider');
    return context;
};