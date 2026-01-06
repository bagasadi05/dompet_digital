import React, { useState } from 'react';
import { parseVoiceInput, ParsedTransaction } from '../services/voiceParserService';

import { XMarkIcon, CheckIcon, PaperAirplaneIcon } from './common/Icons';

// Keyboard Icon
const KeyboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6ZM3.75 6h.008v.008H3.75V6Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 0h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0h.008v.008h-.008V10.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 4.5h.008v.008h-.008V15Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0h.008v.008h-.008V15Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-4.5 4.5h15" />
    </svg>
);

interface TextInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (result: ParsedTransaction) => void;
}

type InputState = 'idle' | 'processing' | 'success' | 'error';

const VoiceInputModal: React.FC<TextInputModalProps> = ({ isOpen, onClose, onResult }) => {
    const [inputState, setInputState] = useState<InputState>('idle');
    const [textInput, setTextInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [parsedResult, setParsedResult] = useState<ParsedTransaction | null>(null);

    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;
        setInputState('processing');
        const result = await parseVoiceInput(textInput);
        setParsedResult(result);

        if (result.success) {
            setInputState('success');
        } else {
            setErrorMessage(result.error || 'Gagal memproses teks');
            setInputState('error');
        }
    };

    const handleConfirm = () => {
        if (parsedResult?.success) {
            onResult(parsedResult);
            handleReset();
            onClose();
        }
    };

    const handleReset = () => {
        setInputState('idle');
        setTextInput('');
        setErrorMessage('');
        setParsedResult(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && textInput.trim() && inputState === 'idle') {
            e.preventDefault();
            handleTextSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <KeyboardIcon className="w-5 h-5 text-primary" />
                        Input Transaksi AI
                    </h2>
                    <button
                        onClick={() => { handleReset(); onClose(); }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Idle State - Text Input */}
                    {inputState === 'idle' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">
                                    Ketik transaksi Anda dalam bahasa natural:
                                </p>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Contoh: Beli bensin 25 ribu, makan siang 35000, gaji bulan ini 5 juta"
                                    className="w-full h-28 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent resize-none dark:text-white text-sm"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={handleTextSubmit}
                                disabled={!textInput.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                                Proses dengan AI
                            </button>
                        </div>
                    )}

                    {/* Processing State */}
                    {inputState === 'processing' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">AI sedang memproses...</p>
                            <p className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm">
                                "{textInput}"
                            </p>
                        </div>
                    )}

                    {/* Success State */}
                    {inputState === 'success' && parsedResult && (
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
                                    onClick={handleReset}
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
                    {inputState === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <XMarkIcon className="w-6 h-6 text-red-500" />
                                <span className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</span>
                            </div>
                            <button
                                onClick={handleReset}
                                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceInputModal;

