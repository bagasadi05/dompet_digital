import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useData } from './DataContext';
import { ChatSession, startChatSession, sendMessageToAI, sendToolResult, AIStreamResult } from '../services/aiChatService';
import { AIAction, mapCategory, mapTransactionType } from '../services/aiActionTypes';
import { TransactionType } from '../services/types';
import { formatCurrency } from '../utils';

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai' | 'system';
    chartData?: {
        type: 'bar' | 'pie';
        data: { name: string; value: number }[];
        title: string;
    };
}

interface ChatContextType {
    chat: ChatSession | null;
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    pendingAction: (AIAction & { toolCallId?: string }) | null;
    isExecutingAction: boolean;
    sendMessage: (text: string) => Promise<void>;
    resetChat: () => Promise<void>;
    confirmAction: () => Promise<void>;
    cancelAction: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        transactions, budgets, goals, bills,
        addTransaction, updateTransaction, deleteTransaction,
        addBudget, addGoal, deleteGoal,
        addBill, updateBill, deleteBill, payBill,
        refreshData
    } = useData();

    const [chat, setChat] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<(AIAction & { toolCallId?: string }) | null>(null);
    const [isExecutingAction, setIsExecutingAction] = useState(false);

    // Initial chat reset helper
    const initChatSession = useCallback(async () => {
        try {
            const session = await startChatSession(transactions, budgets, goals, bills);
            if (session) {
                setChat(session);
                return session;
            }
            return null;
        } catch (e: any) {
            setError(e.message || "Gagal memulai sesi chat.");
            return null;
        }
    }, [transactions, budgets, goals, bills]);

    const processStream = async (stream: AsyncIterable<AIStreamResult>, aiMessageId: string, initialText: string = '', currentSession: ChatSession) => {
        let fullResponse = initialText;

        for await (const chunk of stream) {
            if (chunk.type === 'text' && chunk.text) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullResponse } : m));
            } else if (chunk.type === 'action' && chunk.action) {
                const actionWithId = {
                    ...chunk.action,
                    toolCallId: (chunk.action as any).toolCallId
                };

                if (chunk.action.action.type === 'get_transactions' || chunk.action.action.type === 'analyze_spending') {
                    // Auto-execute specific read-only actions
                    await handleAutoExecute(actionWithId, aiMessageId, fullResponse, currentSession);
                    // Break current loop as recursive handle takes over
                    return;
                } else {
                    // Requires user confirmation
                    setPendingAction(actionWithId);
                }
            }
        }
    };

    const handleAutoExecute = async (action: AIAction & { toolCallId?: string }, currentMessageId: string, currentText: string, currentSession: ChatSession) => {
        if (!action.toolCallId) return;

        try {
            if (action.action.type === 'get_transactions') {
                const params = action.action.params as any;
                let filtered = transactions;

                if (params.category) filtered = filtered.filter(t => t.category.toLowerCase().includes(params.category.toLowerCase()));
                if (params.startDate) filtered = filtered.filter(t => t.date >= params.startDate);
                if (params.endDate) filtered = filtered.filter(t => t.date <= params.endDate);

                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const limit = params.limit || 5;
                const resultData = filtered.slice(0, limit);

                const stream = await sendToolResult(currentSession, action.toolCallId, JSON.stringify(resultData));
                await processStream(stream, currentMessageId, currentText, currentSession);

            } else if (action.action.type === 'analyze_spending') {
                const params = action.action.params as any;
                let filtered = transactions.filter(t => t.type === TransactionType.EXPENSE);
                if (params.type) {
                    // Continue filtering from filtered instead of restarting from transactions
                    filtered = filtered.filter(t => t.type === (params.type === 'pemasukan' ? TransactionType.INCOME : TransactionType.EXPENSE));
                }

                if (params.startDate) filtered = filtered.filter(t => t.date >= params.startDate);
                if (params.endDate) filtered = filtered.filter(t => t.date <= params.endDate);

                const dataMap = new Map<string, number>();
                filtered.forEach(t => {
                    const key = params.groupBy === 'category' ? t.category : t.date;
                    dataMap.set(key, (dataMap.get(key) || 0) + t.amount);
                });

                const chartData = Array.from(dataMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => params.groupBy === 'date' ? a.name.localeCompare(b.name) : b.value - a.value);

                const chartTitle = `Analisis Pengeluaran per ${params.groupBy === 'category' ? 'Kategori' : 'Tanggal'}`;

                setMessages(prev => [...prev, {
                    id: `chart-${Date.now()}`,
                    text: '',
                    sender: 'system',
                    chartData: {
                        type: params.groupBy === 'category' ? 'pie' : 'bar',
                        data: chartData,
                        title: chartTitle
                    }
                }]);

                const summary = {
                    total: filtered.reduce((sum, t) => sum + t.amount, 0),
                    count: filtered.length,
                    top: chartData.slice(0, 3)
                };

                const stream = await sendToolResult(currentSession, action.toolCallId, JSON.stringify(summary));

                const nextAiId = `ai-${Date.now()}`;
                setMessages(prev => [...prev, { id: nextAiId, text: '', sender: 'ai' }]);
                await processStream(stream, nextAiId, '', currentSession);
            }
        } catch (e) {
            console.error("Auto-execution failed:", e);
        }
    };

    const executeAction = async (action: AIAction & { toolCallId?: string }) => {
        const actionParams = action.action;

        try {
            switch (actionParams.type) {
                case 'add_transaction': {
                    const txParams = actionParams.params;
                    await addTransaction({
                        type: mapTransactionType(txParams.type),
                        amount: txParams.amount,
                        description: txParams.description,
                        category: mapCategory(txParams.category),
                        date: txParams.date || new Date().toISOString().split('T')[0],
                        goalId: txParams.goalId
                    });
                    return { success: true, message: `Transaksi "${txParams.description}" sebesar ${formatCurrency(txParams.amount)} berhasil ditambahkan.` };
                }

                case 'update_transaction': {
                    const updateParams = actionParams.params;
                    const existingTx = transactions.find(t => t.id === updateParams.transactionId);
                    if (!existingTx) throw new Error("Transaksi tidak ditemukan.");

                    await updateTransaction({
                        ...existingTx,
                        type: updateParams.type ? mapTransactionType(updateParams.type) : existingTx.type,
                        amount: updateParams.amount || existingTx.amount,
                        description: updateParams.description || existingTx.description,
                        category: updateParams.category ? mapCategory(updateParams.category) : existingTx.category,
                        date: updateParams.date || existingTx.date
                    });
                    return { success: true, message: `Transaksi berhasil diperbarui.` };
                }

                case 'delete_transaction':
                    await deleteTransaction(actionParams.params.transactionId);
                    return { success: true, message: `Transaksi berhasil dihapus.` };

                case 'add_budget': {
                    const budgetParams = actionParams.params;
                    await addBudget({
                        category: mapCategory(budgetParams.category),
                        budget_limit: budgetParams.budget_limit
                    });
                    return { success: true, message: `Anggaran ${budgetParams.category} dengan limit ${formatCurrency(budgetParams.budget_limit)} berhasil dibuat.` };
                }

                case 'add_goal': {
                    const goalParams = actionParams.params;
                    await addGoal({
                        name: goalParams.name,
                        targetAmount: goalParams.targetAmount,
                        targetDate: goalParams.targetDate
                    });
                    return { success: true, message: `Goal "${goalParams.name}" dengan target ${formatCurrency(goalParams.targetAmount)} berhasil dibuat.` };
                }

                case 'add_bill': {
                    const addBillParams = actionParams.params;
                    await addBill({
                        name: addBillParams.name,
                        amount: addBillParams.amount,
                        nextDueDate: addBillParams.nextDueDate,
                        frequency: addBillParams.frequency
                    });
                    return { success: true, message: `Tagihan "${addBillParams.name}" berhasil dibuat.` };
                }

                case 'update_bill': {
                    const updateBillParams = actionParams.params;
                    const existingBill = bills.find(b => b.id === updateBillParams.billId);
                    if (!existingBill) throw new Error("Tagihan tidak ditemukan.");
                    await updateBill({
                        ...existingBill,
                        name: updateBillParams.name || existingBill.name,
                        amount: updateBillParams.amount || existingBill.amount,
                        nextDueDate: updateBillParams.nextDueDate || existingBill.nextDueDate,
                        frequency: updateBillParams.frequency || existingBill.frequency
                    });
                    return { success: true, message: `Tagihan berhasil diperbarui.` };
                }

                case 'delete_bill':
                    await deleteBill(actionParams.params.billId);
                    return { success: true, message: `Tagihan berhasil dihapus.` };

                case 'pay_bill': {
                    const billToPay = bills.find(b => b.id === actionParams.params.billId);
                    if (!billToPay) throw new Error("Tagihan tidak ditemukan atau sudah dibayar.");
                    await payBill(billToPay);
                    return { success: true, message: `Tagihan berhasil dibayar.` };
                }

                default:
                    throw new Error("Aksi tidak didukung.");
            }
        } catch (error: any) {
            return { success: false, message: error.message || "Terjadi kesalahan saat memproses aksi." };
        }
    };

    const confirmAction = async () => {
        if (!pendingAction || !chat) return;

        setIsExecutingAction(true);
        try {
            const result = await executeAction(pendingAction);
            await refreshData();

            if (pendingAction.toolCallId) {
                const resultMessage = result.success
                    ? `Berhasil: ${result.message}`
                    : `Gagal: ${result.message}`;

                const stream = await sendToolResult(chat, pendingAction.toolCallId, resultMessage);

                const aiMessageId = `ai-${Date.now()}`;
                setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

                await processStream(stream, aiMessageId, '', chat);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsExecutingAction(false);
            setPendingAction(null);
        }
    };

    const cancelAction = () => {
        setPendingAction(null);
        setMessages(prev => [...prev, { id: `sys-${Date.now()}`, text: "❌ Aksi dibatalkan pengguna.", sender: 'ai' }]);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        // Auto-initialize if required (lazy init)
        let currentChat = chat;
        if (!currentChat) {
            currentChat = await initChatSession();
            if (!currentChat) return; // Init failed
        }

        const userMessage: Message = { id: `user-${Date.now()}`, text: text, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const stream = await sendMessageToAI(currentChat, text);
            const aiMessageId = `ai-${Date.now()}`;
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

            await processStream(stream, aiMessageId, '', currentChat);
        } catch (e: any) {
            setError(e.message || "Gagal mengirim pesan.");
            const errorMsg: Message = { id: `err-${Date.now()}`, text: "Maaf, terjadi kesalahan saat merespons.", sender: 'ai' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const resetChat = async () => {
        setMessages([]);
        setChat(null);
        setPendingAction(null);
        setError(null);

        setIsLoading(true);
        try {
            const session = await initChatSession();
            if (session) {
                const initialUserMessage = "Halo, tolong sapa saya dan berikan tawaran bantuan sesuai instruksi sistem.";
                // We send this 'invisibly' to trigger the greeting? 
                // Alternatively, just let the user start?
                // The existing UI triggered a greeting. Let's keep consistency.
                const stream = await sendMessageToAI(session, initialUserMessage);
                const aiMessageId = `ai-${Date.now()}`;
                setMessages([{ id: aiMessageId, text: '', sender: 'ai' }]);
                await processStream(stream, aiMessageId, '', session);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ChatContext.Provider value={{
            chat,
            messages,
            isLoading,
            error,
            pendingAction,
            isExecutingAction,
            sendMessage,
            resetChat,
            confirmAction,
            cancelAction
        }}>
            {children}
        </ChatContext.Provider>
    );
};
