import React from 'react';
import { AIAction } from '../services/aiActionTypes';
import { CheckIcon, XMarkIcon, PlusIcon, TrashIcon, PencilIcon } from './common/Icons';

interface AIActionConfirmDialogProps {
    action: AIAction | null;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const AIActionConfirmDialog: React.FC<AIActionConfirmDialogProps> = ({
    action,
    onConfirm,
    onCancel,
    isLoading = false
}) => {
    if (!action) return null;

    const { preview } = action;

    const getVariantStyles = () => {
        switch (preview.variant) {
            case 'add':
                return {
                    icon: <PlusIcon className="w-6 h-6" />,
                    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                };
            case 'delete':
                return {
                    icon: <TrashIcon className="w-6 h-6" />,
                    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                };
            case 'update':
                return {
                    icon: <PencilIcon className="w-6 h-6" />,
                    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                };
            default:
                return {
                    icon: <CheckIcon className="w-6 h-6" />,
                    iconBg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                    confirmBtn: 'bg-primary hover:bg-primary-dark focus:ring-primary'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                            {styles.icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {preview.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Konfirmasi aksi dari AI
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                    {preview.details.map((detail, index) => (
                        <div
                            key={`${detail.label}-${index}`}
                            className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                        >
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {detail.label}
                            </span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {detail.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="p-5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <XMarkIcon className="w-5 h-5" />
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.confirmBtn}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckIcon className="w-5 h-5" />
                        )}
                        Konfirmasi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIActionConfirmDialog;
