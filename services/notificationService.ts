import { LocalNotifications } from '@capacitor/local-notifications';
import { Bill, AppNotification, Budget, Goal, Transaction, TransactionType } from './types';
import { formatCurrency, calculatePaidAmounts } from '../utils';

export const generateNotifications = (
    bills: Bill[],
    budgets: Budget[],
    goals: Goal[],
    transactions: Transaction[]
): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-calculate paid amounts for efficiency
    const paidAmounts = calculatePaidAmounts(transactions);

    // 1. Bill Due Dates
    bills.forEach(bill => {
        const dueDate = new Date(bill.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);

        const paidAmount = paidAmounts.get(`${bill.id}-${bill.nextDueDate}`) || 0;
        const isPaid = paidAmount >= bill.amount - 1; // Tolerance

        if (!isPaid) {
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 3 && diffDays >= 0) {
                 notifications.push({
                    id: `bill-due-${bill.id}-${bill.nextDueDate}`,
                    type: 'bill_due',
                    title: 'Tagihan Segera Jatuh Tempo',
                    message: `${bill.name} (${formatCurrency(bill.amount)}) jatuh tempo ${diffDays === 0 ? 'hari ini' : `dalam ${diffDays} hari`}.`,
                    linkTo: '/transactions', // Or bills page if it existed as standalone route
                    relatedId: bill.id,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    icon: 'bill'
                });
            } else if (diffDays < 0) {
                notifications.push({
                    id: `bill-overdue-${bill.id}-${bill.nextDueDate}`,
                    type: 'bill_due',
                    title: 'Tagihan Terlewat',
                    message: `${bill.name} telah melewati jatuh tempo (${Math.abs(diffDays)} hari).`,
                    linkTo: '/transactions',
                    relatedId: bill.id,
                    isRead: false,
                    createdAt: new Date().toISOString(),
                    icon: 'bill'
                });
            }
        }
    });

    // 2. Budget Warnings
     const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
     const monthlyExpenses = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
        .reduce((acc, t) => {
            acc.set(t.category, (acc.get(t.category) || 0) + t.amount);
            return acc;
        }, new Map<string, number>());

    budgets.forEach(budget => {
        const spent = monthlyExpenses.get(budget.category) || 0;
        const percentage = budget.budget_limit > 0 ? (spent / budget.budget_limit) * 100 : 0;

        if (percentage >= 100) {
             notifications.push({
                id: `budget-exceeded-${budget.id}-${currentMonth}`,
                type: 'budget_exceeded',
                title: 'Anggaran Terlampaui',
                message: `Pengeluaran ${budget.category} telah melebihi batas anggaran (${formatCurrency(spent)} / ${formatCurrency(budget.budget_limit)}).`,
                linkTo: '/planning',
                relatedId: budget.id,
                isRead: false,
                createdAt: new Date().toISOString(), // In real app, might want to track when it actually crossed
                icon: 'budget'
            });
        } else if (percentage >= 80) {
             notifications.push({
                id: `budget-warning-${budget.id}-${currentMonth}`,
                type: 'budget_warning',
                title: 'Peringatan Anggaran',
                message: `Pengeluaran ${budget.category} telah mencapai ${Math.round(percentage)}% dari anggaran.`,
                linkTo: '/planning',
                relatedId: budget.id,
                isRead: false,
                createdAt: new Date().toISOString(),
                icon: 'budget'
            });
        }
    });

    // 3. Goals
    // Simple logic: if goal achieved
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
                title: 'Impian Tercapai!',
                message: `Selamat! Target "${goal.name}" telah tercapai.`,
                linkTo: '/planning',
                relatedId: goal.id,
                isRead: false,
                createdAt: new Date().toISOString(),
                icon: 'goal'
            });
         }
    });

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};


export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  },

  async scheduleBillNotification(bill: Bill) {
    try {
      let hasPermission = await this.checkPermissions();
      if (!hasPermission) {
          // Attempt to request if not yet determined (though often better to do in UI)
          hasPermission = await this.requestPermissions();
      }
      
      if (!hasPermission) {
          console.log('Notification permission denied, skipping schedule.');
          return;
      }

      const dueDate = new Date(bill.nextDueDate);
      const now = new Date();

      // Ensure we don't schedule for the past (unless it's due today but later? notifications are exact time)
      // Actually LocalNotifications with 'at' must be in future.
      // But if we verify 'diffDays >= 0', we might schedule for *later today* if hours allow.
      // For simplicity, schedule for 9 AM.
      
      const notificationId = this.generateIdFromString(bill.id);
      const notifications = [];

      // 1. One Day Before
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(dueDate.getDate() - 1);
      oneDayBefore.setHours(9, 0, 0, 0); 
      
      if (oneDayBefore.getTime() > now.getTime()) {
        notifications.push({
          title: 'Tagihan Segera Jatuh Tempo',
          body: `Tagihan ${bill.name} sebesar ${formatCurrency(bill.amount)} harus dibayar besok!`,
          id: notificationId,
          schedule: { at: oneDayBefore },
          extra: { billId: bill.id, type: 'reminder' },
          smallIcon: 'ic_stat_notifications', // Ensure resource exists
        });
      }

      // 2. On Due Date
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(9, 0, 0, 0);

      if (onDueDate.getTime() > now.getTime()) {
        notifications.push({
          title: 'Tagihan Jatuh Tempo Hari Ini',
          body: `Jangan lupa bayar tagihan ${bill.name} sebesar ${formatCurrency(bill.amount)} hari ini.`,
          id: notificationId + 1, // Different ID
          schedule: { at: onDueDate },
          extra: { billId: bill.id, type: 'urgent' },
          smallIcon: 'ic_stat_notifications',
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} notifications for bill ${bill.name}`);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  async cancelBillNotifications(billId: string) {
    try {
      const notificationId = this.generateIdFromString(billId);
      // Cancel both possible notifications (1 day before and on day)
      // Note: cancel expects list of IDs
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }, { id: notificationId + 1 }] });
    } catch (error) {
       // Ignore error if not found
       console.error('Error canceling notification:', error);
    }
  },

  generateIdFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 2147483647; 
  }
};
