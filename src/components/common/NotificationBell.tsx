import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../../services/types';
import BellIcon from '../icons/BellIcon';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';
import TrophyIcon from '../icons/TrophyIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

interface NotificationBellProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

const NotificationIcon: React.FC<{ type: AppNotification['icon'], className?: string }> = ({ type, className = "h-6 w-6" }) => {
    switch (type) {
        case 'bill': return <BellIcon className={`${className} text-blue-500`} />;
        case 'budget': return <ExclamationTriangleIcon className={`${className} text-yellow-500`} />;
        case 'goal': return <TrophyIcon className={`${className} text-green-500`} />;
        default: return <BellIcon className={className} />;
    }
};

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: AppNotification) => {
        onMarkAsRead(notification.id);
        navigate(notification.linkTo);
        setIsOpen(false);
    };

    const handleMarkAll = () => {
        onMarkAllAsRead();
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-light-text dark:text-dark-text hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Buka notifikasi"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-light-card dark:ring-dark-card" />
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 md:w-96 rounded-lg shadow-lg bg-light-card dark:bg-dark-card ring-1 ring-black dark:ring-gray-700 ring-opacity-5 z-20 flex flex-col max-h-[70vh]">
                    <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-light-text dark:text-dark-text">Notifikasi</h3>
                        {notifications.length > 0 && unreadCount > 0 && (
                            <button onClick={handleMarkAll} className="text-xs text-primary dark:text-secondary-light hover:underline">
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {notifications.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                                {notifications.map(n => (
                                    <li key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 pt-1">
                                                <NotificationIcon type={n.icon} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm text-light-text dark:text-dark-text">{n.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
                                            </div>
                                            {!n.isRead && <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 px-4">
                                <CheckCircleIcon className="h-10 w-10 mx-auto text-gray-400" />
                                <p className="mt-3 font-semibold text-light-text dark:text-dark-text">Semuanya aman!</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi baru untuk Anda.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
