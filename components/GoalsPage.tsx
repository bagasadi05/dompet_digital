import React, { useState, useMemo } from 'react';
import { Goal, TransactionType, Category } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, SearchIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils';

const getDaysRemaining = (targetDate: string): { days: number; text: string; color: string } => {
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, text: 'Terlewat', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' };
    if (diffDays === 0) return { days: 0, text: 'Hari ini', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' };
    if (diffDays <= 30) return { days: diffDays, text: `${diffDays} hari lagi`, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' };
    return { days: diffDays, text: `${diffDays} hari lagi`, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' };
};

const goalIcons = ['🏖️', '💻', '🚗', '🏠', '📚', '💍', '✈️', '🎓', '💰', '🎁'];

// Form Component
interface GoalFormProps {
    onSubmit: (data: Omit<Goal, 'id' | 'currentAmount'> & { id?: string }) => void;
    onClose: () => void;
    initialData?: Goal | null;
}

const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onClose, initialData }) => {
    const [formData, setFormData] = useState({
        id: initialData?.id,
        name: initialData?.name || '',
        targetAmount: initialData?.targetAmount || 0,
        targetDate: initialData ? new Date(initialData.targetDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.targetAmount <= 0 || !formData.name.trim()) {
            return;
        }
        onSubmit({
            ...formData,
            targetDate: new Date(formData.targetDate).toISOString(),
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Impian</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Contoh: Liburan ke Bali"
                />
            </div>

            <CurrencyInput
                label="Target Jumlah"
                value={formData.targetAmount}
                onChange={(value) => setFormData(prev => ({ ...prev, targetAmount: value }))}
                required
            />

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tanggal Target</label>
                <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

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
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
};

const GoalsPage: React.FC = () => {
    const { transactions, goals, addGoal, updateGoal, deleteGoal, addTransaction } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Goal | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [savingsGoal, setSavingsGoal] = useState<Goal | null>(null);
    const [savingsAmount, setSavingsAmount] = useState(0);
    const [savingsDescription, setSavingsDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const goalsWithProgress = useMemo(() => {
        return goals.map(goal => {
            const savedAmount = transactions
                .filter(t => t.goalId === goal.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { ...goal, currentAmount: savedAmount };
        });
    }, [transactions, goals]);

    const filteredGoals = useMemo(() => {
        if (!searchQuery.trim()) return goalsWithProgress;
        return goalsWithProgress.filter(g =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [goalsWithProgress, searchQuery]);

    const stats = useMemo(() => {
        const totalTarget = goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0);
        const totalSaved = goalsWithProgress.reduce((sum, g) => sum + g.currentAmount, 0);
        const completedCount = goalsWithProgress.filter(g => g.currentAmount >= g.targetAmount).length;
        return { totalTarget, totalSaved, completedCount, activeCount: goalsWithProgress.length - completedCount };
    }, [goalsWithProgress]);

    const handleSubmit = async (data: Omit<Goal, 'id' | 'currentAmount'> & { id?: string }) => {
        if (data.id) {
            await updateGoal({ id: data.id, name: data.name, targetAmount: data.targetAmount, targetDate: data.targetDate });
        } else {
            await addGoal({ name: data.name, targetAmount: data.targetAmount, targetDate: data.targetDate });
        }
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteGoal(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingGoal(null);
    };

    const openSavingsModal = (goal: Goal) => {
        setSavingsGoal(goal);
        setSavingsAmount(0);
        setSavingsDescription(`Tabungan untuk ${goal.name}`);
    };

    const closeSavingsModal = () => {
        setSavingsGoal(null);
        setSavingsAmount(0);
        setSavingsDescription('');
    };

    const handleSave = async () => {
        if (!savingsGoal || savingsAmount <= 0) return;
        setIsSaving(true);
        try {
            await addTransaction({
                type: TransactionType.EXPENSE,
                amount: savingsAmount,
                description: savingsDescription || `Tabungan untuk ${savingsGoal.name}`,
                category: Category.TABUNGAN,
                date: new Date().toISOString(),
                goalId: savingsGoal.id,
            });
            closeSavingsModal();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Impian Saya</h2>
                    <p className="text-sm text-gray-500">Wujudkan impian dengan menabung</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Impian
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Target</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalTarget)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Terkumpul</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalSaved)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tercapai</p>
                    <p className="text-lg font-bold text-primary">{stats.completedCount} impian</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Aktif</p>
                    <p className="text-lg font-bold text-orange-600">{stats.activeCount} impian</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari impian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Goal Cards */}
            {filteredGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGoals.map((goal, index) => {
                        const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                        const isCompleted = percentage >= 100;
                        const remaining = getDaysRemaining(goal.targetDate);
                        const icon = goalIcons[index % goalIcons.length];

                        return (
                            <div
                                key={goal.id}
                                className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${isCompleted
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center text-xl">
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <CalendarIcon className="w-3 h-3" />
                                                {formatDate(goal.targetDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${remaining.color}`}>
                                        {remaining.text}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Terkumpul</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
                                    </div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-emerald-400'}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Terkumpul</span>
                                        <span className="font-bold text-green-600">{formatCurrency(goal.currentAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Target</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => openSavingsModal(goal)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                    >
                                        💰 Tabung
                                    </button>
                                    <button
                                        onClick={() => handleEdit(goal)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(goal)}
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
                    <div className="text-5xl mb-4">🎯</div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada impian'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {searchQuery ? 'Coba kata kunci lain' : 'Buat impian pertama Anda'}
                    </p>
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingGoal ? 'Edit Impian' : 'Tambah Impian'}
            >
                <GoalForm
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    initialData={editingGoal}
                />
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Impian?"
                message={`Apakah Anda yakin ingin menghapus impian "${deleteConfirm?.name}"? Semua tabungan terkait impian ini akan dipisahkan.`}
                confirmText="Hapus"
                variant="danger"
            />

            {/* Savings Modal */}
            <Modal
                isOpen={!!savingsGoal}
                onClose={closeSavingsModal}
                title={`Tabung ke ${savingsGoal?.name || 'Impian'}`}
            >
                <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">
                            💡 Tabungan akan dicatat sebagai transaksi dengan kategori "Tabungan & Investasi" dan dialokasikan ke impian ini.
                        </p>
                    </div>

                    <CurrencyInput
                        label="Jumlah Tabungan"
                        value={savingsAmount}
                        onChange={setSavingsAmount}
                        required
                        autoFocus
                    />

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Deskripsi (Opsional)
                        </label>
                        <input
                            type="text"
                            value={savingsDescription}
                            onChange={(e) => setSavingsDescription(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Contoh: Tabungan mingguan"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={closeSavingsModal}
                            className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={savingsAmount <= 0 || isSaving}
                            className="flex-1 h-12 px-4 text-sm font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Menyimpan...' : '💰 Tabung Sekarang'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GoalsPage;
