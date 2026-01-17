import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category, expenseCategories, incomeCategories } from '../services/types';
import CountUp from './common/CountUp';
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
import { TransactionsEmptyState } from './common/EmptyState';

// Form Component
interface TransactionFormProps {
    onSubmit: (data: Omit<Transaction, 'id'> & { id?: string }) => void;
    onClose: () => void;
    onDelete?: () => void;
    initialData?: Transaction | null;
    goals: { id: string; name: string }[];
    bills: { id: string; name: string; amount: number }[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onClose, onDelete, initialData, goals, bills }) => {
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

    // Handle category/type sync - Fixed: Uses useEffect instead of useMemo
    React.useEffect(() => {
        if (!initialData) {
            if (formData.type === TransactionType.INCOME && !incomeCategories.includes(formData.category)) {
                setFormData(prev => ({ ...prev, category: Category.GAJI }));
            } else if (formData.type === TransactionType.EXPENSE && !expenseCategories.includes(formData.category)) {
                setFormData(prev => ({ ...prev, category: Category.MAKANAN }));
            }
        }
    }, [formData.type, initialData, formData.category]);

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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Premium Type Toggle */}
            <div className="flex p-1.5 bg-gray-100/50 dark:bg-black/20 rounded-2xl relative border border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
                <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-gray-700/80 rounded-xl shadow-sm transition-all duration-300 ease-spring border border-gray-100 dark:border-white/5 ${formData.type === TransactionType.INCOME ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                        }`}
                />
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.EXPENSE }))}
                    className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors text-center rounded-xl ${formData.type === TransactionType.EXPENSE ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Pengeluaran
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: TransactionType.INCOME }))}
                    className={`flex-1 relative z-10 py-3 text-sm font-bold transition-colors text-center rounded-xl ${formData.type === TransactionType.INCOME ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
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

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Deskripsi</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base font-medium placeholder:text-gray-400 backdrop-blur-sm"
                        placeholder="Contoh: Belanja bulanan"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
                    <div className="relative">
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full h-14 px-4 pr-10 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer transition-all text-base font-medium backdrop-blur-sm"
                        >
                            {currentCategories.map(cat => <option key={cat} value={cat}>{getCategoryEmoji(cat)} {cat}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {isSavingTransaction && (
                    <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Alokasikan ke Impian</label>
                        <div className="relative">
                            <select
                                name="goalId"
                                value={formData.goalId || ''}
                                onChange={handleChange}
                                required
                                className="w-full h-14 px-4 pr-10 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer transition-all text-base font-medium backdrop-blur-sm"
                            >
                                <option value="" disabled>Pilih Impian...</option>
                                {goals.length > 0 ? (
                                    goals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)
                                ) : (
                                    <option value="" disabled>Belum ada impian dibuat</option>
                                )}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {isBillTransaction && (
                    <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terkait dengan Tagihan (Opsional)</label>
                        <div className="relative">
                            <select
                                name="billId"
                                value={formData.billId || ''}
                                onChange={(e) => handleBillSelect(e.target.value)}
                                className="w-full h-14 px-4 pr-10 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none cursor-pointer transition-all text-base font-medium backdrop-blur-sm"
                            >
                                <option value="">Tidak ada / Manual</option>
                                {bills.length > 0 ? (
                                    bills.map(bill => <option key={bill.id} value={bill.id}>{bill.name} - {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bill.amount)}</option>)
                                ) : (
                                    <option value="" disabled>Belum ada tagihan dibuat</option>
                                )}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 ml-1">Pilih tagihan untuk mengisi otomatis jumlah dan deskripsi</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tanggal</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base font-medium backdrop-blur-sm"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-white/5">
                {initialData && onDelete ? (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="h-12 w-12 flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
                        title="Hapus Transaksi"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide"
                    >
                        Batal
                    </button>
                )}

                {initialData && onDelete && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-12 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wide"
                    >
                        Batal
                    </button>
                )}

                <button
                    type="submit"
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-primary to-teal-500 rounded-2xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all uppercase tracking-wide"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
}

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
        <div className="space-y-6 md:space-y-8 pb-24 md:pb-0">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Riwayat Transaksi</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Kelola dan pantau arus kas Anda</p>
                </div>
                {/* Action Buttons - Desktop */}
                <div className="hidden md:flex gap-3">
                    <button
                        onClick={handleExport}
                        className="h-12 px-5 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-95"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Ekspor</span>
                    </button>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="h-12 px-5 flex items-center gap-2 text-white rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 border border-white/20"
                        style={{ background: 'linear-gradient(to right, #8B5CF6, #D946EF)' }}
                    >
                        <CameraIcon className="w-5 h-5 drop-shadow-sm" />
                        <span>Scan Struk</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-12 px-5 flex items-center gap-2 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/30 active:scale-95 border border-white/20"
                        style={{ background: 'linear-gradient(to right, #00D09C, #34D399)' }}
                        aria-label="Tambah Transaksi Baru"
                    >
                        <PlusIcon className="w-5 h-5 drop-shadow-sm" />
                        <span>Tambah</span>
                    </button>
                </div>
                {/* Action Buttons - Mobile (simplified) */}
                <div className="flex md:hidden gap-3 w-full">
                    <button
                        onClick={handleExport}
                        className="h-12 flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                        aria-label="Ekspor Transaksi ke PDF"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="h-12 flex-1 flex items-center justify-center gap-2 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md border border-white/20"
                        style={{ background: 'linear-gradient(to right, #8B5CF6, #D946EF)' }}
                        aria-label="Scan Struk Transaksi"
                    >
                        <CameraIcon className="w-6 h-6 drop-shadow-sm" />
                    </button>
                </div>
            </div>

            {/* Mobile FAB for Add Transaction */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="md:hidden fixed bottom-28 right-4 z-30 h-14 w-14 flex items-center justify-center rounded-2xl text-white shadow-xl shadow-primary/40 active:scale-95 transition-all border border-white/20"
                style={{ background: 'linear-gradient(to br, #00D09C, #34D399)' }}
                aria-label="Tambah Transaksi Floating Button"
            >
                <PlusIcon className="w-7 h-7 drop-shadow-sm" />
            </button>

            {/* Stats Cards - Premium Glass */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel relative overflow-hidden flex flex-col gap-2 p-6 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                    <div className="flex justify-between items-center relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">Pemasukan</p>
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <ArrowDownIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight relative z-10">
                        <CountUp end={stats.totalIncome} formattingFn={formatCurrency} />
                    </p>
                </div>
                <div className="glass-panel relative overflow-hidden flex flex-col gap-2 p-6 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-8 -mt-8 pointer-events-none group-hover:bg-rose-500/20 transition-colors" />
                    <div className="flex justify-between items-center relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider">Pengeluaran</p>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <ArrowUpIcon className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight relative z-10">
                        <CountUp end={stats.totalExpense} formattingFn={formatCurrency} />
                    </p>
                </div>
            </div>

            {/* Filters - Glass Style */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                    />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <div className="min-w-[140px]">
                        <div className="relative">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
                                className="w-full h-12 pl-4 pr-10 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium appearance-none cursor-pointer shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                aria-label="Filter berdasarkan tipe transaksi"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value={TransactionType.INCOME}>Pemasukan</option>
                                <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                            </select>
                            <FilterIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="min-w-[160px]">
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-medium appearance-none cursor-pointer shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                aria-label="Filter berdasarkan kategori"
                            >
                                <option value="all">Semua Kategori</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <button
                        onClick={() => refreshData()}
                        className="h-12 w-12 flex-none flex items-center justify-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 rounded-2xl hover:bg-white dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-all shadow-sm active:scale-95"
                        title="Refresh Data"
                        aria-label="Refresh Data"
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                    {(typeFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                        <button
                            onClick={resetFilters}
                            className="h-12 px-5 flex-none text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-2xl transition-colors whitespace-nowrap border border-rose-100 dark:border-rose-900/20"
                            aria-label="Reset Filter"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Transactions List - Premium Card Layout */}
            <div className="glass-panel rounded-[1.5rem] shadow-sm overflow-hidden min-h-[500px]">
                {paginatedTransactions.length > 0 ? (
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-white/5">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {paginatedTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(tx.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-9 h-9 rounded-xl ${getCategoryColor(tx.category).split(' ')[0]} bg-opacity-20 flex items-center justify-center mr-3 text-lg shadow-sm group-hover:scale-110 transition-transform`}>
                                                        {getCategoryEmoji(tx.category)}
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tx.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                <p className="truncate max-w-[200px] font-medium">{tx.description}</p>
                                                <div className="flex gap-2 flex-wrap mt-1.5 lead-none">
                                                    {tx.goalId && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wide border border-primary/10">
                                                            🎯 Impian
                                                        </span>
                                                    )}
                                                    {tx.billId && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 uppercase tracking-wide border border-purple-500/10">
                                                            📋 Tagihan
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right tracking-tight ${tx.type === TransactionType.INCOME
                                                ? 'text-emerald-500 dark:text-emerald-400'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(tx)}
                                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(tx)}
                                                        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
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

                        {/* Mobile List View - Premium Cards */}
                        <div className="md:hidden flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                            {paginatedTransactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    onClick={() => handleEdit(tx)}
                                    className="p-4 flex items-center justify-between active:bg-gray-50 dark:active:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${getCategoryColor(tx.category).split(' ')[0]} flex items-center justify-center text-2xl shadow-sm border border-black/5 dark:border-white/5`}>
                                            {getCategoryEmoji(tx.category)}
                                        </div>
                                        <div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{tx.category}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{formatDate(tx.date)}</span>
                                            </div>
                                            {(tx.goalId || tx.billId) && (
                                                <div className="flex gap-1.5 mt-1.5">
                                                    {tx.goalId && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/10">IMPIAN</span>}
                                                    {tx.billId && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md border border-purple-500/10">TAGIHAN</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-base font-extrabold tracking-tight ${tx.type === TransactionType.INCOME
                                            ? 'text-emerald-500 dark:text-emerald-400'
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {tx.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(tx.amount)}
                                        </span>
                                        <p className="text-xs text-gray-400 max-w-[120px] truncate text-right">{tx.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <TransactionsEmptyState onAddTransaction={() => setIsModalOpen(true)} />
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
                <TransactionForm
                    onSubmit={handleSubmit}
                    onClose={handleCloseModal}
                    initialData={editingTransaction}
                    goals={goals}
                    bills={bills}
                    onDelete={editingTransaction ? () => {
                        setDeleteConfirm(editingTransaction);
                        setIsModalOpen(false);
                    } : undefined}
                />
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

        </div>
    );
};

export default TransactionsPage;
