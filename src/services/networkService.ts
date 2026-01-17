/**
 * Network Service
 * Provides network status detection, retry logic, and offline handling
 */

type NetworkStatus = 'online' | 'offline';
type NetworkStatusCallback = (status: NetworkStatus) => void;

class NetworkService {
    private status: NetworkStatus = 'online';
    private listeners: Set<NetworkStatusCallback> = new Set();
    private initialized = false;

    constructor() {
        this.initializeListeners();
    }

    private initializeListeners(): void {
        if (this.initialized || typeof window === 'undefined') return;

        this.status = navigator.onLine ? 'online' : 'offline';

        window.addEventListener('online', () => {
            this.status = 'online';
            this.notifyListeners();
        });

        window.addEventListener('offline', () => {
            this.status = 'offline';
            this.notifyListeners();
        });

        this.initialized = true;
    }

    private notifyListeners(): void {
        this.listeners.forEach(callback => callback(this.status));
    }

    /**
     * Subscribe to network status changes
     */
    subscribe(callback: NetworkStatusCallback): () => void {
        this.listeners.add(callback);
        // Immediately notify with current status
        callback(this.status);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Check if currently online
     */
    isOnline(): boolean {
        return this.status === 'online';
    }

    /**
     * Get current network status
     */
    getStatus(): NetworkStatus {
        return this.status;
    }

    /**
     * Execute an async function with retry logic
     * @param fn - Async function to execute
     * @param options - Retry options
     */
    async withRetry<T>(
        fn: () => Promise<T>,
        options: {
            maxRetries?: number;
            baseDelay?: number;
            maxDelay?: number;
            onRetry?: (attempt: number, error: Error) => void;
        } = {}
    ): Promise<T> {
        const {
            maxRetries = 3,
            baseDelay = 1000,
            maxDelay = 10000,
            onRetry
        } = options;

        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Check if offline before attempting
                if (!this.isOnline()) {
                    throw new Error('Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.');
                }

                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < maxRetries) {
                    // Calculate delay with exponential backoff
                    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

                    if (onRetry) {
                        onRetry(attempt + 1, lastError);
                    }

                    await this.sleep(delay);
                }
            }
        }

        throw lastError!;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const networkService = new NetworkService();

// Export types
export type { NetworkStatus, NetworkStatusCallback };
