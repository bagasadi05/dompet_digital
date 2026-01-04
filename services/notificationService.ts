import { AppNotification, Bill, Budget, Goal, Transaction, TransactionType } from './types';
import { formatCurrency } from '../utils';

const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateNotifications = (
    bills: Bill[],
    budgets: Budget[],
    goals: Goal[],
    transactions: Transaction[]
): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Bill Reminders
    bills.forEach(bill => {
        const daysUntilDue = getDaysUntilDue(bill.nextDueDate);
        if (daysUntilDue >= 0 && daysUntilDue <= 3) {
            notifications.push({
                id: `bill-${bill.id}-${bill.nextDueDate}`,
                type: 'bill_due',
                title: `Tagihan Jatuh Tempo: ${bill.name}`,
                message: `Tagihan sebesar ${formatCurrency(bill.amount)} jatuh tempo ${daysUntilDue === 0 ? 'hari ini' : `dalam ${daysUntilDue} hari`}.`,
                linkTo: '/planning',
                relatedId: bill.id,
                isRead: false,
                createdAt: now.toISOString(),
                icon: 'bill',
            });
        }
    });

    // 2. Budget Alerts
    const monthlyExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonthYear))
        .reduce((acc, t) => {
            acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
            return acc;
        }, new Map<string, number>());

    budgets.forEach(budget => {
        const spent = monthlyExpenses.get(budget.category) || 0;
        const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;

        if (percentage > 100) {
            notifications.push({
                id: `budget-exceed-${budget.id}-${currentMonthYear}`,
                type: 'budget_exceeded',
                title: `Anggaran Terlampaui: ${budget.category}`,
                message: `Anda telah menghabiskan ${formatCurrency(spent)} dari anggaran ${formatCurrency(budget.budget_limit)}.`,
                linkTo: '/planning',
                relatedId: budget.id,
                isRead: false,
                createdAt: now.toISOString(),
                icon: 'budget',
            });
        } else if (percentage >= 90) {
            notifications.push({
                id: `budget-warn-${budget.id}-${currentMonthYear}`,
                type: 'budget_warning',
                title: `Peringatan Anggaran: ${budget.category}`,
                message: `Anda sudah menghabiskan ${percentage.toFixed(0)}% dari anggaran Anda bulan ini.`,
                linkTo: '/planning',
                relatedId: budget.id,
                isRead: false,
                createdAt: now.toISOString(),
                icon: 'budget',
            });
        }
    });

    // 3. Goal Achievements
    const savingsByGoal = transactions
        .filter(t => t.goalId)
        .reduce((acc, t) => {
            acc.set(t.goalId!, (acc.get(t.goalId!) || 0) + t.amount);
            return acc;
        }, new Map<string, number>());

    goals.forEach(goal => {
        const totalSaved = savingsByGoal.get(goal.id) || 0;
        if (totalSaved >= goal.targetAmount) {
            notifications.push({
                id: `goal-achieved-${goal.id}`,
                type: 'goal_achieved',
                title: `Impian Tercapai: ${goal.name}!`,
                message: `Selamat! Anda telah berhasil mengumpulkan dana untuk impian Anda.`,
                linkTo: '/planning',
                relatedId: goal.id,
                isRead: false,
                createdAt: now.toISOString(),
                icon: 'goal',
            });
        }
    });

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
