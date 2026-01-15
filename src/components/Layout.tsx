import React, { useState, useRef, useEffect } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import OfflineIndicator from './common/OfflineIndicator';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import NotificationBell from './common/NotificationBell';
import { SettingsIcon } from './common/Icons';
// import VoiceInputModal from './VoiceInputModal';
// import { ParsedTransaction } from '../services/voiceParserService';
// import { TransactionType, Category } from '../services/types';

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
  const { notifications, markAsRead, markAllAsRead } = useData();
  // const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  /*
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
  */

  return (
    /* Premium Dark Mode Background - #0A0F1A */
    <div className="min-h-screen text-gray-900 dark:text-white bg-gray-50 dark:bg-[#0A0F1A] relative overflow-hidden">
      {/* Global Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
      </div>

      {/* Offline Status Indicator */}
      <div className="relative z-50">
        <OfflineIndicator />
      </div>

      {/* Desktop Sidebar */}
      <div className="relative z-40">
        <Sidebar isCollapsed={!isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-72' : 'md:ml-20'} relative z-30`}>
        {/* Premium Glass Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A0F1A]/80 backdrop-blur-xl border-b border-gray-200/30 dark:border-white/5 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
          <div className="px-4 md:px-6 h-[60px] flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Premium Mobile Logo */}
              <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-teal-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/40 border border-white/20">
                <span className="text-white font-bold text-base">💰</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/ai-chat"
                className="relative p-2 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
                title="AI Assistant"
              >
                <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              </Link>
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
        <main className="p-4 md:p-6 pb-32 md:pb-6 animate-fadeIn overflow-x-hidden relative z-10">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="relative z-50">
        <BottomNav />
      </div>

      {/* Voice Input Modal */}
      {/* Voice Input Modal Removed */}
    </div>
  );
};

export default Layout;