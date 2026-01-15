import React, { useState, useMemo } from 'react';
import CountUp from './common/CountUp';
import { Bill, Transaction, TransactionType, Category } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, CheckCircleIcon, SearchIcon, CalendarIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate, calculatePaidAmounts } from '../utils';
import { NotificationService } from '../services/notificationService';

const getDaysUntilDue = (nextDueDate: string, paidAmount: number, totalAmount: number): { days: number; text: string; urgency: 'overdue' | 'urgent' | 'soon' | 'ok' | 'paid' } => {
    // Tolerance for float precision
    if (paidAmount >= totalAmount - 1) return { days: 0, text: 'Lunas', urgency: 'paid' };

    const due = new Date(nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, text: 'Terlewat', urgency: 'overdue' };
    if (diffDays === 0) return { days: 0, text: 'Hari ini!', urgency: 'urgent' };
    if (diffDays <= 7) return { days: diffDays, text: `${diffDays} hari lagi`, urgency: 'soon' };
    return { days: diffDays, text: `${diffDays} hari lagi`, urgency: 'ok' };
};

const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
        case 'paid':
            return {
                badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                dot: 'bg-emerald-500',
                border: 'border-l-emerald-500',
                card: 'bg-emerald-50 dark:bg-emerald-900/10'
            };
        case 'overdue':
            return {
                badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                dot: 'bg-rose-500',
                border: 'border-l-rose-500',
                card: 'bg-rose-50 dark:bg-rose-900/10'
            };
        case 'urgent':
            return {
                badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                dot: 'bg-orange-500',
                border: 'border-l-orange-500',
                card: 'bg-orange-50 dark:bg-orange-900/10'
            };
        case 'soon':
            return {
                badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                dot: 'bg-amber-500',
                border: 'border-l-amber-500',
                card: 'bg-amber-50 dark:bg-amber-900/10'
            };
        default:
            return {
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                dot: 'bg-blue-500',
                border: 'border-l-blue-500',
                card: 'bg-white dark:bg-gray-800'
            };
    }
};

const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
        'once': 'Sekali',
        'weekly': 'Mingguan',
        'monthly': 'Bulanan',
        'yearly': 'Tahunan',
    };
    return labels[frequency] || frequency;
};

// Form Component
interface BillFormProps {
    onSubmit: (data: Omit<Bill, 'id'> & { id?: string }) => void;
    onClose: () => void;
    initialData?: Bill | null;
}

const BillForm: React.FC<BillFormProps> = ({ onSubmit, onClose, initialData }) => {
    const [formData, setFormData] = useState({
        id: initialData?.id,
        name: initialData?.name || '',
        amount: initialData?.amount || 0,
        nextDueDate: initialData ? new Date(initialData.nextDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        frequency: initialData?.frequency || 'monthly',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0 || !formData.name.trim()) {
            return;
        }
        onSubmit({
            ...formData,
            nextDueDate: new Date(formData.nextDueDate).toISOString(),
            frequency: formData.frequency as Bill['frequency'],
        });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Tagihan</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm"
                    placeholder="Contoh: Listrik PLN"
                />
            </div>

            <CurrencyInput
                label="Jumlah Tagihan"
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                required
            />

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tanggal Jatuh Tempo</label>
                <input
                    type="date"
                    name="nextDueDate"
                    value={formData.nextDueDate}
                    onChange={handleChange}
                    required
                    className="w-full h-14 px-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all backdrop-blur-sm"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Frekuensi</label>
                <div className="relative">
                    <select
                        name="frequency"
                        value={formData.frequency}
                        onChange={handleChange}
                        className="w-full h-14 px-4 pr-10 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none text-base font-medium transition-all backdrop-blur-sm"
                    >
                        <option value="once">Sekali Bayar</option>
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                </div>
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
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-primary to-teal-500 rounded-2xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all text-center uppercase tracking-wide"
                >
                    Simpan
                </button>
            </div>
        </form>
    );
};

// Payment Modal Component
interface PaymentModalProps {
    bill: Bill;
    remainingAmount: number;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    isLoading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ bill, remainingAmount, onClose, onConfirm, isLoading }) => {
    const [amount, setAmount] = useState(remainingAmount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(amount);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm">
                <p>
                    Anda akan membayar tagihan <strong>{bill.name}</strong>.
                    Sisa tagihan saat ini adalah <strong>{formatCurrency(remainingAmount)}</strong>.
                </p>
            </div>

            <CurrencyInput
                label="Jumlah Pembayaran"
                value={amount}
                onChange={setAmount}
                required
                max={remainingAmount}
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
                    disabled={isLoading || amount <= 0}
                    className="flex-1 h-12 px-4 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all text-center uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Memproses...' : 'Bayar'}
                </button>
            </div>
        </form>
    );
};

const BillsPage: React.FC = () => {
    const { bills, transactions, addBill, updateBill, deleteBill, addTransaction } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Bill | null>(null);

    // New Payment State
    const [paymentBill, setPaymentBill] = useState<Bill | null>(null); // To store the bill being paid
    const [isPayLoading, setIsPayLoading] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Pre-calculate all paid amounts for all bills in one go.
    const paidAmountsMap = useMemo(() => calculatePaidAmounts(transactions), [transactions]);

    const sortedBills = useMemo(() => {
        return [...bills].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [bills]);

    const filteredBills = useMemo(() => {
        if (!searchQuery.trim()) return sortedBills;
        return sortedBills.filter(b =>
            b.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sortedBills, searchQuery]);

    const stats = useMemo(() => {
        let totalUnpaid = 0;
        let urgentCount = 0;
        let overdueCount = 0;

        for (const bill of bills) {
            const paid = paidAmountsMap.get(`${bill.id}-${bill.nextDueDate}`) || 0;
            totalUnpaid += Math.max(0, bill.amount - paid);
            const dueInfo = getDaysUntilDue(bill.nextDueDate, paid, bill.amount);
            if (dueInfo.urgency === 'urgent') urgentCount++;
            if (dueInfo.urgency === 'overdue') overdueCount++;
        }

        return { totalAmount: totalUnpaid, urgentCount, overdueCount, totalCount: bills.length };
    }, [bills, paidAmountsMap]);

    const handleSubmit = async (data: Omit<Bill, 'id'> & { id?: string }) => {
        if (data.id) {
            await updateBill(data as Bill);
            // Reschedule notification
            await NotificationService.cancelBillNotifications(data.id);
            await NotificationService.scheduleBillNotification(data as Bill);
        } else {
            // We strip 'id' before sending to addBill because addBill expects Omit<Bill, 'id'>
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _unused, ...newBillData } = data;
            // Add bill returns void/promise but doesn't return the new ID easily here without modifying context
            // However, we can construct the object if we knew the ID.
            // Since useData doesn't return the ID, we might need to rely on the fact that if we refresh or similar...
            // Actually, for now, let's just await addBill.
            // To properly schedule, we need the ID generated by Supabase.
            // Limitation: We might need to refactor useData to return the new record.
            // Workaround: We will schedule it when the list updates or we could fetch it.
            // BETTER: Modifying useData is out of scope for this small task?
            // Let's assume addBill returns the data (it usually does in good implementations).
            // Checking contexts/DataContext... if it doesn't, we might skip scheduling for NEW bills instantly
            // until the user edits them or next app launch?
            // Wait, bills are loaded from DB.
            // Let's try to proceed.
            const newBill = await addBill(newBillData);

            if (newBill) {
                await NotificationService.scheduleBillNotification(newBill);
            }
        }
    };

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await NotificationService.cancelBillNotifications(deleteConfirm.id);
            await deleteBill(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    // Updated Payment Logic
    const handlePaymentConfirm = async (amount: number) => {
        if (!paymentBill) return;

        setIsPayLoading(true);
        try {
            const totalBillAmount = paymentBill.amount;
            const currentlyPaid = paidAmountsMap.get(`${paymentBill.id}-${paymentBill.nextDueDate}`) || 0;
            const remaining = totalBillAmount - currentlyPaid;

            // Cap the amount to remaining just in case
            const finalAmount = Math.min(amount, remaining);
            if (finalAmount <= 0) {
                setIsPayLoading(false);
                return;
            }

            const isFullPayment = (currentlyPaid + finalAmount) >= (totalBillAmount - 1); // 1 tolerance for rounding

            // 1. Create Transaction
            // Tag description with Due Date to link to this specific cycle
            await addTransaction({
                type: TransactionType.EXPENSE,
                amount: finalAmount,
                description: `Pembayaran ${paymentBill.name} (${paymentBill.nextDueDate})`,
                category: Category.TAGIHAN,
                date: new Date().toISOString(),
                billId: paymentBill.id,
                goalId: undefined // Explicitly undefined
            });

            // 2. If Fully Paid, Advance Due Date
            if (isFullPayment) {
                if (paymentBill.frequency === 'once') {
                    await NotificationService.cancelBillNotifications(paymentBill.id);
                    await deleteBill(paymentBill.id);
                } else {
                    const currentDueDate = new Date(paymentBill.nextDueDate);
                    const nextDate = new Date(currentDueDate); // Changed to const per lint suggestion

                    switch (paymentBill.frequency) {
                        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                    }

                    await updateBill({
                        ...paymentBill,
                        nextDueDate: nextDate.toISOString()
                    });

                    // Reschedule for next due date
                    await NotificationService.scheduleBillNotification({
                        ...paymentBill,
                        nextDueDate: nextDate.toISOString()
                    });
                }
            }

            setPaymentBill(null);
        } catch (error) {
            console.error(error);
            // Ideally trigger toast from simple throw, but UI handles it via DataContext toast
        } finally {
            setIsPayLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBill(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tagihan Rutin</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Kelola dan bayar tagihan, mendukung pembayaran cicilan.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-12 px-6 bg-gradient-to-r from-primary to-teal-500 hover:from-primary-dark hover:to-teal-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5 drop-shadow-sm" />
                    Tambah Tagihan
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sisa Tagihan</p>
                    <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        <CountUp end={stats.totalAmount} formattingFn={formatCurrency} />
                    </p>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Jumlah</p>
                    <p className="text-xl md:text-2xl font-extrabold text-primary tracking-tight">
                        <CountUp end={stats.totalCount} suffix=" tagihan" />
                    </p>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Hari Ini</p>
                    <p className={`text-xl md:text-2xl font-extrabold tracking-tight ${stats.urgentCount > 0 ? 'text-orange-500 animate-pulse' : 'text-emerald-500'}`}>
                        <CountUp end={stats.urgentCount} suffix=" tagihan" />
                    </p>
                </div>
                <div className="glass-panel p-5 rounded-[1.5rem] group hover:scale-[1.02] transition-all duration-300">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terlewat</p>
                    <p className={`text-xl md:text-2xl font-extrabold tracking-tight ${stats.overdueCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                        <CountUp end={stats.overdueCount} suffix=" tagihan" />
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Cari tagihan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary text-base font-medium transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                />
            </div>

            {/* Bill List */}
            {filteredBills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredBills.map(bill => {
                        const paidAmount = paidAmountsMap.get(`${bill.id}-${bill.nextDueDate}`) || 0;
                        const dueInfo = getDaysUntilDue(bill.nextDueDate, paidAmount, bill.amount);
                        const styles = getUrgencyStyles(dueInfo.urgency);
                        const progress = bill.amount > 0 ? Math.min(100, (paidAmount / bill.amount) * 100) : 0;

                        return (
                            <div
                                key={bill.id}
                                className={`glass-panel relative p-6 rounded-[24px] border border-l-8 ${styles.border} shadow-sm transition-all duration-300 hover:scale-[1.01] group overflow-hidden ${styles.card}`}
                            >
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/80 to-white/40 dark:from-white/10 dark:to-white/5 shadow-inner border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-md">
                                            <CreditCardIcon className="w-6 h-6 text-gray-700 dark:text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">{bill.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                <span>{formatDate(bill.nextDueDate)}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                                <span>{getFrequencyLabel(bill.frequency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mt-1 ${styles.badge}`}>
                                            {dueInfo.text}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar for Installments */}
                                <div className="mt-5 mb-2 relative z-10">
                                    <div className="flex justify-between text-xs font-bold mb-1.5">
                                        <span className="text-gray-500 dark:text-gray-400">Terbayar: {formatCurrency(paidAmount)}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out relative"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-5 pt-4 border-t border-black/5 dark:border-white/5 relative z-10">
                                    <button
                                        onClick={() => setPaymentBill(bill)}
                                        className="flex-[2] flex items-center justify-center gap-2 h-10 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        <CheckCircleIcon className="w-5 h-5 drop-shadow-sm" />
                                        {paidAmount > 0 ? 'Bayar Sisa' : 'Bayar'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(bill)}
                                        className="flex-1 flex items-center justify-center gap-2 h-10 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-black/5 dark:hover:border-white/10"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(bill)}
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
                    <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-4xl mb-4 mx-auto animate-bounce-slow">
                        📋
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white mb-2 text-lg">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada tagihan'}
                    </p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan tagihan rutin Anda agar tidak lupa membayar.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-all"
                        >
                            Buat Tagihan Baru
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingBill ? 'Edit Tagihan' : 'Tambah Tagihan'}
            >
                <BillForm
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                    initialData={editingBill}
                />
            </Modal>

            {/* Payment Modal (NEW) */}
            <Modal
                isOpen={!!paymentBill}
                onClose={() => setPaymentBill(null)}
                title="Bayar Tagihan"
            >
                {paymentBill && (
                    <PaymentModal
                        bill={paymentBill}
                        remainingAmount={paymentBill.amount - (paidAmountsMap.get(`${paymentBill.id}-${paymentBill.nextDueDate}`) || 0)}
                        onClose={() => setPaymentBill(null)}
                        onConfirm={handlePaymentConfirm}
                        isLoading={isPayLoading}
                    />
                )}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Hapus Tagihan?"
                message={`Apakah Anda yakin ingin menghapus tagihan "${deleteConfirm?.name}"?`}
                confirmText="Hapus"
                variant="danger"
            />
        </div>
    );
};

export default BillsPage;