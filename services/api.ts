
import { supabase } from './supabaseClient';
import { Transaction, Budget, Goal, Bill, Category, SavingTip } from './types';

// Helper untuk menangani error dari Supabase
const handleSupabaseError = ({ error, data }: { error: any, data: any }, context: string) => {
    if (error) {
        console.error(`Error in ${context}:`, error.message || error);
        throw error;
    }
    return data;
}

// --- Transactions API ---
const getTransactions = async (userId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
    const transactions = handleSupabaseError({ data, error }, 'getTransactions');
    // Map snake_case to camelCase
    return transactions.map((tx: any) => ({
        ...tx,
        goalId: tx.goal_id,
        billId: tx.bill_id,
        date: tx.date.split('T')[0]
    }));
};

const addTransaction = async (tx: Omit<Transaction, 'id'> & { user_id: string }): Promise<Transaction | null> => {
    const { goalId, billId, ...restOfTx } = tx;
    const { data, error } = await supabase
        .from('transactions')
        .insert({ ...restOfTx, goal_id: goalId, bill_id: billId })
        .select()
        .single();
    const newTx = handleSupabaseError({ data, error }, 'addTransaction');
    return newTx ? {
        ...newTx,
        goalId: newTx.goal_id,
        billId: newTx.bill_id,
        date: newTx.date.split('T')[0]
    } : null;
}

const updateTransaction = async (tx: Transaction): Promise<Transaction | null> => {
    const { id, goalId, billId, ...restOfTx } = tx;
    const { data, error } = await supabase
        .from('transactions')
        .update({ ...restOfTx, goal_id: goalId, bill_id: billId })
        .eq('id', id)
        .select()
        .single();
    const updatedTx = handleSupabaseError({ data, error }, 'updateTransaction');
    return updatedTx ? {
        ...updatedTx,
        goalId: updatedTx.goal_id,
        billId: updatedTx.bill_id,
        date: updatedTx.date.split('T')[0]
    } : null;
}

const deleteTransaction = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteTransaction');
}


// --- Budgets API ---
const getBudgets = async (userId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
        .from('budgets')
        .select('id, category, budget_limit')
        .eq('user_id', userId);
    const budgets = handleSupabaseError({ data, error }, 'getBudgets');
    return budgets.map((b: any) => ({ ...b, spent: 0 }));
};

const addBudget = async (budget: Omit<Budget, 'id' | 'spent'> & { user_id: string }): Promise<Budget | null> => {
    const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: budget.user_id, category: budget.category, budget_limit: budget.budget_limit })
        .select('id, category, budget_limit')
        .single();
    const newBudget = handleSupabaseError({ data, error }, 'addBudget');
    return newBudget ? { ...newBudget, spent: 0 } : null;
};

const updateBudget = async (budget: { id: string, category: Category, budget_limit: number }): Promise<Budget | null> => {
    const { data, error } = await supabase
        .from('budgets')
        .update({ budget_limit: budget.budget_limit })
        .eq('id', budget.id)
        .select('id, category, budget_limit')
        .single();
    const updatedBudget = handleSupabaseError({ data, error }, 'updateBudget');
    return updatedBudget ? { ...updatedBudget, spent: 0 } : null;
};

const deleteBudget = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteBudget');
};


// --- Goals API ---
const getGoals = async (userId: string): Promise<Goal[]> => {
    const { data, error } = await supabase
        .from('goals')
        .select('id, name, target_amount, target_date')
        .eq('user_id', userId);
    const goals = handleSupabaseError({ data, error }, 'getGoals');
    return goals.map((g: any) => ({ ...g, targetAmount: g.target_amount, targetDate: g.target_date.split('T')[0], currentAmount: 0 }));
};

const addGoal = async (goal: Omit<Goal, 'id' | 'currentAmount'> & { user_id: string }): Promise<Goal | null> => {
    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id: goal.user_id,
            name: goal.name,
            target_amount: goal.targetAmount,
            target_date: goal.targetDate,
        })
        .select('id, name, target_amount, target_date')
        .single();
    const newGoal = handleSupabaseError({ data, error }, 'addGoal');
    return newGoal ? { ...newGoal, targetAmount: newGoal.target_amount, targetDate: newGoal.target_date.split('T')[0], currentAmount: 0 } : null;
};

const updateGoal = async (goal: Omit<Goal, 'currentAmount'>): Promise<Goal | null> => {
    const { data, error } = await supabase
        .from('goals')
        .update({ name: goal.name, target_amount: goal.targetAmount, target_date: goal.targetDate })
        .eq('id', goal.id)
        .select('id, name, target_amount, target_date')
        .single();
    const updatedGoal = handleSupabaseError({ data, error }, 'updateGoal');
    return updatedGoal ? { ...updatedGoal, targetAmount: updatedGoal.target_amount, targetDate: updatedGoal.target_date.split('T')[0], currentAmount: 0 } : null;
};

const deleteGoal = async (id: string): Promise<void> => {
    // The ON DELETE SET NULL constraint in the database will handle unlinking transactions.
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteGoal');
};

// --- Bills API ---
const getBills = async (userId: string): Promise<Bill[]> => {
    const { data, error } = await supabase
        .from('bills')
        .select('*') // Use wildcard select to be robust against missing columns
        .eq('user_id', userId);
    const bills = handleSupabaseError({ data, error }, 'getBills');
    return bills.map((b: any) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        nextDueDate: b.due_date.split('T')[0],
        frequency: b.frequency || 'once', // Default to 'once' if frequency column is missing
    }));
};

const addBill = async (bill: Omit<Bill, 'id'> & { user_id: string }): Promise<Bill | null> => {
    const { nextDueDate, frequency, ...restOfBill } = bill;
    const { data, error } = await supabase
        .from('bills')
        .insert({ ...restOfBill, due_date: nextDueDate, frequency: frequency })
        .select('id, name, amount, due_date, frequency')
        .single();
    const newBill = handleSupabaseError({ data, error }, 'addBill');
    return newBill ? { ...newBill, nextDueDate: newBill.due_date.split('T')[0], frequency: newBill.frequency } : null;
};

const updateBill = async (bill: Bill): Promise<Bill | null> => {
    const { id, nextDueDate, ...rest } = bill;
    const { data, error } = await supabase
        .from('bills')
        .update({ ...rest, due_date: nextDueDate })
        .eq('id', id)
        .select('id, name, amount, due_date, frequency')
        .single();
    const updatedBill = handleSupabaseError({ data, error }, 'updateBill');
    return updatedBill ? { ...updatedBill, nextDueDate: updatedBill.due_date.split('T')[0], frequency: updatedBill.frequency } : null;
};

const deleteBill = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);
    if (error) handleSupabaseError({ data: null, error }, 'deleteBill');
};

// --- New RPC Call for Paying Bills ---
const payBill = async (billId: string): Promise<void> => {
    const { error } = await supabase.rpc('pay_bill_and_update', {
        bill_id_to_pay: billId
    });

    if (error) {
        console.error('Error paying bill via RPC:', error);
        // Provide a more user-friendly error message
        throw new Error('Gagal memproses pembayaran tagihan. Pastikan tagihan masih ada dan coba lagi.');
    }
};

// --- Saving Tips (Local Mock) ---
const MOCK_SAVING_TIPS: SavingTip[] = [
    { id: 'tip1', tip: 'Buat kopi sendiri di rumah untuk menghemat pengeluaran harian.' },
    { id: 'tip2', tip: 'Manfaatkan promo dan diskon saat berbelanja kebutuhan bulanan.' },
    { id: 'tip3', tip: 'Buat daftar belanja sebelum ke supermarket dan patuhi daftar itu.' },
    { id: 'tip4', tip: 'Coba "aturan 30 hari": tunda pembelian barang yang tidak mendesak selama 30 hari.' },
    { id: 'tip5', tip: 'Evaluasi langganan bulanan Anda dan batalkan yang jarang digunakan.' },
];

const getSavingTip = (): Promise<SavingTip> => {
    return Promise.resolve(MOCK_SAVING_TIPS[Math.floor(Math.random() * MOCK_SAVING_TIPS.length)]);
};


const api = {
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getBills,
    addBill,
    updateBill,
    deleteBill,
    payBill,
    getSavingTip,
};

export default api;