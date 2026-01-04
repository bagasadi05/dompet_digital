
import { Transaction, Budget, Goal, TransactionType, Category } from './types';
import { AIAction, AIActionType, createAIAction } from './aiActionTypes';

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    reasoning_details?: unknown;
    tool_calls?: ToolCall[];
    tool_call_id?: string;
}

interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

interface ChatSession {
    messages: ChatMessage[];
    systemPrompt: string;
}

// AI Tools Definition for OpenRouter
const AI_TOOLS = [
    {
        type: "function",
        function: {
            name: "get_transactions",
            description: "Mencari data transaksi berdasarkan filter tertentu. Gunakan ini sebelum melakukan update/delete untuk mendapatkan ID, atau saat user bertanya tentang riwayat.",
            parameters: {
                type: "object",
                properties: {
                    startDate: { type: "string", description: "Format YYYY-MM-DD" },
                    endDate: { type: "string", description: "Format YYYY-MM-DD" },
                    category: { type: "string", description: "Filter kategori spesifik" },
                    limit: { type: "number", description: "Batasi jumlah hasil (default 5)" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_transaction",
            description: "Menambahkan transaksi baru (pemasukan atau pengeluaran) ke dompet pengguna",
            parameters: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["pemasukan", "pengeluaran"],
                        description: "Jenis transaksi"
                    },
                    amount: {
                        type: "number",
                        description: "Jumlah uang dalam rupiah (angka saja tanpa formatting)"
                    },
                    description: {
                        type: "string",
                        description: "Deskripsi singkat transaksi"
                    },
                    category: {
                        type: "string",
                        enum: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Hiburan", "Belanja", "Kesehatan", "Gaji", "Tabungan & Investasi", "Lainnya"],
                        description: "Kategori transaksi"
                    },
                    date: {
                        type: "string",
                        description: "Tanggal transaksi dalam format YYYY-MM-DD, default hari ini jika tidak disebutkan"
                    }
                },
                required: ["type", "amount", "description", "category"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_transaction",
            description: "Mengubah data transaksi yang sudah ada. WAJIB tahu transactionId terlebih dahulu (gunakan get_transactions jika belum tahu).",
            parameters: {
                type: "object",
                properties: {
                    transactionId: { type: "string", description: "ID Transaksi yang akan diubah" },
                    type: { type: "string", enum: ["pemasukan", "pengeluaran"] },
                    amount: { type: "number" },
                    description: { type: "string" },
                    category: { type: "string" },
                    date: { type: "string" }
                },
                required: ["transactionId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_transaction",
            description: "Menghapus transaksi. WAJIB tahu transactionId terlebih dahulu.",
            parameters: {
                type: "object",
                properties: {
                    transactionId: { type: "string", description: "ID Transaksi yang akan dihapus" },
                    description: { type: "string", description: "Deskripsi transaksi untuk konfirmasi user" }
                },
                required: ["transactionId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_budget",
            description: "Membuat anggaran baru untuk kategori tertentu",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        enum: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Hiburan", "Belanja", "Kesehatan", "Tabungan & Investasi", "Lainnya"],
                        description: "Kategori anggaran"
                    },
                    budget_limit: {
                        type: "number",
                        description: "Batas anggaran dalam rupiah"
                    }
                },
                required: ["category", "budget_limit"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_goal",
            description: "Membuat goal tabungan baru",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Nama goal tabungan"
                    },
                    targetAmount: {
                        type: "number",
                        description: "Target jumlah tabungan dalam rupiah"
                    },
                    targetDate: {
                        type: "string",
                        description: "Target tanggal tercapai dalam format YYYY-MM-DD"
                    }
                },
                required: ["name", "targetAmount", "targetDate"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "analyze_spending",
            description: "Analyze spending trends or category breakdown. Use this for 'trends', 'charts', 'composition', 'breakdown', or 'visualize'.",
            parameters: {
                type: "object",
                properties: {
                    groupBy: {
                        type: "string",
                        enum: ["category", "date"],
                        description: "Group by 'category' for pie charts or 'date' for bar charts."
                    },
                    startDate: {
                        type: "string",
                        description: "Start date in YYYY-MM-DD format."
                    },
                    endDate: {
                        type: "string",
                        description: "End date in YYYY-MM-DD format."
                    },
                    type: {
                        type: "string",
                        enum: ["pemasukan", "pengeluaran"],
                        description: "Filter by transaction type. Defaults to 'pengeluaran'."
                    }
                },
                required: ["groupBy"]
            }
        }
    }
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const constructSystemPrompt = (transactions: Transaction[], budgets: Budget[], goals: Goal[]): string => {
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    const goalsWithProgress = goals.map(goal => {
        const savedAmount = transactions
            .filter(t => t.goalId === goal.id)
            .reduce((sum, t) => sum + t.amount, 0);
        return { ...goal, currentAmount: savedAmount };
    });

    const financialSummary = {
        info: "Ini adalah ringkasan data TERBARU (maks 10 transaksi terakhir). Jika user bertanya tentang data lampau atau spesifik, GUNAKAN TOOL get_transactions.",
        totalIncome: formatCurrency(totalIncome),
        totalExpense: formatCurrency(totalExpense),
        recentTransactions: transactions.slice(0, 10).map(t => ({ // Limited to 10
            id: t.id,
            date: t.date,
            description: t.description,
            category: t.category,
            amount: formatCurrency(t.amount),
            type: t.type
        })),
        budgets: budgets.map(b => ({
            id: b.id, // ID needed for updates
            category: b.category,
            limit: formatCurrency(b.budget_limit),
            spent: formatCurrency(b.spent)
        })),
        goals: goalsWithProgress.map(g => ({
            id: g.id, // ID needed for updates
            name: g.name,
            progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) + '%' : '0%'
        })),
    };

    const today = new Date().toISOString().split('T')[0];

    return `Kamu adalah "Dompet AI" - asisten keuangan pribadi yang cerdas.

## Strategi Penggunaan Tools
1. **READ FIRST**: Jika user ingin mengubah/menghapus transaksi ("ubah makan kemarin"), dilarang menebak ID!
   - Step 1: Panggil \`get_transactions\` dengan filter yang relevan (misal: category='Makanan', limit=5).
   - Step 2: Baca hasil tool, temukan ID transaksi yang dimaksud.
   - Step 3: Panggil \`update_transaction\` atau \`delete_transaction\` menggunakan ID tersebut.

2. **QUERY PINTAR**: Jika data di "Recent Transactions" tidak cukup menjawab, gunakan \`get_transactions\`.
   - Contoh: "Berapa pengeluaran bensin bulan lalu?" -> \`get_transactions(category='Transportasi', startDate='...', endDate='...')\`

3. **VISUALIZATION**: Gunakan \`analyze_spending\` jika user meminta grafik, tren, atau komposisi.
   - "Tampilkan tren pengeluaran" -> \`analyze_spending(groupBy='date')\` -> UI akan merender Bar Chart.
   - "Komposisi pengeluaran bulan ini" -> \`analyze_spending(groupBy='category')\` -> UI akan merender Pie Chart.

4. **CONFIRMATION**: Selalu jelaskan apa yang kamu lakukan di akhir respons.
   - "Saya menemukan transaksi 'Nasi Goreng' sebesar 15.000 tanggal 12 Okt. Apakah ini yang ingin dihapus?"

## Data Context (Saat Ini)
${JSON.stringify(financialSummary, null, 2)}
Tanggal Hari Ini: ${today}

## Kepribadian
- Ramah, proaktif, dan teliti.
- Gunakan emoji 💰📊
- Jika user minta saran hemat, berikan berdasarkan data.`;
}

export const startChatSession = async (transactions: Transaction[], budgets: Budget[], goals: Goal[]): Promise<ChatSession | null> => {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
        console.error("OPENROUTER_API_KEY is not set.");
        throw new Error("Kunci API untuk layanan AI belum diatur. Fitur ini tidak tersedia.");
    }

    try {
        const systemPrompt = constructSystemPrompt(transactions, budgets, goals);
        const chatSession: ChatSession = {
            messages: [],
            systemPrompt: systemPrompt,
        };
        return chatSession;
    } catch (error) {
        console.error("Error starting chat session:", error);
        throw new Error("Gagal memulai sesi chat dengan AI.");
    }
};

// Result type for AI response
export interface AIStreamResult {
    type: 'text' | 'action';
    text?: string;
    action?: AIAction;
}

export const sendMessageToAI = async (chat: ChatSession, message: string) => {
    try {
        chat.messages.push({ role: 'user', content: message });

        const model = import.meta.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

        // Debug logging
        console.log('[AI Debug] Model:', model);
        console.log('[AI Debug] API Key present:', !!apiKey);
        console.log('[AI Debug] API Key length:', apiKey?.length || 0);

        if (!apiKey) {
            throw new Error('API Key tidak ditemukan. Pastikan VITE_OPENROUTER_API_KEY ada di file .env');
        }

        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: chat.systemPrompt },
                ...chat.messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
                    ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
                }))
            ],
            tools: AI_TOOLS,
            tool_choice: "auto",
            stream: true,
            temperature: 0.7,
            max_tokens: 1024
        };

        console.log('[AI Debug] Sending request to:', OPENROUTER_API_URL);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Dompet Digital AI'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('[AI Debug] Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI Debug] Error response:', errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return createStreamWrapper(response, chat);
    } catch (error: any) {
        console.error("[AI Debug] Error sending message to AI:", error);
        throw new Error(error.message || "Gagal mengirim pesan ke AI.");
    }
};

// Send tool result back to AI
export const sendToolResult = async (chat: ChatSession, toolCallId: string, result: string) => {
    try {
        chat.messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCallId
        });

        const model = import.meta.env.VITE_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free';

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Dompet Digital AI'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: chat.systemPrompt },
                    ...chat.messages.map(m => ({
                        role: m.role,
                        content: m.content,
                        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
                        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
                    }))
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to get AI response');
        }

        return createStreamWrapper(response, chat);
    } catch (error) {
        console.error("Error sending tool result:", error);
        throw new Error("Gagal mengirim hasil aksi ke AI.");
    }
};

function createStreamWrapper(response: Response, chat: ChatSession) {
    let fullContent = '';
    let reasoningDetails: unknown = undefined;
    let toolCalls: ToolCall[] = [];
    let pendingActions: AIAction[] = [];

    const asyncIterator = {
        async *[Symbol.asyncIterator](): AsyncGenerator<AIStreamResult> {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const data = JSON.parse(line.slice(6));
                                const delta = data.choices?.[0]?.delta;
                                const finishReason = data.choices?.[0]?.finish_reason;

                                // Handle text content
                                const content = delta?.content || '';
                                if (content) {
                                    fullContent += content;
                                    yield { type: 'text', text: content };
                                }

                                // Handle tool calls
                                if (delta?.tool_calls) {
                                    for (const tc of delta.tool_calls) {
                                        const idx = tc.index;
                                        if (!toolCalls[idx]) {
                                            toolCalls[idx] = {
                                                id: tc.id || '',
                                                type: 'function',
                                                function: { name: '', arguments: '' }
                                            };
                                        }
                                        if (tc.id) toolCalls[idx].id = tc.id;
                                        if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                                        if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                                    }
                                }

                                // Capture reasoning_details if present
                                if (delta?.reasoning_details) {
                                    reasoningDetails = delta.reasoning_details;
                                }

                                // When stream ends with tool_calls, yield actions
                                if (finishReason === 'tool_calls' || finishReason === 'stop') {
                                    for (const tc of toolCalls) {
                                        if (tc.function.name && tc.function.arguments) {
                                            try {
                                                const params = JSON.parse(tc.function.arguments);
                                                const action = createAIAction(tc.function.name as AIActionType, params);
                                                (action as any).toolCallId = tc.id;
                                                pendingActions.push(action);
                                                yield { type: 'action', action };
                                            } catch (e) {
                                                console.error('Failed to parse tool arguments:', e);
                                            }
                                        }
                                    }
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }

                // Add assistant response to history
                if (fullContent || toolCalls.length > 0) {
                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: fullContent,
                    };

                    if (reasoningDetails) {
                        assistantMessage.reasoning_details = reasoningDetails;
                    }

                    if (toolCalls.length > 0) {
                        assistantMessage.tool_calls = toolCalls;
                    }

                    chat.messages.push(assistantMessage);
                }
            } finally {
                reader.releaseLock();
            }
        }
    };

    return asyncIterator;
}

export type { ChatSession };
