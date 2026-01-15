/**
 * Notification Scheduler Service
 * Handles scheduled and recurring notifications for the app
 */

import { formatCurrency } from '../utils';
import {
    sendDailyReminder,
    sendWeeklySummary,
    sendBillReminder,
    sendBudgetWarning,
    sendBudgetExceeded,
    sendGoalAchieved,
    getNotificationPermission
} from './pushNotificationService';
import { getTelegramConfig, sendTelegramMessage } from './telegramService';
import { Bill, Budget, Goal, Transaction, TransactionType } from './types';

// Notification preferences stored in localStorage
export interface NotificationPreferences {
    pushEnabled: boolean;
    dailyReminderEnabled: boolean;
    dailyReminderTime: string; // HH:mm format
    weeklyReportEnabled: boolean;
    billReminderDays: number; // Days before due date to remind
    budgetWarningThreshold: number; // Percentage (e.g., 80)
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    pushEnabled: true,
    dailyReminderEnabled: true,
    dailyReminderTime: '20:00',
    weeklyReportEnabled: true,
    billReminderDays: 3,
    budgetWarningThreshold: 80,
    soundEnabled: true,
    vibrationEnabled: true,
};

const STORAGE_KEY = 'notification_preferences';
const LAST_DAILY_KEY = 'last_daily_notification';
const LAST_WEEKLY_KEY = 'last_weekly_notification';

// Get notification preferences
export const getNotificationPreferences = (): NotificationPreferences => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('[NotificationScheduler] Error reading preferences:', error);
    }
    return DEFAULT_PREFERENCES;
};

// Save notification preferences
export const saveNotificationPreferences = (prefs: Partial<NotificationPreferences>): void => {
    try {
        const current = getNotificationPreferences();
        const updated = { ...current, ...prefs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('[NotificationScheduler] Error saving preferences:', error);
    }
};

// Check if daily reminder should be sent
const shouldSendDailyReminder = (prefs: NotificationPreferences): boolean => {
    if (!prefs.dailyReminderEnabled) return false;

    const now = new Date();
    const [hours, minutes] = prefs.dailyReminderTime.split(':').map(Number);

    // Check if current time is past the reminder time
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (now < reminderTime) return false;

    // Check if already sent today
    const lastSent = localStorage.getItem(LAST_DAILY_KEY);
    if (lastSent) {
        const lastDate = new Date(lastSent);
        if (lastDate.toDateString() === now.toDateString()) {
            return false; // Already sent today
        }
    }

    return true;
};

// Check if weekly summary should be sent (Sunday)
const shouldSendWeeklySummary = (prefs: NotificationPreferences): boolean => {
    if (!prefs.weeklyReportEnabled) return false;

    const now = new Date();
    if (now.getDay() !== 0) return false; // Not Sunday

    // Check if already sent this week
    const lastSent = localStorage.getItem(LAST_WEEKLY_KEY);
    if (lastSent) {
        const lastDate = new Date(lastSent);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (lastDate > weekAgo) {
            return false; // Already sent this week
        }
    }

    return true;
};

// Process and send scheduled notifications
export const processScheduledNotifications = (
    bills: Bill[],
    budgets: Budget[],
    goals: Goal[],
    transactions: Transaction[]
): void => {
    // Check permission first (for Push)
    // We proceed even if push is denied, as Telegram might be enabled
    const pushPermission = getNotificationPermission() === 'granted';
    const prefs = getNotificationPreferences();

    // Configure notification options based on preferences
    const notificationOptions: any = {
        silent: !prefs.soundEnabled,
        vibrate: (!prefs.vibrationEnabled && prefs.soundEnabled) ? [] : undefined
    };

    const now = new Date();

    // Daily reminder
    if (shouldSendDailyReminder(prefs)) {
        if (pushPermission && prefs.pushEnabled) sendDailyReminder(notificationOptions);

        // Telegram
        if (getTelegramConfig().enabled) {
            sendTelegramMessage('📝 *Pengingat Harian*\nJangan lupa catat pengeluaran hari ini!');
        }

        localStorage.setItem(LAST_DAILY_KEY, now.toISOString());
    }

    // Weekly summary
    if (shouldSendWeeklySummary(prefs)) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyExpenses = transactions
            .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= weekAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        const categorySpending = transactions
            .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) >= weekAgo)
            .reduce((acc, t) => {
                acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
                return acc;
            }, new Map<string, number>());

        let topCategory = 'Tidak ada';
        let maxSpent = 0;
        categorySpending.forEach((amount, category) => {
            if (amount > maxSpent) {
                maxSpent = amount;
                topCategory = category;
            }
        });

        const formattedTotal = formatCurrency(weeklyExpenses);

        if (pushPermission && prefs.pushEnabled) {
            sendWeeklySummary(formattedTotal, topCategory, notificationOptions);
        }

        // Telegram
        if (getTelegramConfig().enabled) {
            sendTelegramMessage(`📊 *Ringkasan Mingguan*\n\nMinggu ini Anda menghabiskan: ${formattedTotal}\nKategori tertinggi: ${topCategory}`);
        }

        localStorage.setItem(LAST_WEEKLY_KEY, now.toISOString());
    }

    // Bill reminders
    bills.forEach(bill => {
        const dueDate = new Date(bill.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue >= 0 && daysUntilDue <= prefs.billReminderDays) {
            const notifiedKey = `bill-notified-${bill.id}-${bill.nextDueDate}`;
            if (!localStorage.getItem(notifiedKey)) {
                if (pushPermission && prefs.pushEnabled) {
                    sendBillReminder(bill.name, formatCurrency(bill.amount), daysUntilDue, notificationOptions);
                }

                // Telegram
                if (getTelegramConfig().enabled) {
                    const dueText = daysUntilDue === 0 ? 'hari ini' : `dalam ${daysUntilDue} hari`;
                    sendTelegramMessage(`📅 *Pengingat Tagihan*\n\n${bill.name} (${formatCurrency(bill.amount)}) jatuh tempo ${dueText}`);
                }

                localStorage.setItem(notifiedKey, 'true');
            }
        }
    });

    // Budget warnings
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
        .reduce((acc, t) => {
            acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
            return acc;
        }, new Map<string, number>());

    budgets.forEach(budget => {
        const spent = monthlyExpenses.get(budget.category) || 0;
        const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;
        const notifiedKey = `budget-notified-${budget.id}-${currentMonth}-${Math.floor(percentage / 10) * 10}`;

        if (percentage >= 100 && !localStorage.getItem(notifiedKey)) {
            if (pushPermission && prefs.pushEnabled) {
                sendBudgetExceeded(budget.category, formatCurrency(spent), formatCurrency(budget.budget_limit), notificationOptions);
            }

            // Telegram
            if (getTelegramConfig().enabled) {
                sendTelegramMessage(`🚨 *Anggaran Terlampaui*\n\n${budget.category}: ${formatCurrency(spent)} dari ${formatCurrency(budget.budget_limit)}`);
            }

            localStorage.setItem(notifiedKey, 'true');
        } else if (percentage >= prefs.budgetWarningThreshold && percentage < 100 && !localStorage.getItem(notifiedKey)) {
            if (pushPermission && prefs.pushEnabled) {
                sendBudgetWarning(budget.category, Math.round(percentage), notificationOptions);
            }

            // Telegram
            if (getTelegramConfig().enabled) {
                sendTelegramMessage(`⚠️ *Peringatan Anggaran*\n\nAnggaran ${budget.category} sudah ${Math.round(percentage)}% terpakai bulan ini`);
            }

            localStorage.setItem(notifiedKey, 'true');
        }
    });

    // Goal achievements
    const savingsByGoal = transactions
        .filter(t => t.goalId)
        .reduce((acc, t) => {
            acc.set(t.goalId!, (acc.get(t.goalId!) || 0) + t.amount);
            return acc;
        }, new Map<string, number>());

    goals.forEach(goal => {
        const totalSaved = savingsByGoal.get(goal.id) || 0;
        const notifiedKey = `goal-achieved-${goal.id}`;

        if (totalSaved >= goal.targetAmount && !localStorage.getItem(notifiedKey)) {
            if (pushPermission && prefs.pushEnabled) {
                sendGoalAchieved(goal.name, notificationOptions);
            }

            // Telegram - Optional for goals, but good to have
            if (getTelegramConfig().enabled) {
                sendTelegramMessage(`🎉 *Impian Tercapai!*\n\nSelamat! Anda berhasil mencapai target "${goal.name}"`);
            }

            localStorage.setItem(notifiedKey, 'true');
        }
    });
};

// Clear all notification tracking (for testing)
export const clearNotificationTracking = (): void => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bill-notified-') ||
            key.startsWith('budget-notified-') ||
            key.startsWith('goal-achieved-') ||
            key === LAST_DAILY_KEY ||
            key === LAST_WEEKLY_KEY)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
};
