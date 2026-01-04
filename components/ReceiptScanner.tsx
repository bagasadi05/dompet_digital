import React, { useState, useRef } from 'react';
import { scanReceipt, fileToBase64, ReceiptScanResult } from '../services/receiptScanService';
import {
    CameraIcon,
    PhotoIcon,
    XMarkIcon,
    DocumentMagnifyingGlassIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from './common/Icons';
import { formatCurrency } from '../utils';

interface ReceiptScannerProps {
    onScanComplete: (result: ReceiptScanResult) => void;
    onClose: () => void;
}

type ScanState = 'idle' | 'previewing' | 'scanning' | 'success' | 'error';

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onClose }) => {
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await fileToBase64(file);
            setImagePreview(base64);
            setScanState('previewing');
        } catch (error) {
            setErrorMessage('Gagal membaca file gambar');
            setScanState('error');
        }
    };

    const handleScan = async () => {
        if (!imagePreview) return;

        setScanState('scanning');
        setErrorMessage('');

        const result = await scanReceipt(imagePreview);
        setScanResult(result);

        if (result.success) {
            setScanState('success');
        } else {
            setErrorMessage(result.error || 'Gagal memindai struk');
            setScanState('error');
        }
    };

    const handleConfirm = () => {
        if (scanResult?.success) {
            onScanComplete(scanResult);
        }
    };

    const handleRetry = () => {
        setImagePreview(null);
        setScanResult(null);
        setErrorMessage('');
        setScanState('idle');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DocumentMagnifyingGlassIcon className="w-5 h-5 text-primary" />
                        Scan Struk
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Idle State - Upload/Camera Options */}
                    {scanState === 'idle' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Pilih cara untuk memindai struk belanja Anda
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                                >
                                    <CameraIcon className="w-8 h-8 text-primary" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kamera</span>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl hover:border-primary hover:bg-primary/5 transition-all"
                                >
                                    <PhotoIcon className="w-8 h-8 text-primary" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Galeri</span>
                                </button>
                            </div>

                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Preview State */}
                    {(scanState === 'previewing' || scanState === 'scanning') && imagePreview && (
                        <div className="space-y-4">
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                                <img
                                    src={imagePreview}
                                    alt="Preview struk"
                                    className="w-full max-h-64 object-contain bg-gray-50 dark:bg-gray-700"
                                />
                                {scanState === 'scanning' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-sm">Memindai struk...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {scanState === 'previewing' && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRetry}
                                        className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Ganti Gambar
                                    </button>
                                    <button
                                        onClick={handleScan}
                                        className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                                    >
                                        <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                                        Scan
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success State */}
                    {scanState === 'success' && scanResult && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <span className="text-green-700 dark:text-green-400 font-medium">Struk berhasil dipindai!</span>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                                {scanResult.merchant && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Toko</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{scanResult.merchant}</span>
                                    </div>
                                )}
                                {scanResult.date && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tanggal</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{scanResult.date}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Jumlah Item</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{scanResult.items?.length || 0} item</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <span className="text-gray-500">Total</span>
                                    <span className="font-bold text-primary text-lg">{formatCurrency(scanResult.total || 0)}</span>
                                </div>
                                {scanResult.suggestedCategory && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Kategori</span>
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                            {scanResult.suggestedCategory}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Scan Ulang
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                                >
                                    Gunakan Data
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {scanState === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <ExclamationCircleIcon className="w-6 h-6 text-red-500" />
                                <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                            </div>

                            <button
                                onClick={handleRetry}
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

export default ReceiptScanner;
