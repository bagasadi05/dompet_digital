import React, { useState, useRef, useEffect } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import NotificationBell from './common/NotificationBell';
import { SettingsIcon } from './common/Icons';
import VoiceInputModal from './VoiceInputModal';
import { ParsedTransaction } from '../services/voiceParserService';
import { TransactionType, Category } from '../services/types';

// Icons
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
  </svg>
);

interface LayoutProps {
  theme: string;
  toggleTheme: () => void;
  children?: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/': 'Dasbor',
  '/transactions': 'Riwayat Transaksi',
  '/planning': 'Perencanaan Keuangan',
  '/reports': 'Laporan Keuangan',
  '/ai-chat': 'Asisten AI'
};

const UserMenu: React.FC<{ theme: string; toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-400 text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 overflow-hidden"
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{user.email?.charAt(0).toUpperCase()}</span>
        )}
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 z-20 overflow-hidden animate-scaleIn">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Login sebagai</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              Mode {theme === 'light' ? 'Gelap' : 'Terang'}
            </button>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
              Pengaturan
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ theme, toggleTheme, children }) => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dompet Digital';
  const { notifications, markAsRead, markAllAsRead, addTransaction } = useData();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const handleVoiceResult = async (result: ParsedTransaction) => {
    if (result.success && result.amount && result.description && result.type) {
      try {
        await addTransaction({
          type: result.type === 'pemasukan' ? TransactionType.INCOME : TransactionType.EXPENSE,
          amount: result.amount,
          category: (result.category as Category) || Category.LAINNYA,
          description: result.description,
          date: new Date().toISOString()
        });
        // Optional: Show success toast or notification? 
        // addTransaction usually handles data update.
      } catch (error) {
        console.error('Failed to add voice transaction', error);
      }
    }
  };

  return (
    /* Dark mode background updated to #0B1120 (Requirement 9.1) */
    <div className="min-h-screen text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0B1120]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800 transition-all duration-200">
          <div className="px-4 md:px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mobile Logo */}
              <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-sm">💰</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
              <UserMenu theme={theme} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-6 pb-28 md:pb-6 animate-fadeIn">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <BottomNav onScanClick={() => setIsVoiceModalOpen(true)} />

      {/* Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onResult={handleVoiceResult}
      />
    </div>
  );
};

export default Layout;