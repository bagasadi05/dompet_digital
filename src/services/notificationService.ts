import { LocalNotifications } from '@capacitor/local-notifications';
import { Bill } from './types';

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
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) return;

      const dueDate = new Date(bill.nextDueDate);
      const now = new Date();

      // Ensure we don't schedule for the past
      if (dueDate.getTime() <= now.getTime()) return;

      // Create a unique ID for the notification based on the bill ID
      // We'll use a simple hash or just a random number if bill.id is string
      // For stability, let's try to generate a consistent integer ID from the string UUID
      const notificationId = this.generateIdFromString(bill.id);

      // Schedule for 1 day before
      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(dueDate.getDate() - 1);
      oneDayBefore.setHours(9, 0, 0, 0); // 9 AM

      const notifications = [];

      // 1 Day Before Warning
      if (oneDayBefore.getTime() > now.getTime()) {
        notifications.push({
          title: 'Tagihan Segera Jatuh Tempo',
          body: `Tagihan ${bill.name} sebesar Rp${bill.amount.toLocaleString('id-ID')} harus dibayar besok!`,
          id: notificationId,
          schedule: { at: oneDayBefore },
          extra: { billId: bill.id, type: 'reminder' },
          smallIcon: 'ic_stat_notification', // Ensure this icon exists or remove if using default
        });
      }

      // On Due Date Warning
      const onDueDate = new Date(dueDate);
      onDueDate.setHours(9, 0, 0, 0); // 9 AM

      if (onDueDate.getTime() > now.getTime()) {
        notifications.push({
          title: 'Tagihan Jatuh Tempo Hari Ini',
          body: `Jangan lupa bayar tagihan ${bill.name} sebesar Rp${bill.amount.toLocaleString('id-ID')} hari ini.`,
          id: notificationId + 1, // Different ID
          schedule: { at: onDueDate },
          extra: { billId: bill.id, type: 'urgent' },
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  },

  async cancelBillNotifications(billId: string) {
    try {
      const notificationId = this.generateIdFromString(billId);
      // Cancel both possible notifications (1 day before and on day)
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }, { id: notificationId + 1 }] });
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Helper to generate a somewhat unique integer ID from a UUID string
  generateIdFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Ensure positive and fit in integer
    return Math.abs(hash) % 2147483647; // Max standard int size
  }
};
