import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../contexts/ChatContext';
import AIActionConfirmDialog from './AIActionConfirmDialog';
import { AIChartWidget } from './AIChartWidget';
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
    const { messages, isLoading, error, pendingAction, isExecutingAction, sendMessage, resetChat, confirmAction, cancelAction } = useChat();
    const [userInput, setUserInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-init logic is now handled in Context (resetChat lazy init or similar)
    // However, if messages are empty and not loading, we might want to trigger the greeting?
    // The Context's `resetChat` triggers the greeting.
    // If we land here and it's a fresh session (null chat), `sendMessage` handles init.
    // But if we want an Initial Greeting on first load?
    // Let's rely on the user to initiate OR checking if messages are empty.

    useEffect(() => {
        // Optional: Trigger greeting if absolutely empty and not loading?
        // But `resetChat` does this.
        // Let's leave it passive unless user hits reset.
        // Actually, previous behavior was: initChat on mount if null.
        // We can check if messages.length === 0 here?
        // Let's stick to the persistent state. If I navigate away and back, messages are there.
        // If I refresh, state is lost (Context resets), so it's fresh.
        // Ideally we want the greeting if fresh.
        // We can expose `chat` from context and check it.
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const currentInput = userInput;
        setUserInput('');
        await sendMessage(currentInput);
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
                    onClick={() => resetChat()}
                    className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    title="Reset Chat"
                >
                    <RefreshIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-6 p-4 rounded-[32px] bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 shadow-inner mb-4 custom-scrollbar"
            >
                {messages.length === 0 && !isLoading && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 animate-float">
                            <SparklesIcon className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Dompet AI</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Tanyakan tentang pengeluaran, buat anggaran, atau minta saran keuangan.
                        </p>
                        <button
                            onClick={() => resetChat()}
                            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                        >
                            Mulai Percakapan
                        </button>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                        <div
                            className={`
                                max-w-[85%] md:max-w-[75%] p-4 text-sm leading-relaxed shadow-sm relative group
                                ${msg.sender === 'user'
                                    ? 'bg-gradient-to-br from-primary to-indigo-600 text-white rounded-[24px] rounded-br-[4px]'
                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-[24px] rounded-bl-[4px] border border-gray-100 dark:border-white/5'
                                }
                            `}
                        >
                            {msg.sender === 'ai' && (
                                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                                    AI
                                </div>
                            )}

                            {msg.sender === 'ai' ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                                        li: ({ ...props }) => <li className="mb-1" {...props} />,
                                        strong: ({ ...props }) => <strong className="font-bold text-indigo-600 dark:text-indigo-400" {...props} />,
                                        h3: ({ ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                                        code: ({ ...props }) => <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}

                            {msg.chartData && (
                                <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
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
                    <div className="flex justify-start pl-12">
                        <div className="bg-white dark:bg-gray-800 rounded-[24px] rounded-bl-[4px] p-4 border border-gray-100 dark:border-white/5 shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-center text-sm border border-rose-100 dark:border-rose-800 animate-shake">
                        {error}
                        <button onClick={() => resetChat()} className="block mx-auto mt-2 font-bold hover:underline">Coba lagi</button>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="relative pb-[env(safe-area-inset-bottom,0px)]">
                <div className="relative group">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ketik pesan Anda..."
                        disabled={isLoading || !!pendingAction}
                        className="w-full h-14 pl-6 pr-16 rounded-[24px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-lg shadow-gray-100/50 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed text-base font-medium transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!userInput.trim() || isLoading || !!pendingAction}
                        className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white rounded-[18px] transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-md shadow-primary/20"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 pointer-events-none" />
                    </button>
                </div>
            </form>

            <AIActionConfirmDialog
                action={pendingAction}
                onConfirm={confirmAction}
                onCancel={cancelAction}
                isLoading={isExecutingAction}
            />
        </div>
    );
};

export default AIChatPage;