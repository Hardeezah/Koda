import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTradeMode } from '../../context/TradeModeContext';

const OPTIONS = [
    { value: 'import', label: 'Import', icon: 'download', desc: 'Bringing goods into Nigeria' },
    { value: 'export', label: 'Export', icon: 'upload', desc: 'Sending goods out of Nigeria' },
] as const;

export const TradeModeToggle = () => {
    const { mode, setMode } = useTradeMode();
    const [open, setOpen] = useState(false);
    const btnRef = useRef<View>(null);
    const [btnY, setBtnY] = useState(0);
    const [btnX, setBtnX] = useState(0);

    const active = OPTIONS.find((o) => o.value === mode)!;

    const measureBtn = () => {
        btnRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
            setBtnX(pageX);
            setBtnY(pageY + _h + 4);
        });
    };

    const handleOpen = () => {
        measureBtn();
        setOpen(true);
    };

    const handleSelect = async (val: 'import' | 'export') => {
        await setMode(val);
        setOpen(false);
    };

    return (
        <>
            {/* ── Compact chip ──────────────────────────────────────────────── */}
            <TouchableOpacity
                ref={btnRef}
                onPress={handleOpen}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
            >
                <Feather
                    name={active.icon}
                    size={11}
                    color="rgba(255,255,255,0.5)"
                />
                <Text
                    style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                    className="text-white/70 text-[11px] uppercase tracking-wider"
                >
                    {active.label}
                </Text>
                <Feather
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={11}
                    color="rgba(255,255,255,0.3)"
                />
            </TouchableOpacity>

            {/* ── Dropdown modal ────────────────────────────────────────────── */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setOpen(false)}
            >
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View className="flex-1">
                        {/* Card positioned below the chip */}
                        <View
                            style={{
                                position: 'absolute',
                                top: btnY,
                                left: btnX,
                                minWidth: 200,
                                height: 150,
                            }}
                            className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {OPTIONS.map((opt, i) => {
                                const selected = mode === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => handleSelect(opt.value)}
                                        activeOpacity={0.7}
                                        className={`flex-row items-center gap-3 px-4 py-3.5 ${i < OPTIONS.length - 1 ? 'border-b border-white/5' : ''
                                            } ${selected ? 'bg-white/5' : ''}`}
                                    >
                                        {/* Icon */}
                                        <View
                                            className={`w-8 h-8 rounded-xl items-center justify-center ${selected ? 'bg-emerald-500/20' : 'bg-white/5'
                                                }`}
                                        >
                                            <Feather
                                                name={opt.icon}
                                                size={14}
                                                color={selected ? '#10b981' : 'rgba(255,255,255,0.4)'}
                                            />
                                        </View>

                                        {/* Text */}
                                        <View className="flex-1">
                                            <Text
                                                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                                                className={`text-sm ${selected ? 'text-green-500' : 'text-white/80'
                                                    }`}
                                            >
                                                {opt.label}
                                            </Text>
                                            <Text
                                                style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                                                className="text-white/30 text-[10px] mt-0.5"
                                            >
                                                {opt.desc}
                                            </Text>
                                        </View>

                                        {/* Check */}
                                        {selected && (
                                            <Feather name="check" size={14} color="#10b981" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};