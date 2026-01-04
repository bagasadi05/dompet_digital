import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category, expenseCategories, incomeCategories } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    DownloadIcon,
    FilterIcon,
    SearchIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    ChevronDownIcon,
    RefreshIcon,
    CameraIcon,
} from './common/Icons';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { exportTransactionsToPDF } from '../utils/exportUtils';
import { formatCurrency, formatDate, getCategoryEmoji, getCategoryColor } from '../utils';
import ReceiptScanner from './ReceiptScanner';
import { ReceiptScanResult } from '../services/receiptScanService';
import VoiceInputModal from './VoiceInputModal';
import { ParsedTransaction } from '../services/voiceParserService';

// Form Component
interface TransactionFormProps {
    onSubmit: (data: Omit<Transaction, 'id'> & { id?: string }) => void;
    onClose: () => void;
    initialData?: Transaction | null;
    goals: { id: string; name: string }[];
    bills: { id: string; name: string; amount: number }[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onClose, initialData, goals, bills }) => {
    const [formData, setFormData] = useState({
        id: initialData?.id,
        type: initialData?.type || TransactionType.EXPENSE,
        amount: initialData?.amount || 0,
        category: initialData?.category || Category.MAKANAN,
        description: initialData?.description || '',
        date: initialData ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        goalId: initialData?.goalId,
        billId: initialData?.billId,
    });

    // Derived state for categories based on type
    const currentCategories = useMemo(() => {
        return formData.type === TransactionType.EXPENSE ? expenseCategories : incomeCategories;
    }, [formData.type]);

    // Handle category/type sync
    useMemo(() => {
        if (!initialData) {
            if (formData.type === TransactionType.INCOME && !incomeCategories.includes(formData.category)) {
                setFormData(prev => ({ ...prev, category: Category.GAJI }));
            } else if (formData.type === TransactionType.EXPENSE && !expenseCategories.includes(formData.category)) {
                setFormData(prev => ({ ...prev, category: Category.MAKANAN }));
            }
        }
    }, [formData.type]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Auto-fill amount and description when selecting a bill
    const handleBillSelect = (billId: string) => {
        const selectedBill = bills.find(b => b.id === billId);
        if (selectedBill) {
            setFormData(prev => ({
                ...prev,
                billId,
                amount: selectedBill.amount,
                description: `Pembayaran ${selectedBill.name}`,
            }));
        } else {
            setFormData(prev => ({ ...prev, billId: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0 || !formData.description.trim()) {
            return;
        }
        onSubmit({
            ...formData,
            date: new Date(formData.date).toISOString(),
        });
        onClose();
    };

    const isSavingTransaction = formData.category === Category.TABUNGAN;
    const isBillTransaction = formData.category === Category.TAGIHAN;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.EXPENSE }))}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-bold transition-all ${formData.type === TransactionType.EXPENSE ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Pengeluaran
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.INCOME }))}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-bold transition-all ${formData.type === TransactionType.INCOME ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}
                >
                    Pemasukan
                </button>
            </div>

            <CurrencyInput
                label="Jumlah"
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                required
                autoFocus
            />

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
                <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Contoh: Belanja bulanan"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                >
                    {currentCategories.map(cat => <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>)}
                </select>
            </div>

            {isSavingTransaction && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alokasikan ke Impian</label>
                    <select
                        name="goalId"
                        value={formData.goalId || ''}
                        onChange={handleChange}
                        required
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                        <option value="" disabled>Pilih Impian...</option>
                        {goals.length > 0 ? (
                            goals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)
                        ) : (
                            <option value="" disabled>Belum ada impian dibuat</option>
                        )}
                    </select>
                </div>
            )}

            {isBillTransaction && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Terkait dengan Tagihan (Opsional)</label>
                    <select
                        name="billId"
                        value={formData.billId || ''}
                        onChange={(e) => handleBillSelect(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                        <option value="">Tidak ada / Manual</option>
                        {bills.length > 0 ? (
                            bills.map(bill => <option key={bill.id} value={bill.id}>{bill.name} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bill.amount)}</option>)
                        ) : (
                            <option value="" disabled>Belum ada tagihan dibuat</option>
                        )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Pilih tagihan untuk mengisi otomatis jumlah dan deskripsi</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tanggal</label>
                <input
                    type="date"
                    name="date"
                    value={formData.date}
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

// Simplified Props for Dashboard/Modal usage
interface TransactionsPageProps {
    isSimplified?: boolean;
    onClose?: () => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ isSimplified, onClose }) => {
    const { transactions, goals, bills, addTransaction, updateTransaction, deleteTransaction, refreshData } = useData();
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);

    // Filter States
    const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth'>('thisMonth');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        if (onClose) onClose();
    };

    const handleSubmit = async (data: Omit<Transaction, 'id'> & { id?: string }) => {
        if (data.id) {
            await updateTransaction(data as Transaction);
        } else {
            await addTransaction(data);
        }
    };

    const handleEdit = (tx: Transaction) => {
        setEditingTransaction(tx);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteTransaction(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handleExport = () => {
        exportTransactionsToPDF(filteredTransactions);
        showToast({
            type: 'success',
            title: 'Export Berhasil',
            message: 'Daftar transaksi berhasil diunduh dalam format PDF.'
        });
    }

    const resetFilters = () => {
        setTypeFilter('all');
        setCategoryFilter('all');
        setDateFilter('thisMonth');
        setSearchQuery('');
        setCurrentPage(1);
    };

    const handleScanComplete = (result: ReceiptScanResult) => {
        setIsScannerOpen(false);
        if (result.success) {
            // Pre-fill edit data with scanned result and open modal
            setEditingTransaction({
                id: '', // Will be treated as new
                type: TransactionType.EXPENSE,
                amount: result.total || 0,
                category: (result.suggestedCategory as Category) || Category.LAINNYA,
                description: result.merchant || 'Pembelian dari struk',
                date: result.date || new Date().toISOString(),
            } as Transaction);
            setIsModalOpen(true);
            showToast({
                type: 'success',
                title: 'Struk Berhasil Dipindai',
                message: `Total: ${formatCurrency(result.total || 0)}`
            });
        }
    };

    const handleVoiceResult = (result: ParsedTransaction) => {
        if (result.success) {
            setEditingTransaction({
                id: '',
                type: result.type === 'pemasukan' ? TransactionType.INCOME : TransactionType.EXPENSE,
                amount: result.amount || 0,
                category: (result.category as Category) || Category.LAINNYA,
                description: result.description || 'Transaksi via suara',
                date: new Date().toISOString(),
            } as Transaction);
            setIsModalOpen(true);
            showToast({
                type: 'success',
                title: 'Suara Berhasil Diproses',
                message: result.description || 'Transaksi terdeteksi'
            });
        }
    };

    // Filtered & Paginated Transactions
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(tx =>
                tx.description.toLowerCase().includes(query) ||
                tx.category.toLowerCase().includes(query) ||
                tx.amount.toString().includes(query)
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(tx => tx.type === typeFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(tx => tx.category === categoryFilter);
        }

        // Date filter
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        if (dateFilter === 'thisMonth') {
            result = result.filter(tx => new Date(tx.date) >= thisMonthStart);
        } else if (dateFilter === 'lastMonth') {
            result = result.filter(tx => {
                const d = new Date(tx.date);
                return d >= lastMonthStart && d <= lastMonthEnd;
            });
        }

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, typeFilter, categoryFilter, dateFilter, searchQuery]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    // Stats
    const stats = useMemo(() => {
        const totalIncome = filteredTransactions
            .filter(tx => tx.type === TransactionType.INCOME)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpense = filteredTransactions
            .filter(tx => tx.type === TransactionType.EXPENSE)
            .reduce((sum, tx) => sum + tx.amount, 0);
        return { totalIncome, totalExpense };
    }, [filteredTransactions]);

    // Get unique categories from transactions for filter dropdown
    const uniqueCategories = useMemo(() => {
        const cats = new Set(transactions.map(tx => tx.category));
        return Array.from(cats);
    }, [transactions]);

    // If simplified mode (used from Dashboard modal)
    if (isSimplified) {
        return (
            <Modal isOpen={true} onClose={handleCloseModal} title="Tambah Transaksi">
                <TransactionForm onSubmit={handleSubmit} onClose={handleCloseModal} goals={goals} bills={bills} />
            </Modal>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h1>
                    <p className="text-sm text-gray-500">Kelola dan pantau arus kas Anda</p>
                </div>
                {/* Action Buttons - Desktop */}
                <div className="hidden md:flex gap-3">
                    <button
                        onClick={handleExport}
                        className="h-11 px-4 flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Ekspor</span>
                    </button>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="h-11 px-4 flex items-center gap-2 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                        style={{ background: 'linear-gradient(to right, #10B981, #14b8a6)' }}
                    >
                        <CameraIcon className="w-4 h-4" />
                        <span>Scan Struk</span>
                    </button>
                    <button
                        onClick={() => setIsVoiceOpen(true)}
                        className="h-11 px-4 flex items-center gap-2 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                        style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}
                    >
                        <span className="text-lg">🎤</span>
                        <span>Suara</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-11 px-4 flex items-center gap-2 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                        style={{ backgroundColor: '#10B981' }}
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Tambah</span>
                    </button>
                </div>
                {/* Action Buttons - Mobile (simplified) */}
                <div className="flex md:hidden gap-2 w-full">
                    <button
                        onClick={handleExport}
                        className="h-11 flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors active:scale-95"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="h-11 flex-1 flex items-center justify-center gap-2 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: 'linear-gradient(to right, #10B981, #14b8a6)' }}
                    >
                        <CameraIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsVoiceOpen(true)}
                        className="h-11 flex-1 flex items-center justify-center gap-2 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
                        style={{ background: 'linear-gradient(to right, #8b5cf6, #a855f7)' }}
                    >
                        <span className="text-xl">🎤</span>
                    </button>
                </div>
            </div>

            {/* Mobile FAB for Add Transaction */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="md:hidden fixed bottom-24 right-4 z-30 h-14 w-14 flex items-center justify-center rounded-full text-white shadow-xl active:scale-95 transition-transform"
                style={{ backgroundColor: '#10B981' }}
            >
                <PlusIcon className="w-6 h-6" />
            </button>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">Pemasukan</p>
                        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600 dark:text-green-400">
                            <ArrowDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wide">Pengeluaran</p>
                        <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full text-red-600 dark:text-red-400">
                            <ArrowUpIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalExpense)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <div className="min-w-[120px]">
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="w-full h-11 pl-4 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value={TransactionType.INCOME}>Pemasukan</option>
                                <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                            </select>
                            <FilterIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="min-w-[140px]">
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full h-11 pl-4 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary text-sm appearance-none cursor-pointer"
                            >
                                <option value="all">Semua Kategori</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <button
                        onClick={() => refreshData()}
                        className="h-11 w-11 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                    {(typeFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                        <button
                            onClick={resetFilters}
                            className="h-11 px-4 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors whitespace-nowrap"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                {paginatedTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {paginatedTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(tx.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-lg ${getCategoryColor(tx.category).split(' ')[0]} bg-opacity-20 flex items-center justify-center mr-3 text-lg`}>
                                                    {getCategoryEmoji(tx.category)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{tx.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            <p className="truncate max-w-[200px]">{tx.description}</p>
                                            <div className="flex gap-1 flex-wrap mt-1">
                                                {tx.goalId && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                                                        🎯 Impian
                                                    </span>
                                                )}
                                                {tx.billId && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                        📋 Tagihan
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${tx.type === TransactionType.INCOME
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(tx)}
                                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(tx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="font-bold text-gray-900 dark:text-white mb-1">Tidak ada transaksi</p>
                        <p className="text-sm text-gray-500">Belum ada data transaksi yang sesuai dengan filter.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Sebelumnya
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                        Hal {currentPage} dari {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Selanjutnya
                    </button>
                </div>
            )}

            {/* Form Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransaction ? "Edit Transaksi" : "Tambah Transaksi"}>
                <TransactionForm onSubmit={handleSubmit} onClose={handleCloseModal} initialData={editingTransaction} goals={goals} bills={bills} />
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Transaksi?"
                message={`APBakah Anda yakin ingin menghapus transaksi "${deleteConfirm?.description}"? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus"
                variant="danger"
            />

            {/* Receipt Scanner Modal */}
            {isScannerOpen && (
                <ReceiptScanner
                    onScanComplete={handleScanComplete}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}

            {/* Voice Input Modal */}
            <VoiceInputModal
                isOpen={isVoiceOpen}
                onClose={() => setIsVoiceOpen(false)}
                onResult={handleVoiceResult}
            />
        </div>
    );
};

export default TransactionsPage;
