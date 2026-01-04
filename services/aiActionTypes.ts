import { Transaction, Budget, Goal, Category, TransactionType } from './types';

// AI Action Types
export type AIActionType =
    | 'get_transactions'
    | 'analyze_spending'
    | 'add_transaction'
    | 'update_transaction'
    | 'delete_transaction'
    | 'add_budget'
    | 'update_budget'
    | 'delete_budget'
    | 'add_goal'
    | 'delete_goal';

// Parameter interfaces for each action
export interface AnalyzeSpendingParams {
    groupBy: 'category' | 'date';
    startDate?: string;
    endDate?: string;
    type?: 'pemasukan' | 'pengeluaran';
}

export interface GetTransactionsParams {
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
}

export interface AddTransactionParams {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    description: string;
    category: string;
    date?: string;
    goalId?: string;
}

export interface UpdateTransactionParams {
    transactionId: string;
    type?: 'pemasukan' | 'pengeluaran';
    amount?: number;
    description?: string;
    category?: string;
    date?: string;
}

export interface DeleteTransactionParams {
    transactionId: string;
    description?: string; // For display in confirmation
}

export interface AddBudgetParams {
    category: string;
    budget_limit: number;
}

export interface UpdateBudgetParams {
    budgetId: string;
    category: string;
    budget_limit: number;
}

export interface DeleteBudgetParams {
    budgetId: string;
    category?: string; // For display
}

export interface AddGoalParams {
    name: string;
    targetAmount: number;
    targetDate: string;
}

export interface DeleteGoalParams {
    goalId: string;
    name?: string; // For display
}

// Union type for all action parameters
export type AIActionParams =
    | { type: 'get_transactions'; params: GetTransactionsParams }
    | { type: 'analyze_spending'; params: AnalyzeSpendingParams }
    | { type: 'add_transaction'; params: AddTransactionParams }
    | { type: 'update_transaction'; params: UpdateTransactionParams }
    | { type: 'delete_transaction'; params: DeleteTransactionParams }
    | { type: 'add_budget'; params: AddBudgetParams }
    | { type: 'update_budget'; params: UpdateBudgetParams }
    | { type: 'delete_budget'; params: DeleteBudgetParams }
    | { type: 'add_goal'; params: AddGoalParams }
    | { type: 'delete_goal'; params: DeleteGoalParams };

// AI Action interface with metadata
export interface AIAction {
    id: string;
    action: AIActionParams;
    confirmationMessage: string;
    preview: ActionPreview;
}

export interface ActionPreview {
    title: string;
    details: { label: string; value: string }[];
    icon: 'transaction' | 'budget' | 'goal' | 'chart';
    variant: 'add' | 'delete' | 'update' | 'info';
}

// Helper to generate confirmation message
export function generateConfirmationMessage(action: AIActionParams): string {
    switch (action.type) {
        case 'get_transactions':
            return 'Mengambil data transaksi...';

        case 'analyze_spending':
            return 'Menganalisis data pengeluaran...';

        case 'add_transaction':
            const txType = action.params.type === 'pemasukan' ? 'pemasukan' : 'pengeluaran';
            return `Tambahkan ${txType} "${action.params.description}" sebesar ${formatCurrency(action.params.amount)}?`;

        case 'update_transaction':
            return `Update transaksi "${action.params.description || 'ini'}"?`;

        case 'delete_transaction':
            return `Hapus transaksi "${action.params.description || 'ini'}"?`;

        case 'add_budget':
            return `Buat anggaran ${action.params.category} dengan limit ${formatCurrency(action.params.budget_limit)}?`;

        case 'update_budget':
            return `Update anggaran ${action.params.category} menjadi ${formatCurrency(action.params.budget_limit)}?`;

        case 'delete_budget':
            return `Hapus anggaran ${action.params.category || 'ini'}?`;

        case 'add_goal':
            return `Buat goal tabungan "${action.params.name}" dengan target ${formatCurrency(action.params.targetAmount)}?`;

        case 'delete_goal':
            return `Hapus goal "${action.params.name || 'ini'}"?`;

        default:
            return 'Konfirmasi aksi ini?';
    }
}

// Helper to generate preview
export function generatePreview(action: AIActionParams): ActionPreview {
    switch (action.type) {
        case 'get_transactions':
            return {
                title: 'Mencari Data',
                icon: 'transaction',
                variant: 'info',
                details: []
            };

        case 'analyze_spending':
            return {
                title: 'Analisis Visual',
                icon: 'chart',
                variant: 'info',
                details: []
            };

        case 'add_transaction':
            return {
                title: action.params.type === 'pemasukan' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran',
                icon: 'transaction',
                variant: 'add',
                details: [
                    { label: 'Deskripsi', value: action.params.description },
                    { label: 'Jumlah', value: formatCurrency(action.params.amount) },
                    { label: 'Kategori', value: action.params.category },
                    { label: 'Tanggal', value: action.params.date || new Date().toISOString().split('T')[0] },
                ]
            };

        case 'update_transaction':
            const updates = [];
            if (action.params.amount) updates.push({ label: 'Jumlah Baru', value: formatCurrency(action.params.amount) });
            if (action.params.description) updates.push({ label: 'Deskripsi', value: action.params.description });
            if (action.params.category) updates.push({ label: 'Kategori', value: action.params.category });

            return {
                title: 'Update Transaksi',
                icon: 'transaction',
                variant: 'update',
                details: updates.length > 0 ? updates : [{ label: 'Info', value: 'Update detail transaksi' }]
            };

        case 'delete_transaction':
            return {
                title: 'Hapus Transaksi',
                icon: 'transaction',
                variant: 'delete',
                details: [
                    { label: 'Transaksi', value: action.params.description || action.params.transactionId }
                ]
            };

        case 'add_budget':
            return {
                title: 'Buat Anggaran',
                icon: 'budget',
                variant: 'add',
                details: [
                    { label: 'Kategori', value: action.params.category },
                    { label: 'Limit', value: formatCurrency(action.params.budget_limit) }
                ]
            };

        case 'update_budget':
            return {
                title: 'Update Anggaran',
                icon: 'budget',
                variant: 'update',
                details: [
                    { label: 'Kategori', value: action.params.category },
                    { label: 'Limit Baru', value: formatCurrency(action.params.budget_limit) }
                ]
            };

        case 'delete_budget':
            return {
                title: 'Hapus Anggaran',
                icon: 'budget',
                variant: 'delete',
                details: [
                    { label: 'Kategori', value: action.params.category || 'Unknown' }
                ]
            };

        case 'add_goal':
            return {
                title: 'Buat Goal Tabungan',
                icon: 'goal',
                variant: 'add',
                details: [
                    { label: 'Nama', value: action.params.name },
                    { label: 'Target', value: formatCurrency(action.params.targetAmount) },
                    { label: 'Target Tanggal', value: action.params.targetDate }
                ]
            };

        case 'delete_goal':
            return {
                title: 'Hapus Goal',
                icon: 'goal',
                variant: 'delete',
                details: [
                    { label: 'Goal', value: action.params.name || action.params.goalId }
                ]
            };

        default:
            return {
                title: 'Aksi',
                icon: 'transaction',
                variant: 'add',
                details: []
            };
    }
}

// Create AIAction from parsed tool call
export function createAIAction(actionType: AIActionType, params: Record<string, unknown>): AIAction {
    const action = { type: actionType, params: params as any } as AIActionParams;

    return {
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        action,
        confirmationMessage: generateConfirmationMessage(action),
        preview: generatePreview(action)
    };
}

// Utility
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Category mapping for AI responses
export const categoryMapping: Record<string, Category> = {
    'Makanan & Minuman': Category.MAKANAN,
    'Makanan': Category.MAKANAN,
    'Transportasi': Category.TRANSPORTASI,
    'Tagihan & Utilitas': Category.TAGIHAN,
    'Tagihan': Category.TAGIHAN,
    'Hiburan': Category.HIBURAN,
    'Belanja': Category.BELANJA,
    'Kesehatan': Category.KESEHATAN,
    'Gaji': Category.GAJI,
    'Tabungan & Investasi': Category.TABUNGAN,
    'Tabungan': Category.TABUNGAN,
    'Lainnya': Category.LAINNYA,
};

export function mapCategory(categoryStr: string): Category {
    return categoryMapping[categoryStr] || Category.LAINNYA;
}

export function mapTransactionType(typeStr: string): TransactionType {
    return typeStr === 'pemasukan' ? TransactionType.INCOME : TransactionType.EXPENSE;
}
