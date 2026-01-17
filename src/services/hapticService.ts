/**
 * Haptic Feedback Service
 * Provides native haptic feedback for mobile UX
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticService {
    private isNative = false;

    constructor() {
        // Check if running in native environment
        this.checkPlatform();
    }

    private async checkPlatform(): Promise<void> {
        try {
            // Try to trigger a minimal haptic to check if available
            await Haptics.impact({ style: ImpactStyle.Light });
            this.isNative = true;
        } catch {
            // Not available (web environment)
            this.isNative = false;
        }
    }

    /**
     * Light impact for button taps
     */
    async lightImpact(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Medium impact for important actions
     */
    async mediumImpact(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Heavy impact for significant actions
     */
    async heavyImpact(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Success notification vibration
     */
    async success(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Warning notification vibration
     */
    async warning(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Warning });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Error notification vibration
     */
    async error(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch {
            // Silently fail on web
        }
    }

    /**
     * Selection changed feedback
     */
    async selectionChanged(): Promise<void> {
        if (!this.isNative) return;
        try {
            await Haptics.selectionChanged();
        } catch {
            // Silently fail on web
        }
    }
}

// Export singleton instance
export const hapticService = new HapticService();
