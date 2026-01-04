import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import api from '../services/api';
import { Transaction, Budget, Goal, Bill, AppNotification, Category } from '../services/types';
import { generateNotifications } from '../services/notificationService';

interface DataContextType {
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    bills: Bill[];
    notifications: AppNotification[];
    loading: boolean;
    refreshData: () => Promise<void>;
    addTransaction: (data: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (data: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addBudget: (data: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
    updateBudget: (data: { id: string; category: Category; budget_limit: number }) => Promise<void>;
    deleteBudget: (id: string) => Promise<void>;
    addGoal: (data: Omit<Goal, 'id' | 'currentAmount'>) => Promise<void>;
    updateGoal: (data: Omit<Goal, 'currentAmount'>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    addBill: (data: Omit<Bill, 'id'>) => Promise<void>;
    updateBill: (data: Bill) => Promise<void>;
    deleteBill: (id: string) => Promise<void>;
    payBill: (bill: Bill) => Promise<void>;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) {
            setTransactions([]);
            setBudgets([]);
            setGoals([]);
            setBills([]);
            setNotifications([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [fetchedTransactions, fetchedBudgets, fetchedGoals, fetchedBills] = await Promise.all([
                api.getTransactions(user.id),
                api.getBudgets(user.id),
                api.getGoals(user.id),
                api.getBills(user.id),
            ]);
            setTransactions(fetchedTransactions);
            setBudgets(fetchedBudgets);
            setGoals(fetchedGoals);
            setBills(fetchedBills);
            setBills(fetchedBills);
        } catch (error) {
            console.error("Error fetching data:", error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data.';
            showToast({ type: 'error', title: 'Gagal memuat data', message: errorMessage });
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Notifications logic
    useEffect(() => {
        if (!user || loading) return;

        const generated = generateNotifications(bills, budgets, goals, transactions);
        const readIds: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');

        const updatedNotifications = generated.map(n => ({
            ...n,
            isRead: readIds.includes(n.id)
        }));

        setNotifications(updatedNotifications);
    }, [user, loading, bills, budgets, goals, transactions]);

    const markAsRead = (notificationId: string) => {
        const readIds: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        if (!readIds.includes(notificationId)) {
            const newReadIds = [...readIds, notificationId];
            localStorage.setItem('readNotifications', JSON.stringify(newReadIds));
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
        }
    };

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        localStorage.setItem('readNotifications', JSON.stringify(allIds));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    // CRUD Actions with Toast notifications
    const addTransaction = async (data: Omit<Transaction, 'id'>) => {
        if (!user) return;
        try {
            const newTransaction = await api.addTransaction({ ...data, user_id: user.id });
            if (newTransaction) {
                setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                showToast({ type: 'success', title: 'Transaksi ditambahkan', message: `${data.description} berhasil disimpan.` });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menambah transaksi', message: error.message });
            throw error;
        }
    };

    const updateTransaction = async (data: Transaction) => {
        try {
            const updatedTransaction = await api.updateTransaction(data);
            if (updatedTransaction) {
                setTransactions(prev => prev.map(t => t.id === data.id ? updatedTransaction : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                showToast({ type: 'success', title: 'Transaksi diperbarui' });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal memperbarui transaksi', message: error.message });
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await api.deleteTransaction(id);
            setTransactions(prev => prev.filter(t => t.id !== id));
            showToast({ type: 'success', title: 'Transaksi dihapus' });
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menghapus transaksi', message: error.message });
            throw error;
        }
    };

    const addBudget = async (data: Omit<Budget, 'id' | 'spent'>) => {
        if (!user) return;
        try {
            const newBudget = await api.addBudget({ ...data, user_id: user.id });
            if (newBudget) {
                setBudgets(prev => [...prev, newBudget]);
                showToast({ type: 'success', title: 'Anggaran ditambahkan', message: `Anggaran ${data.category} berhasil disimpan.` });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menambah anggaran', message: error.message });
            throw error;
        }
    };

    const updateBudget = async (data: { id: string; category: Category; budget_limit: number }) => {
        try {
            const updatedBudget = await api.updateBudget(data);
            if (updatedBudget) {
                setBudgets(prev => prev.map(b => b.id === data.id ? { ...b, ...updatedBudget } : b));
                showToast({ type: 'success', title: 'Anggaran diperbarui' });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal memperbarui anggaran', message: error.message });
            throw error;
        }
    };

    const deleteBudget = async (id: string) => {
        try {
            await api.deleteBudget(id);
            setBudgets(prev => prev.filter(b => b.id !== id));
            showToast({ type: 'success', title: 'Anggaran dihapus' });
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menghapus anggaran', message: error.message });
            throw error;
        }
    };

    const addGoal = async (data: Omit<Goal, 'id' | 'currentAmount'>) => {
        if (!user) return;
        try {
            const newGoal = await api.addGoal({ ...data, user_id: user.id });
            if (newGoal) {
                setGoals(prev => [...prev, newGoal]);
                showToast({ type: 'success', title: 'Impian ditambahkan', message: `"${data.name}" berhasil disimpan.` });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menambah impian', message: error.message });
            throw error;
        }
    };

    const updateGoal = async (data: Omit<Goal, 'currentAmount'>) => {
        try {
            const updatedGoal = await api.updateGoal(data);
            if (updatedGoal) {
                setGoals(prev => prev.map(g => g.id === data.id ? { ...g, ...updatedGoal } : g));
                showToast({ type: 'success', title: 'Impian diperbarui' });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal memperbarui impian', message: error.message });
            throw error;
        }
    };

    const deleteGoal = async (id: string) => {
        try {
            await api.deleteGoal(id);
            setTransactions(prev => prev.map(t => t.goalId === id ? { ...t, goalId: undefined } : t));
            setGoals(prev => prev.filter(g => g.id !== id));
            showToast({ type: 'success', title: 'Impian dihapus' });
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menghapus impian', message: error.message });
            throw error;
        }
    };

    const addBill = async (data: Omit<Bill, 'id'>) => {
        if (!user) return;
        try {
            const newBill = await api.addBill({ ...data, user_id: user.id });
            if (newBill) {
                setBills(prev => [...prev, newBill].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
                showToast({ type: 'success', title: 'Tagihan ditambahkan', message: `"${data.name}" berhasil disimpan.` });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menambah tagihan', message: error.message });
            throw error;
        }
    };

    const updateBill = async (data: Bill) => {
        try {
            const updatedBill = await api.updateBill(data);
            if (updatedBill) {
                setBills(prev => prev.map(b => b.id === data.id ? updatedBill : b).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()));
                showToast({ type: 'success', title: 'Tagihan diperbarui' });
            }
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal memperbarui tagihan', message: error.message });
            throw error;
        }
    };

    const deleteBill = async (id: string) => {
        try {
            await api.deleteBill(id);
            setBills(prev => prev.filter(b => b.id !== id));
            showToast({ type: 'success', title: 'Tagihan dihapus' });
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal menghapus tagihan', message: error.message });
            throw error;
        }
    };

    const payBill = async (bill: Bill) => {
        if (!user) return;
        try {
            await api.payBill(bill.id);
            await fetchData();
            showToast({ type: 'success', title: 'Tagihan dibayar', message: `"${bill.name}" berhasil dibayar dan tercatat sebagai pengeluaran.` });
        } catch (error: any) {
            showToast({ type: 'error', title: 'Gagal membayar tagihan', message: error.message });
            throw error;
        }
    };

    return (
        <DataContext.Provider value={{
            transactions, budgets, goals, bills, notifications, loading,
            refreshData: fetchData,
            addTransaction, updateTransaction, deleteTransaction,
            addBudget, updateBudget, deleteBudget,
            addGoal, updateGoal, deleteGoal,
            addBill, updateBill, deleteBill, payBill,
            markAsRead, markAllAsRead
        }}>
            {children}
        </DataContext.Provider>
    );
};
