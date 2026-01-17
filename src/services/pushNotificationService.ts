/**
 * Push Notification Service
 * Handles browser push notifications for the Dompet Digital app
 */

export interface PushNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    vibrate?: number[];
    onClick?: () => void;
}

// Check if browser supports notifications
export const isNotificationSupported = (): boolean => {
    return 'Notification' in window;
};

// Get current permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
    if (!isNotificationSupported()) {
        return 'unsupported';
    }
    return Notification.permission;
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isNotificationSupported()) {
        console.warn('[PushNotification] Browser does not support notifications');
        return 'unsupported';
    }

    try {
        const permission = await Notification.requestPermission();
        console.log('[PushNotification] Permission result:', permission);
        return permission;
    } catch (error) {
        console.error('[PushNotification] Error requesting permission:', error);
        return 'denied';
    }
};

// Send a push notification
export const sendPushNotification = (options: PushNotificationOptions): Notification | null => {
    if (!isNotificationSupported()) {
        console.warn('[PushNotification] Browser does not support notifications');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('[PushNotification] Notification permission not granted');
        return null;
    }

    try {
        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/logo192.png',
            tag: options.tag,
            requireInteraction: options.requireInteraction || false,
            silent: options.silent,
            vibrate: options.vibrate,
        } as any);

        if (options.onClick) {
            notification.onclick = () => {
                window.focus();
                options.onClick?.();
                notification.close();
            };
        }

        return notification;
    } catch (error) {
        console.error('[PushNotification] Error sending notification:', error);
        return null;
    }
};

// Notification types for the app
export type NotificationType =
    | 'bill_reminder'
    | 'budget_warning'
    | 'budget_exceeded'
    | 'goal_achieved'
    | 'daily_reminder'
    | 'weekly_summary'
    | 'spending_insight';

// Pre-configured notification templates
export const sendBillReminder = (billName: string, amount: string, daysUntilDue: number, options?: Partial<PushNotificationOptions>): Notification | null => {
    const dueText = daysUntilDue === 0 ? 'hari ini' : `dalam ${daysUntilDue} hari`;
    return sendPushNotification({
        title: '📅 Pengingat Tagihan',
        body: `${billName} (${amount}) jatuh tempo ${dueText}`,
        tag: `bill-${billName}`,
        requireInteraction: true,
        ...options
    });
};

export const sendBudgetWarning = (category: string, percentage: number, options?: Partial<PushNotificationOptions>): Notification | null => {
    return sendPushNotification({
        title: '⚠️ Peringatan Anggaran',
        body: `Anggaran ${category} sudah ${percentage}% terpakai bulan ini`,
        tag: `budget-${category}`,
        ...options
    });
};

export const sendBudgetExceeded = (category: string, spent: string, limit: string, options?: Partial<PushNotificationOptions>): Notification | null => {
    return sendPushNotification({
        title: '🚨 Anggaran Terlampaui',
        body: `${category}: ${spent} dari ${limit}`,
        tag: `budget-exceeded-${category}`,
        requireInteraction: true,
        ...options
    });
};

export const sendGoalAchieved = (goalName: string, options?: Partial<PushNotificationOptions>): Notification | null => {
    return sendPushNotification({
        title: '🎉 Impian Tercapai!',
        body: `Selamat! Anda berhasil mencapai target "${goalName}"`,
        tag: `goal-${goalName}`,
        requireInteraction: true,
        ...options
    });
};

export const sendDailyReminder = (options?: Partial<PushNotificationOptions>): Notification | null => {
    return sendPushNotification({
        title: '📝 Pengingat Harian',
        body: 'Jangan lupa catat pengeluaran hari ini!',
        tag: 'daily-reminder',
        ...options
    });
};

export const sendWeeklySummary = (totalSpent: string, topCategory: string, options?: Partial<PushNotificationOptions>): Notification | null => {
    return sendPushNotification({
        title: '📊 Ringkasan Mingguan',
        body: `Minggu ini Anda menghabiskan ${totalSpent}. Kategori tertinggi: ${topCategory}`,
        tag: 'weekly-summary',
        requireInteraction: true,
        ...options
    });
};
