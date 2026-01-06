import React, { useState, useMemo } from 'react';
import { Budget, Category, TransactionType, expenseCategories } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, getCategoryEmoji, getCategoryColor } from '../utils';

// Circular Progress Component
// Circular Progress Component - Premium Style
const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number; colorClass?: string }> = ({
    percentage,
    size = 80,
    strokeWidth = 8,
    colorClass = 'text-primary'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const isOverBudget = percentage > 100;

    // Determine color based on status
    const strokeColor = isOverBudget ? 'text-rose-500' : colorClass;
    const glowColor = isOverBudget ? 'drop-shadow-[0_0_4px_rgba(244,63,94,0.5)]' : 'drop-shadow-[0_0_4px_rgba(0,208,156,0.5)]';

    return (
        <div className="relative flex-none" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-gray-100 dark:text-gray-700/50"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${strokeColor} transition-all duration-1000 ease-out ${glowColor}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-sm font-bold ${isOverBudget ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                    {Math.round(percentage)}%
                </span>
            </div>
        </div>
    );
};

// Form Component
interface BudgetFormProps {
    onSubmit: (data: { id?: string; category: Category; budget_limit: number }) => void;
    onClose: () => void;
    initialData?: { id: string; category: Category; budget_limit: number } | null;
    existingCategories: Category[];
}

const BudgetForm: React.FC<BudgetFormProps> = ({ onSubmit, onClose, initialData, existingCategories }) => {
    const [formData, setFormData] = useState({
        id: initialData?.id,
        category: initialData?.category || expenseCategories.find(cat => !existingCategories.includes(cat)) || expenseCategories[0],
        budget_limit: initialData?.budget_limit || 0,
    });

    const availableCategories = expenseCategories.filter(
        cat => !existingCategories.includes(cat) || (initialData && cat === initialData.category)
    );

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, category: e.target.value as Category }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.budget_limit <= 0) {
            return;
        }
        onSubmit(formData);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
                <div className="relative">
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={!!initialData}
                        className="w-full h-14 px-4 pr-10 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none transition-all text-base font-medium cursor-pointer"
                    >
                        {availableCategories.length > 0
                            ? availableCategories.map(cat => <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>)
                            : <option disabled>{initialData ? initialData.category : "Semua kategori sudah punya anggaran"}</option>
                        }
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
                {!!initialData && <p className="text-xs text-gray-500 mt-2 ml-1">Kategori tidak dapat diubah saat mengedit.</p>}
            </div>

            <CurrencyInput
                label="Batas Anggaran"
                value={formData.budget_limit}
                onChange={(value) => setFormData(prev => ({ ...prev, budget_limit: value }))}
                required
                error={formData.budget_limit <= 0 ? undefined : undefined}
                autoFocus
            />

            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={availableCategories.length === 0 && !initialData}
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-primary to-teal-500 rounded-2xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-center uppercase tracking-wide disabled:opacity-50 disabled:shadow-none"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
};

const BudgetsPage: React.FC = () => {
    const { transactions, budgets, addBudget, updateBudget, deleteBudget } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Budget | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const currentMonthYear = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    const budgetsWithSpent = useMemo(() => {
        const monthlyExpenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthYear))
            .reduce((acc, t) => {
                acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
                return acc;
            }, new Map<string, number>());

        return budgets.map(budget => ({
            ...budget,
            spent: monthlyExpenses.get(budget.category) || 0,
        }));
    }, [transactions, budgets, currentMonthYear]);

    const filteredBudgets = useMemo(() => {
        if (!searchQuery.trim()) return budgetsWithSpent;
        return budgetsWithSpent.filter(b =>
            b.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [budgetsWithSpent, searchQuery]);

    const stats = useMemo(() => {
        const totalBudget = budgetsWithSpent.reduce((sum, b) => sum + b.budget_limit, 0);
        const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);
        const overBudgetCount = budgetsWithSpent.filter(b => b.spent > b.budget_limit).length;
        return { totalBudget, totalSpent, overBudgetCount, remaining: totalBudget - totalSpent };
    }, [budgetsWithSpent]);

    const existingCategories = budgets.map(b => b.category);

    const handleSubmit = async (data: { id?: string; category: Category; budget_limit: number }) => {
        if (data.id) {
            await updateBudget(data as { id: string; category: Category; budget_limit: number });
        } else {
            await addBudget({ category: data.category, budget_limit: data.budget_limit });
        }
    };

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteBudget(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBudget(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Anggaran Bulanan</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola batas pengeluaran per kategori</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-teal-500 hover:from-primary-dark hover:to-teal-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5 drop-shadow-sm" />
                    Tambah Anggaran
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Anggaran</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatCurrency(stats.totalBudget)}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terpakai</p>
                    <p className="text-xl md:text-2xl font-extrabold text-orange-500 dark:text-orange-400 tracking-tight">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sisa</p>
                    <p className={`text-xl md:text-2xl font-extrabold tracking-tight ${stats.remaining >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                        {formatCurrency(stats.remaining)}
                    </p>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xl md:text-2xl font-extrabold tracking-tight ${stats.overBudgetCount > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                            {stats.overBudgetCount > 0 ? `${stats.overBudgetCount} Over` : 'Aman'}
                        </span>
                        {stats.overBudgetCount === 0 && <span className="text-emerald-500">✨</span>}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Cari kategori anggaran..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all shadow-sm"
                />
            </div>

            {/* Budget Cards */}
            {filteredBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBudgets.map(budget => {
                        const percentage = budget.budget_limit > 0 ? (budget.spent / budget.budget_limit) * 100 : 0;
                        const isOverBudget = percentage > 100;
                        const categoryColor = getCategoryColor(budget.category);
                        // Extract base color from gradient class or use default
                        const baseColorClass = isOverBudget ? 'text-rose-500' : 'text-primary';

                        return (
                            <div
                                key={budget.id}
                                className="relative overflow-hidden p-6 rounded-[24px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 group"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 dark:opacity-[0.02] dark:group-hover:opacity-5 transition-opacity pointer-events-none transform scale-150 origin-top-right">
                                    <div className={`w-32 h-32 rounded-full bg-current ${baseColorClass}`} />
                                </div>

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl ${categoryColor} flex items-center justify-center text-2xl shadow-inner border border-black/5 dark:border-white/10 group-hover:scale-105 transition-transform duration-300`}>
                                            {getCategoryEmoji(budget.category)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{budget.category}</h3>
                                            <p className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md inline-block mt-1 ${isOverBudget ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                {isOverBudget ? 'Over Budget' : 'Aman'}
                                            </p>
                                        </div>
                                    </div>
                                    <CircularProgress percentage={percentage} size={64} strokeWidth={6} />
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between text-sm items-end">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Terpakai</span>
                                        <span className={`font-bold ${isOverBudget ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(budget.spent)}</span>
                                    </div>

                                    {/* Linear Progress Bar */}
                                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-primary to-teal-400'} ${isOverBudget ? '' : 'shadow-[0_0_10px_rgba(0,208,156,0.4)]'}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-sm items-end">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">Batas</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(budget.budget_limit)}</span>
                                    </div>

                                    {!isOverBudget && (
                                        <p className="text-xs text-right text-gray-400 font-medium pt-1">
                                            Sisa: <span className="text-emerald-500 font-bold">{formatCurrency(budget.budget_limit - budget.spent)}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-white/5 relative z-10">
                                    <button
                                        onClick={() => handleEdit(budget)}
                                        className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(budget)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                        title="Hapus"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 rounded-[24px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-700/30 flex items-center justify-center text-4xl mb-4 mx-auto animate-bounce-slow">
                        📊
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada anggaran'}
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        {searchQuery ? 'Coba kata kunci lain' : 'Buat anggaran pertama Anda untuk mulai mengontrol pengeluaran.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
                        >
                            Buat Anggaran Sekarang
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingBudget ? 'Edit Anggaran' : 'Tambah Anggaran'}
            >
                <BudgetForm
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    initialData={editingBudget ? { id: editingBudget.id, category: editingBudget.category, budget_limit: editingBudget.budget_limit } : null}
                    existingCategories={existingCategories}
                />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Anggaran?"
                message={`Apakah Anda yakin ingin menghapus anggaran untuk kategori "${deleteConfirm?.category}"?`}
                confirmText="Hapus"
                variant="danger"
            />
        </div>
    );
};

export default BudgetsPage;
