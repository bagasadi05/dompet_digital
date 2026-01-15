/**
 * AI Chat Service - Using @google/genai SDK for Gemini 2.5 Flash
 */
import { Transaction, Budget, Goal, TransactionType, Bill } from './types';
import { AIAction, AIActionType, createAIAction } from './aiActionTypes';
import { GoogleGenAI, Type } from "@google/genai";

// Tool definitions for Gemini function calling
const getToolsDefinitions = () => [
    {
        name: "get_transactions",
        description: "Mencari data transaksi berdasarkan filter tertentu. Gunakan ini sebelum melakukan update/delete untuk mendapatkan ID, atau saat user bertanya tentang riwayat.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                startDate: { type: Type.STRING, description: "Format YYYY-MM-DD" },
                endDate: { type: Type.STRING, description: "Format YYYY-MM-DD" },
                category: { type: Type.STRING, description: "Filter kategori spesifik" },
                limit: { type: Type.NUMBER, description: "Batasi jumlah hasil (default 5)" }
            }
        }
    },
    {
        name: "add_transaction",
        description: "Menambahkan transaksi baru (pemasukan atau pengeluaran) ke dompet pengguna",
        parameters: {
            type: Type.OBJECT,
            properties: {
                type: {
                    type: Type.STRING,
                    description: "Jenis transaksi (pemasukan/pengeluaran)",
                    enum: ["pemasukan", "pengeluaran"]
                },
                amount: {
                    type: Type.NUMBER,
                    description: "Jumlah uang dalam rupiah (angka saja tanpa formatting)"
                },
                description: {
                    type: Type.STRING,
                    description: "Deskripsi singkat transaksi"
                },
                category: {
                    type: Type.STRING,
                    description: "Kategori: Makanan & Minuman, Transportasi, Tagihan & Utilitas, Hiburan, Belanja, Kesehatan, Gaji, Tabungan & Investasi, Lainnya",
                    enum: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Hiburan", "Belanja", "Kesehatan", "Gaji", "Tabungan & Investasi", "Lainnya"]
                },
                date: {
                    type: Type.STRING,
                    description: "Tanggal transaksi dalam format YYYY-MM-DD, default hari ini jika tidak disebutkan"
                }
            },
            required: ["type", "amount", "description", "category"]
        }
    },
    {
        name: "update_transaction",
        description: "Mengubah data transaksi yang sudah ada. WAJIB tahu transactionId terlebih dahulu (gunakan get_transactions jika belum tahu).",
        parameters: {
            type: Type.OBJECT,
            properties: {
                transactionId: { type: Type.STRING, description: "ID Transaksi yang akan diubah" },
                type: { type: Type.STRING, enum: ["pemasukan", "pengeluaran"] },
                amount: { type: Type.NUMBER },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING }
            },
            required: ["transactionId"]
        }
    },
    {
        name: "delete_transaction",
        description: "Menghapus transaksi. WAJIB tahu transactionId terlebih dahulu.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                transactionId: { type: Type.STRING, description: "ID Transaksi yang akan dihapus" },
                description: { type: Type.STRING, description: "Deskripsi transaksi untuk konfirmasi user" }
            },
            required: ["transactionId"]
        }
    },
    {
        name: "add_budget",
        description: "Membuat anggaran baru untuk kategori tertentu",
        parameters: {
            type: Type.OBJECT,
            properties: {
                category: {
                    type: Type.STRING,
                    description: "Kategori anggaran",
                    enum: ["Makanan & Minuman", "Transportasi", "Tagihan & Utilitas", "Hiburan", "Belanja", "Kesehatan", "Tabungan & Investasi", "Lainnya"]
                },
                budget_limit: {
                    type: Type.NUMBER,
                    description: "Batas anggaran dalam rupiah"
                }
            },
            required: ["category", "budget_limit"]
        }
    },
    {
        name: "add_goal",
        description: "Membuat goal tabungan baru",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: {
                    type: Type.STRING,
                    description: "Nama goal tabungan"
                },
                targetAmount: {
                    type: Type.NUMBER,
                    description: "Target jumlah tabungan dalam rupiah"
                },
                targetDate: {
                    type: Type.STRING,
                    description: "Target tanggal tercapai dalam format YYYY-MM-DD"
                }
            },
            required: ["name", "targetAmount", "targetDate"]
        }
    },
    {
        name: "analyze_spending",
        description: "Analyze spending trends or category breakdown. Use this for 'trends', 'charts', 'composition', 'breakdown', or 'visualize'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                groupBy: {
                    type: Type.STRING,
                    enum: ["category", "date"],
                    description: "Group by 'category' for pie charts or 'date' for bar charts."
                },
                startDate: {
                    type: Type.STRING,
                    description: "Start date in YYYY-MM-DD format."
                },
                endDate: {
                    type: Type.STRING,
                    description: "End date in YYYY-MM-DD format."
                },
                type: {
                    type: Type.STRING,
                    enum: ["pemasukan", "pengeluaran"],
                    description: "Filter by transaction type. Defaults to 'pengeluaran'."
                }
            },
            required: ["groupBy"]
        }
    },
    {
        name: "add_bill",
        description: "Menambahkan tagihan rutin baru (subscription, listrik, air, internet, dll)",
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Nama tagihan" },
                amount: { type: Type.NUMBER, description: "Jumlah tagihan" },
                nextDueDate: { type: Type.STRING, description: "YYYY-MM-DD" },
                frequency: { type: Type.STRING, enum: ["once", "weekly", "monthly", "yearly"] }
            },
            required: ["name", "amount", "nextDueDate", "frequency"]
        }
    },
    {
        name: "pay_bill",
        description: "Membayar tagihan tertentu. WAJIB tahu billId terlebih dahulu.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                billId: { type: Type.STRING, description: "ID Tagihan" },
                name: { type: Type.STRING, description: "Nama tagihan (untuk konfirmasi)" },
                amount: { type: Type.NUMBER, description: "Jumlah yang dibayar" }
            },
            required: ["billId"]
        }
    },
    {
        name: "update_bill",
        description: "Mengupdate informasi tagihan yang sudah ada. WAJIB tahu billId.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                billId: { type: Type.STRING, description: "ID Tagihan" },
                name: { type: Type.STRING, description: "Nama baru (opsional)" },
                amount: { type: Type.NUMBER, description: "Jumlah baru (opsional)" },
                nextDueDate: { type: Type.STRING, description: "Jatuh tempo baru YYYY-MM-DD (opsional)" },
                frequency: { type: Type.STRING, enum: ["once", "weekly", "monthly", "yearly"], description: "Frekuensi baru (opsional)" }
            },
            required: ["billId"]
        }
    },
    {
        name: "delete_bill",
        description: "Menghapus tagihan secara permanen.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                billId: { type: Type.STRING, description: "ID Tagihan" },
                name: { type: Type.STRING, description: "Nama tagihan (untuk konfirmasi)" }
            },
            required: ["billId"]
        }
    }
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const constructSystemPrompt = (transactions: Transaction[], budgets: Budget[], goals: Goal[], bills: Bill[]): string => {
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
        recentTransactions: transactions.slice(0, 10).map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            category: t.category,
            amount: formatCurrency(t.amount),
            type: t.type
        })),
        budgets: budgets.map(b => ({
            id: b.id,
            category: b.category,
            limit: formatCurrency(b.budget_limit),
            spent: formatCurrency(b.spent)
        })),
        goals: goalsWithProgress.map(g => ({
            id: g.id,
            name: g.name,
            progress: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) + '%' : '0%'
        })),
        bills: bills.map(b => ({
            id: b.id,
            name: b.name,
            amount: formatCurrency(b.amount),
            dueDate: b.nextDueDate,
            frequency: b.frequency
        }))
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
};

// Message format for chat history
interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

// Chat session holds the AI client, conversation history, and context
export interface ChatSession {
    ai: GoogleGenAI;
    history: ChatMessage[];
    systemPrompt: string;
}

// Result type for AI response
export interface AIStreamResult {
    type: 'text' | 'action';
    text?: string;
    action?: AIAction;
}

export const startChatSession = async (
    transactions: Transaction[],
    budgets: Budget[],
    goals: Goal[],
    bills: Bill[]
): Promise<ChatSession | null> => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error("VITE_GOOGLE_AI_API_KEY is not set.");
        throw new Error("Kunci API untuk layanan AI belum diatur (Google AI).");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = constructSystemPrompt(transactions, budgets, goals, bills);

        return {
            ai,
            history: [],
            systemPrompt
        };
    } catch (error) {
        console.error("Error starting chat session:", error);
        throw new Error("Gagal memulai sesi chat dengan AI.");
    }
};

export const sendMessageToAI = async function* (
    chat: ChatSession,
    message: string
): AsyncGenerator<AIStreamResult> {
    try {
        // Add user message to history
        chat.history.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Build contents with system instruction first, then history
        const contents = [
            { role: 'user' as const, parts: [{ text: chat.systemPrompt }] },
            { role: 'model' as const, parts: [{ text: 'Understood. I am Dompet AI, ready to help with your finances.' }] },
            ...chat.history
        ];

        // Call Gemini with streaming
        const response = await chat.ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents,
            config: {
                tools: [{ functionDeclarations: getToolsDefinitions() as any }]
            }
        });

        let fullText = '';

        for await (const chunk of response) {
            // Handle text
            if (chunk.text) {
                fullText += chunk.text;
                yield { type: 'text', text: chunk.text };
            }

            // Handle function calls
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                for (const call of chunk.functionCalls) {
                    const actionName = call.name;
                    const actionParams = call.args || {};
                    const uniqueId = `${actionName}__${Date.now()}`;

                    try {
                        const action = createAIAction(actionName as AIActionType, actionParams);
                        (action as AIAction & { toolCallId: string }).toolCallId = uniqueId;
                        yield { type: 'action', action };
                    } catch (e) {
                        console.error('Failed to parse tool arguments:', e, actionParams);
                    }
                }
            }
        }

        // Add model response to history
        if (fullText) {
            chat.history.push({
                role: 'model',
                parts: [{ text: fullText }]
            });
        }

    } catch (error) {
        console.error("[AI Debug] Error sending message to AI:", error);
        throw new Error((error as Error).message || "Gagal mengirim pesan ke AI.");
    }
};

export const sendToolResult = async function* (
    chat: ChatSession,
    toolCallId: string,
    result: string
): AsyncGenerator<AIStreamResult> {
    try {
        const [funcName] = toolCallId.split('__');
        if (!funcName) throw new Error("Invalid toolCallId format");

        // Parse result to object if possible
        let responsePayload: object;
        try {
            responsePayload = JSON.parse(result);
        } catch {
            responsePayload = { result };
        }

        // Add tool response to history as a model turn with function response
        // For the new SDK, we simulate the function response in the conversation
        const toolResponseMessage = `[Tool Response for ${funcName}]: ${JSON.stringify(responsePayload)}`;
        
        chat.history.push({
            role: 'user',
            parts: [{ text: toolResponseMessage }]
        });

        // Build contents
        const contents = [
            { role: 'user' as const, parts: [{ text: chat.systemPrompt }] },
            { role: 'model' as const, parts: [{ text: 'Understood. I am Dompet AI, ready to help with your finances.' }] },
            ...chat.history
        ];

        // Get AI response after tool result
        const response = await chat.ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents,
            config: {
                tools: [{ functionDeclarations: getToolsDefinitions() }]
            }
        });

        let fullText = '';

        for await (const chunk of response) {
            if (chunk.text) {
                fullText += chunk.text;
                yield { type: 'text', text: chunk.text };
            }

            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                for (const call of chunk.functionCalls) {
                    const actionName = call.name;
                    const actionParams = call.args || {};
                    const uniqueId = `${actionName}__${Date.now()}`;

                    try {
                        const action = createAIAction(actionName as AIActionType, actionParams);
                        (action as AIAction & { toolCallId: string }).toolCallId = uniqueId;
                        yield { type: 'action', action };
                    } catch (e) {
                        console.error('Failed to parse tool arguments:', e, actionParams);
                    }
                }
            }
        }

        if (fullText) {
            chat.history.push({
                role: 'model',
                parts: [{ text: fullText }]
            });
        }

    } catch (error) {
        console.error("Error sending tool result:", error);
        throw new Error("Gagal mengirim hasil aksi ke AI.");
    }
};
