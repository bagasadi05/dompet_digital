import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { startChatSession, sendMessageToAI, sendToolResult, ChatSession, AIStreamResult } from '../services/aiChatService';
import { AIAction, mapCategory, mapTransactionType } from '../services/aiActionTypes';
import { TransactionType } from '../services/types';
import AIActionConfirmDialog from './AIActionConfirmDialog';
import { AIChartWidget } from './AIChartWidget';
import { useData } from '../contexts/DataContext';
import { formatCurrency } from '../utils';
import {
    SparklesIcon,
    PaperAirplaneIcon,
    RefreshIcon,
} from './common/Icons';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai' | 'system';
    chartData?: {
        type: 'bar' | 'pie';
        data: { name: string; value: number }[];
        title: string;
    };
}

const AIChatPage: React.FC = () => {
    const { transactions, budgets, goals, addTransaction, updateTransaction, deleteTransaction, addBudget, addGoal, refreshData } = useData();
    const [chat, setChat] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<(AIAction & { toolCallId?: string }) | null>(null);
    const [isExecutingAction, setIsExecutingAction] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initChat = useCallback(async () => {
        try {
            setError(null);
            setIsLoading(true);
            setPendingAction(null);
            const chatSession = await startChatSession(transactions, budgets, goals);
            if (chatSession) {
                setChat(chatSession);

                const initialUserMessage = "Halo, tolong sapa saya dan berikan tawaran bantuan sesuai instruksi sistem.";
                const stream = await sendMessageToAI(chatSession, initialUserMessage);

                const aiMessageId = `ai-${Date.now()}`;
                setMessages([{ id: aiMessageId, text: '', sender: 'ai' }]);
                await processStream(stream, aiMessageId);
            } else {
                throw new Error("Gagal memulai sesi chat.");
            }
        } catch (e: any) {
            setError(e.message || "Terjadi kesalahan yang tidak diketahui.");
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [transactions, budgets, goals]);

    useEffect(() => {
        initChat();
    }, [initChat]);

    const handleAutoExecute = async (action: AIAction & { toolCallId?: string }, currentMessageId: string, currentText: string) => {
        if (!chat || !action.toolCallId) return;

        try {
            if (action.action.type === 'get_transactions') {
                const params = action.action.params as any;
                let filtered = transactions;

                // Filtering Logic
                if (params.category) filtered = filtered.filter(t => t.category.toLowerCase().includes(params.category.toLowerCase()));
                if (params.startDate) filtered = filtered.filter(t => t.date >= params.startDate);
                if (params.endDate) filtered = filtered.filter(t => t.date <= params.endDate);

                filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const limit = params.limit || 5;
                const resultData = filtered.slice(0, limit);

                const stream = await sendToolResult(chat, action.toolCallId, JSON.stringify(resultData));
                await processStream(stream, currentMessageId, currentText);

            } else if (action.action.type === 'analyze_spending') {
                const params = action.action.params as any;
                let filtered = transactions.filter(t => t.type === TransactionType.EXPENSE); // Default to expense
                if (params.type) filtered = transactions.filter(t => t.type === (params.type === 'pemasukan' ? TransactionType.INCOME : TransactionType.EXPENSE));

                if (params.startDate) filtered = filtered.filter(t => t.date >= params.startDate);
                if (params.endDate) filtered = filtered.filter(t => t.date <= params.endDate);

                // Aggregation
                const dataMap = new Map<string, number>();
                filtered.forEach(t => {
                    const key = params.groupBy === 'category' ? t.category : t.date;
                    dataMap.set(key, (dataMap.get(key) || 0) + t.amount);
                });

                const chartData = Array.from(dataMap.entries())
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => params.groupBy === 'date' ? a.name.localeCompare(b.name) : b.value - a.value); // Date asc, Category desc val

                const chartTitle = `Analisis Pengeluaran per ${params.groupBy === 'category' ? 'Kategori' : 'Tanggal'}`;

                // Add Chart Message
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

                const stream = await sendToolResult(chat, action.toolCallId, JSON.stringify(summary));

                // Create new AI message for follow-up comment
                const nextAiId = `ai-${Date.now()}`;
                setMessages(prev => [...prev, { id: nextAiId, text: '', sender: 'ai' }]);
                await processStream(stream, nextAiId);
            }
        } catch (e) {
            console.error("Auto-execution failed:", e);
        }
    };

    const processStream = async (stream: AsyncIterable<AIStreamResult>, aiMessageId: string, initialText: string = '') => {
        let fullResponse = initialText;

        for await (const chunk of stream) {
            if (chunk.type === 'text' && chunk.text) {
                fullResponse += chunk.text;
                // Update message seamlessly
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: fullResponse } : m));
            } else if (chunk.type === 'action' && chunk.action) {
                const actionWithId = {
                    ...chunk.action,
                    toolCallId: (chunk.action as any).toolCallId
                };

                // Check if auto-executable
                if (chunk.action.action.type === 'get_transactions' || chunk.action.action.type === 'analyze_spending') {
                    await handleAutoExecute(actionWithId, aiMessageId, fullResponse);
                    // Break current loop as handleAutoExecute takes over the stream
                    return;
                } else {
                    // Requires user confirmation
                    setPendingAction(actionWithId);
                }
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const userMessage: Message = { id: `user-${Date.now()}`, text: userInput, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = await sendMessageToAI(chat, currentInput);
            const aiMessageId = `ai-${Date.now()}`;
            setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

            await processStream(stream, aiMessageId);
        } catch (e: any) {
            setError(e.message || "Gagal mengirim pesan.");
            const errorMsg: Message = { id: `err-${Date.now()}`, text: "Maaf, terjadi kesalahan saat merespons.", sender: 'ai' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const executeAction = async (action: AIAction & { toolCallId?: string }) => {
        const actionParams = action.action;

        try {
            switch (actionParams.type) {
                case 'add_transaction':
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

                case 'update_transaction':
                    const updateParams = actionParams.params;
                    // Need to fetch full transaction first ideally, but here we blindly update fields provided
                    // Ideally updateTransaction in DataContext patches.
                    // Assuming updateTransaction takes a whole object or partial?
                    // Checked DataContext interface: updateTransaction: (data: Transaction) => Promise<void>;
                    // It expects a full Transaction object. This is a problem if AI only sends partial updates.
                    // But wait, the tool definition asks for ID.
                    // I need to find the transaction first.
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

                case 'delete_transaction':
                    await deleteTransaction(actionParams.params.transactionId);
                    return { success: true, message: `Transaksi berhasil dihapus.` };

                case 'add_budget':
                    const budgetParams = actionParams.params;
                    await addBudget({
                        category: mapCategory(budgetParams.category),
                        budget_limit: budgetParams.budget_limit
                    });
                    return { success: true, message: `Anggaran ${budgetParams.category} dengan limit ${formatCurrency(budgetParams.budget_limit)} berhasil dibuat.` };

                case 'add_goal':
                    const goalParams = actionParams.params;
                    await addGoal({
                        name: goalParams.name,
                        targetAmount: goalParams.targetAmount,
                        targetDate: goalParams.targetDate
                    });
                    return { success: true, message: `Goal "${goalParams.name}" dengan target ${formatCurrency(goalParams.targetAmount)} berhasil dibuat.` };

                default:
                    throw new Error("Aksi tidak didukung.");
            }
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    };

    const handleConfirmAction = async () => {
        if (!pendingAction || !chat) return;

        setIsExecutingAction(true);
        try {
            const result = await executeAction(pendingAction);

            // Refesh Data Context first
            await refreshData();

            // Send tool result back to AI
            if (pendingAction.toolCallId) {
                const resultMessage = result.success
                    ? `Berhasil: ${result.message}`
                    : `Gagal: ${result.message}`;

                const stream = await sendToolResult(chat, pendingAction.toolCallId, resultMessage);

                // Create a NEW message for the follow-up response after confirmation
                const aiMessageId = `ai-${Date.now()}`;
                setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai' }]);

                await processStream(stream, aiMessageId);
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsExecutingAction(false);
            setPendingAction(null);
        }
    };

    const handleCancelAction = () => {
        setPendingAction(null);
        setMessages(prev => [...prev, { id: `sys-${Date.now()}`, text: "❌ Aksi dibatalkan pengguna.", sender: 'ai' }]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-100px)] max-w-4xl mx-auto pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dompet AI</h1>
                        <p className="text-xs text-gray-500">Asisten Keuangan Pribadi</p>
                    </div>
                </div>
                <button
                    onClick={() => initChat()}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    title="Reset Chat"
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-4 p-4 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm mb-4 custom-scrollbar"
            >
                {messages.length === 0 && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-60">
                        <SparklesIcon className="w-16 h-16 mb-4" />
                        <p>Mulai percakapan dengan Dompet AI</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`
                                max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                                ${msg.sender === 'user'
                                    ? 'bg-primary text-white rounded-br-none'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                }
                            `}
                        >
                            {msg.sender === 'ai' ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}

                            {msg.chartData && (
                                <div className="mt-4">
                                    <AIChartWidget
                                        type={msg.chartData.type}
                                        data={msg.chartData.data}
                                        title={msg.chartData.title}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 rounded-bl-none flex gap-2 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-center text-sm">
                        {error}
                        <button onClick={initChat} className="block mx-auto mt-2 underline">Coba lagi</button>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="relative pb-[env(safe-area-inset-bottom,0px)]">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ketik pesan Anda..."
                    disabled={isLoading || !!pendingAction}
                    className="w-full h-12 pl-5 pr-14 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-primary shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                />
                <button
                    type="submit"
                    disabled={!userInput.trim() || isLoading || !!pendingAction}
                    className="absolute right-1.5 top-1.5 h-9 w-9 flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-lg transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-md shadow-primary/20"
                >
                    <PaperAirplaneIcon className="w-4 h-4" />
                </button>
            </form>

            <AIActionConfirmDialog
                action={pendingAction}
                onConfirm={handleConfirmAction}
                onCancel={handleCancelAction}
                isLoading={isExecutingAction}
            />
        </div>
    );
};

export default AIChatPage;