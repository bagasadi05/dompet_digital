import React, { useState, useMemo } from 'react';
import CountUp from './common/CountUp';
import { Goal, TransactionType, Category } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, SearchIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils';

const getDaysRemaining = (targetDate: string): { days: number; text: string; color: string; bg: string } => {
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, text: 'Terlewat', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' };
    if (diffDays === 0) return { days: 0, text: 'Hari ini', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    if (diffDays <= 30) return { days: diffDays, text: `${diffDays} hari lagi`, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { days: diffDays, text: `${diffDays} hari lagi`, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Impian</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm"
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tanggal Target</label>
                <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm"
                />
            </div>

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
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-primary to-emerald-500 rounded-2xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-center uppercase tracking-wide"
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Wujudkan impian dengan menabung</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary-dark hover:to-emerald-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5 drop-shadow-sm" />
                    Tambah Impian
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Target</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        <CountUp end={stats.totalTarget} formattingFn={formatCurrency} />
                    </p>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terkumpul</p>
                    <p className="text-xl md:text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 tracking-tight">
                        <CountUp end={stats.totalSaved} formattingFn={formatCurrency} />
                    </p>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tercapai</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl md:text-2xl font-extrabold text-primary tracking-tight">
                            <CountUp end={stats.completedCount} suffix=" impian" />
                        </p>
                        {stats.completedCount > 0 && <span className="text-lg animate-bounce">🎉</span>}
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Aktif</p>
                    <p className="text-xl md:text-2xl font-extrabold text-orange-500 dark:text-orange-400 tracking-tight">
                        <CountUp end={stats.activeCount} suffix=" impian" />
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Cari impian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                />
            </div>

            {/* Goal Cards */}
            {filteredGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGoals.map((goal, index) => {
                        const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                        const isCompleted = percentage >= 100;
                        const remaining = getDaysRemaining(goal.targetDate);
                        const icon = goalIcons[index % goalIcons.length];

                        return (
                            <div
                                key={goal.id}
                                className={`glass-panel relative p-6 rounded-[24px] border shadow-sm transition-all duration-300 hover:scale-[1.01] group overflow-hidden ${isCompleted
                                    ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/50'
                                    : 'hover:border-emerald-100 dark:hover:border-emerald-900/30'
                                    }`}
                            >
                                {isCompleted && (
                                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                                        <div className="text-9xl">🏆</div>
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isCompleted ? 'bg-white/50 dark:bg-white/10' : 'bg-gradient-to-br from-primary/10 to-emerald-400/10'}`}>
                                            {icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{goal.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                {formatDate(goal.targetDate)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${remaining.bg} ${remaining.color}`}>
                                        {remaining.text}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6 relative z-10">
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-gray-500 dark:text-gray-400">Progres</span>
                                        <span className={`font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{Math.round(percentage)}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary to-emerald-400'}`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                    {!isCompleted && percentage > 0 && percentage < 100 && (
                                        <p className="text-xs text-right text-gray-400 mt-1.5 font-medium">
                                            Kurang <span className="text-orange-500 font-bold">{formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between items-end mb-6 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100/50 dark:border-white/5 relative z-10 backdrop-blur-sm">
                                    <div className="text-sm">
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Terkumpul</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{formatCurrency(goal.currentAmount)}</span>
                                    </div>
                                    <div className="text-right text-sm">
                                        <span className="block text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Target</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-5 border-t border-gray-100 dark:border-white/5 relative z-10">
                                    {!isCompleted && (
                                        <button
                                            onClick={() => openSavingsModal(goal)}
                                            className="flex-[2] flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            💰 Tabung
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(goal)}
                                        className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(goal)}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-500 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-panel p-12 rounded-[24px] text-center shadow-sm">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-4xl mb-4 mx-auto animate-bounce-slow">
                        🎯
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada impian'}
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        {searchQuery ? 'Coba kata kunci lain' : 'Mulai wujudkan impian Anda dengan menetapkan target tabungan.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
                        >
                            Buat Impian Baru
                        </button>
                    )}
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
                <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex gap-3">
                        <div className="text-2xl">💡</div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                            Tabungan akan dicatat sebagai transaksi dengan kategori "Tabungan & Investasi" dan dialokasikan ke impian ini.
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
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Deskripsi (Opsional)
                        </label>
                        <input
                            type="text"
                            value={savingsDescription}
                            onChange={(e) => setSavingsDescription(e.target.value)}
                            className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm"
                            placeholder="Contoh: Tabungan mingguan"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={closeSavingsModal}
                            className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={savingsAmount <= 0 || isSaving}
                            className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
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
