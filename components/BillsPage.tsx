import React, { useState, useMemo } from 'react';
import { Bill } from '../services/types';
import Modal from './common/Modal';
import CurrencyInput from './common/CurrencyInput';
import ConfirmDialog from './common/ConfirmDialog';
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, CheckCircleIcon, SearchIcon } from './common/Icons';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDate } from '../utils';

const getDaysUntilDue = (nextDueDate: string): { days: number; text: string; urgency: 'overdue' | 'urgent' | 'soon' | 'ok' } => {
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
        case 'overdue':
            return { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800', dot: 'bg-gray-400', border: 'border-l-gray-400' };
        case 'urgent':
            return { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', border: 'border-l-red-500' };
        case 'soon':
            return { badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500', border: 'border-l-yellow-500' };
        default:
            return { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', border: 'border-l-green-500' };
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
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nama Tagihan</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
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
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tanggal Jatuh Tempo</label>
                <input
                    type="date"
                    name="nextDueDate"
                    value={formData.nextDueDate}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frekuensi</label>
                <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                >
                    <option value="once">Sekali Bayar</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                </select>
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

const BillsPage: React.FC = () => {
    const { bills, addBill, updateBill, deleteBill, payBill } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<Bill | null>(null);
    const [payConfirm, setPayConfirm] = useState<Bill | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPayLoading, setIsPayLoading] = useState(false);

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
        const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
        const urgentCount = bills.filter(b => getDaysUntilDue(b.nextDueDate).urgency === 'urgent').length;
        const overdueCount = bills.filter(b => getDaysUntilDue(b.nextDueDate).urgency === 'overdue').length;
        return { totalAmount, urgentCount, overdueCount, totalCount: bills.length };
    }, [bills]);

    const handleSubmit = async (data: Omit<Bill, 'id'> & { id?: string }) => {
        if (data.id) {
            await updateBill(data as Bill);
        } else {
            await addBill({ name: data.name, amount: data.amount, nextDueDate: data.nextDueDate, frequency: data.frequency });
        }
    };

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteBill(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    const handlePay = async () => {
        if (payConfirm) {
            setIsPayLoading(true);
            try {
                await payBill(payConfirm);
            } finally {
                setIsPayLoading(false);
                setPayConfirm(null);
            }
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
                    <p className="text-sm text-gray-500">Kelola dan bayar tagihan tepat waktu</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 h-10 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
                >
                    <PlusIcon className="w-4 h-4" />
                    Tambah Tagihan
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Tagihan</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Jumlah</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalCount} tagihan</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hari Ini</p>
                    <p className={`text-lg font-bold ${stats.urgentCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.urgentCount} tagihan
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Terlewat</p>
                    <p className={`text-lg font-bold ${stats.overdueCount > 0 ? 'text-gray-600' : 'text-green-600'}`}>
                        {stats.overdueCount} tagihan
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Cari tagihan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Bill List */}
            {filteredBills.length > 0 ? (
                <div className="space-y-3">
                    {filteredBills.map(bill => {
                        const dueInfo = getDaysUntilDue(bill.nextDueDate);
                        const styles = getUrgencyStyles(dueInfo.urgency);

                        return (
                            <div
                                key={bill.id}
                                className={`p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-l-4 ${styles.border} shadow-sm hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                            <CreditCardIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{bill.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{formatDate(bill.nextDueDate)}</span>
                                                <span>•</span>
                                                <span>{getFrequencyLabel(bill.frequency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(bill.amount)}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles.badge}`}>
                                                {dueInfo.text}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => setPayConfirm(bill)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        Bayar
                                    </button>
                                    <button
                                        onClick={() => handleEdit(bill)}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(bill)}
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
                    <div className="text-5xl mb-4">📋</div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                        {searchQuery ? 'Tidak ditemukan' : 'Belum ada tagihan'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {searchQuery ? 'Coba kata kunci lain' : 'Tambahkan tagihan rutin Anda'}
                    </p>
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

            {/* Pay Confirmation */}
            <ConfirmDialog
                isOpen={!!payConfirm}
                onClose={() => setPayConfirm(null)}
                onConfirm={handlePay}
                isLoading={isPayLoading}
                title="Bayar Tagihan?"
                message={`Bayar tagihan "${payConfirm?.name}" sebesar ${payConfirm ? formatCurrency(payConfirm.amount) : ''}? Ini akan dicatat sebagai pengeluaran.`}
                confirmText="Bayar"
                variant="info"
            />
        </div>
    );
};

export default BillsPage;