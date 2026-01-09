import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from './types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const generateMonthlyInsight = async (
    transactions: Transaction[],
    monthName: string,
    previousMonthTransactions: Transaction[]
): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key AI tidak ditemukan.");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Calculate current month stats
        const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        
        // Calculate top categories
        const expensesByCategory: Record<string, number> = {};
        transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });
            
        const topCategories = Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cat, amount]) => `${cat} (${formatCurrency(amount)})`)
            .join(', ');

        // Calculate previous month stats for comparison
        const prevIncome = previousMonthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const prevExpense = previousMonthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

        const incomeDiff = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
        const expenseDiff = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;

        const prompt = `
            Bertindaklah sebagai Senior Financial Analyst yang profesional, lugas, dan objektif.
            Analisis data keuangan pengguna untuk bulan ${monthName} ini.
            Gunakan bahasa Indonesia yang formal namun modern (seperti laporan bisnis profesional).
            HINDARI bahasa yang kekanak-kanakan, sapaan berlebihan ("Halo calon jutawan"), atau emoji yang tidak perlu.

            **Data Bulan Ini:**
            - Total Pemasukan: ${formatCurrency(income)}
            - Total Pengeluaran: ${formatCurrency(expense)}
            - Sisa Cashflow: ${formatCurrency(income - expense)}
            - Top 3 Pengeluaran: ${topCategories || "Belum ada data"}
            
            **Perbandingan dengan Bulan Lalu:**
            - Pemasukan: ${incomeDiff > 0 ? 'Naik' : 'Turun'} ${Math.abs(incomeDiff).toFixed(1)}%
            - Pengeluaran: ${expenseDiff > 0 ? 'Naik' : 'Turun'} ${Math.abs(expenseDiff).toFixed(1)}%
            
            **Instruksi Output:**
            Berikan laporan singkat (Executive Summary) dengan format poin-poin sebagai berikut:
            
            1.  **Evaluasi Kinerja**: Penilaian objektif terhadap kesehatan cashflow bulan ini.
            2.  **Insight Pengeluaran**: Analisis singkat mengenai pos pengeluaran terbesar atau anomali.
            3.  **Rekomendasi Strategis**: Satu atau dua saran konkret dan dapat ditindaklanjuti untuk efisiensi bulan depan.

            Jaga agar tetap ringkas, padat, dan "to the point". Cocok untuk profesional sibuk.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: prompt }] }]
        });

        return response.text || "Maaf, saya tidak bisa menghasilkan analisis saat ini.";

    } catch (error) {
        console.error("Error generating insight:", error);
        throw new Error("Gagal menghubungi AI.");
    }
};
