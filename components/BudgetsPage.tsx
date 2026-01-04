import React, { useState, useMemo } from 'react';
import { Budget, Category, TransactionType, expenseCategories } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, getCategoryEmoji, getCategoryColor } from '../utils';

// Circular Progress Component
const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
    percentage,
    size = 80,
    strokeWidth = 8
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const isOverBudget = percentage > 100;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={isOverBudget ? 'text-red-500' : 'text-primary'}
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
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={!!initialData}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {availableCategories.length > 0
                        ? availableCategories.map(cat => <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>)
                        : <option disabled>{initialData ? initialData.category : "Semua kategori sudah punya anggaran"}</option>
                    }
                </select>
                {!!initialData && <p className="text-xs text-gray-500 mt-2">Kategori tidak dapat diubah saat mengedit.</p>}
            </div>

            <CurrencyInput
                label="Batas Anggaran"
                value={formData.budget_limit}
                onChange={(value) => setFormData(prev => ({ ...prev, budget_limit: value }))}
                required
                error={formData.budget_limit <= 0 ? undefined : undefined}
            />

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={availableCategories.length === 0 && !initialData}
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/30 transition-colors disabled:opacity-50"
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
                    <p className="text-sm text-gray-500">Kelola batas pengeluaran per kategori</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Anggaran
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Anggaran</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalBudget)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Terpakai</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sisa</p>
                    <p className={`text-lg font-bold ${stats.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.remaining)}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Melebihi Batas</p>
                    <p className={`text-lg font-bold ${stats.overBudgetCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.overBudgetCount} kategori
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Budget Cards */}
            {filteredBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBudgets.map(budget => {
                        const percentage = budget.budget_limit > 0 ? (budget.spent / budget.budget_limit) * 100 : 0;
                        const isOverBudget = percentage > 100;

                        return (
                            <div
                                key={budget.id}
                                className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(budget.category)} flex items-center justify-center text-xl`}>
                                            {getCategoryEmoji(budget.category)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{budget.category}</h3>
                                            <p className={`text-xs ${isOverBudget ? 'text-red-500' : 'text-gray-500'}`}>
                                                {isOverBudget ? 'Melebihi batas!' : `${formatCurrency(budget.budget_limit - budget.spent)} tersisa`}
                                            </p>
                                        </div>
                                    </div>
                                    <CircularProgress percentage={percentage} size={60} strokeWidth={6} />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Terpakai</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(budget.spent)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Batas</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(budget.budget_limit)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => handleEdit(budget)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(budget)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada anggaran'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {searchQuery ? 'Coba kata kunci lain' : 'Buat anggaran pertama Anda'}
                    </p>
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
