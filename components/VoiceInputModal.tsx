import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createVoiceInput, isVoiceInputSupported, VoiceInputController } from '../services/voiceInputService';
import { parseVoiceInput, ParsedTransaction } from '../services/voiceParserService';

import { XMarkIcon, CheckIcon, PaperAirplaneIcon } from './common/Icons';

// Microphone Icon
const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
);

// Keyboard Icon
const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6ZM3.75 6h.008v.008H3.75V6Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 0h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 4.5h.008v.008h-.008V15Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0h.008v.008h-.008V15Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 4.5h15" />
    </svg>
);

interface VoiceInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (result: ParsedTransaction) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';
type InputMode = 'voice' | 'text';

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ isOpen, onClose, onResult }) => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [inputMode, setInputMode] = useState<InputMode>('voice');
    const [textInput, setTextInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);
    const [transcriptText, setTranscriptText] = useState(''); // Rename to avoid unused warning if strictly checked, but actually used in render. Wait, "transcript" IS used in render line 153.
    const voiceControllerRef = useRef<VoiceInputController | null>(null);

    const isSupported = isVoiceInputSupported();

    const handleVoiceResult = useCallback(async (text: string, isFinal: boolean) => {
        setTranscriptText(text); // Use state

        if (isFinal && text.trim()) {
            setVoiceState('processing');
            const result = await parseVoiceInput(text);
            setParsedResult(result);

            if (result.success) {
                setVoiceState('success');
            } else {
                setErrorMessage(result.error || 'Gagal memproses ucapan');
                setVoiceState('error');
            }
        }
    }, []);

    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;
        setVoiceState('processing');
        // Use parseVoiceInput for text too as it parses natural language
        const result = await parseVoiceInput(textInput);
        setParsedResult(result);

        if (result.success) {
            setVoiceState('success');
        } else {
            setErrorMessage(result.error || 'Gagal memproses teks');
            setVoiceState('error');
        }
    };

    const startListening = useCallback(() => {
        setTranscriptText('');
        setErrorMessage('');
        setParsedResult(null);
        setVoiceState('listening');

        const controller = createVoiceInput({
            onStart: () => setVoiceState('listening'),
            onResult: handleVoiceResult,
            onError: (error) => {
                setErrorMessage(error);
                setVoiceState('error');
            },
            onEnd: () => {
                if (voiceState === 'listening') {
                    // If no final result yet, stay in current state
                }
            }
        });

        voiceControllerRef.current = controller;
        controller.start();
    }, [handleVoiceResult, voiceState]);

    const stopListening = useCallback(() => {
        voiceControllerRef.current?.stop();
    }, []);

    const handleConfirm = () => {
        if (parsedResult?.success) {
            onResult(parsedResult);
            onClose();
        }
    };

    const handleRetry = () => {
        setVoiceState('idle');
        setTranscriptText('');
        setTextInput('');
        setErrorMessage('');
        setParsedResult(null);
        // If mode was text, stay in text, if voice stay in voice
    };

    const switchToTextMode = () => {
        setInputMode('text');
        handleRetry();
    };

    const switchToVoiceMode = () => {
        setInputMode('voice');
        handleRetry();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            voiceControllerRef.current?.stop();
        };
    }, []);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            handleRetry();
            setInputMode('voice'); // Reset to voice mode default
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {inputMode === 'voice' ? (
                            <MicrophoneIcon className="w-5 h-5 text-primary" />
                        ) : (
                            <KeyboardIcon className="w-5 h-5 text-primary" />
                        )}
                        {inputMode === 'voice' ? 'Input Suara' : 'Input Teks'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={inputMode === 'voice' ? switchToTextMode : switchToVoiceMode}
                            className="p-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                            {inputMode === 'voice' ? 'Ketik Manual' : 'Input Suara'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {inputMode === 'voice' && !isSupported ? (
                        <div className="text-center py-8">
                            <MicrophoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Browser Anda tidak mendukung input suara.</p>
                            <button
                                onClick={switchToTextMode}
                                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-xl font-medium"
                            >
                                Gunakan Mode Teks
                            </button>
                        </div>
                    ) : inputMode === 'voice' ? (
                        <>
                            {/* Generic States for Voice */}
                            {voiceState === 'idle' && (
                                <div className="text-center py-8">
                                    <button
                                        onClick={startListening}
                                        className="w-24 h-24 rounded-full text-white flex items-center justify-center mx-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95"
                                        style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}
                                    >
                                        <MicrophoneIcon className="w-10 h-10 text-white" />
                                    </button>
                                    <p className="text-sm text-gray-500 mt-4">Klik untuk mulai berbicara</p>
                                    <p className="text-xs text-gray-400 mt-1">Contoh: "Beli makan siang tiga puluh ribu"</p>
                                </div>
                            )}

                            {voiceState === 'listening' && (
                                <div className="text-center py-8">
                                    <div className="relative w-24 h-24 mx-auto mb-4">
                                        <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
                                        <div className="absolute inset-2 rounded-full bg-purple-500/30 animate-pulse" />
                                        <button
                                            onClick={stopListening}
                                            className="relative w-full h-full rounded-full text-white flex items-center justify-center shadow-lg transition-all"
                                            style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}
                                        >
                                            <MicrophoneIcon className="w-10 h-10 text-white" />
                                        </button>
                                    </div>
                                    <p className="text-purple-600 dark:text-purple-400 font-medium">Mendengarkan...</p>
                                    {transcriptText && (
                                        <p className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                                            "{transcriptText}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        // Text Input Mode
                        <>
                            {voiceState === 'idle' && (
                                <div className="space-y-4">
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Contoh: Beli bensin 25.000 kategori transportasi"
                                        className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent resize-none dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleTextSubmit}
                                        disabled={!textInput.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        <PaperAirplaneIcon className="w-5 h-5" />
                                        Proses
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Shared states (Processing, Success, Error) */}

                    {/* Processing State */}
                    {voiceState === 'processing' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Memproses...</p>
                            {transcriptText && (
                                <p className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                                    "{transcriptText}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* Success State */}
                    {voiceState === 'success' && parsedResult && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <CheckIcon className="w-6 h-6 text-green-500" />
                                <span className="text-green-700 dark:text-green-400 font-medium">Berhasil diparsing!</span>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tipe</span>
                                    <span className={`font-medium ${parsedResult.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}`}>
                                        {parsedResult.type === 'pemasukan' ? '+ Pemasukan' : '- Pengeluaran'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Jumlah</span>
                                    <span className="font-bold text-primary">
                                        Rp {parsedResult.amount?.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Deskripsi</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{parsedResult.description}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Kategori</span>
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                        {parsedResult.category}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Ulang
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 px-4 text-white rounded-xl font-medium transition-colors"
                                    style={{ backgroundColor: '#10B981' }}
                                >
                                    Gunakan
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {voiceState === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <XMarkIcon className="w-6 h-6 text-red-500" />
                                <span className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                                >
                                    Coba Lagi
                                </button>
                                {inputMode === 'voice' && (
                                    <button
                                        onClick={switchToTextMode}
                                        className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Ketik Manual
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default VoiceInputModal;
