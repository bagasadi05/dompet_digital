import React, { useState, useEffect } from 'react';
import { networkService, NetworkStatus } from '../../services/networkService';

/**
 * OfflineIndicator Component
 * Shows a banner when the app is offline
 */
const OfflineIndicator: React.FC = () => {
    const [status, setStatus] = useState<NetworkStatus>(() =>
        networkService.getStatus()
    );
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        let wasOffline = status === 'offline';

        const unsubscribe = networkService.subscribe((newStatus) => {
            // Show "reconnected" message briefly when coming back online
            if (wasOffline && newStatus === 'online') {
                setShowReconnected(true);
                setTimeout(() => setShowReconnected(false), 3000);
            }

            wasOffline = newStatus === 'offline';
            setStatus(newStatus);
        });

        return unsubscribe;
    }, []);

    // Don't render anything if online and not showing reconnected message
    if (status === 'online' && !showReconnected) {
        return null;
    }

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-transform duration-300 ${status === 'offline'
                    ? 'bg-red-500 text-white'
                    : 'bg-green-500 text-white'
                }`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center justify-center gap-2">
                {status === 'offline' ? (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
                            />
                        </svg>
                        <span>Tidak ada koneksi internet</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span>Koneksi dipulihkan</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default OfflineIndicator;
