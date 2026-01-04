import React from 'react';

interface EmptyStateProps {
  type: 'transactions' | 'goals' | 'notifications' | 'bills' | 'general';
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
  className?: string;
}

/**
 * EmptyState Component
 * 
 * Provides contextual empty state messages with optional call-to-action buttons
 * Implements Requirements 12.1, 12.2, 12.4, 12.5 from dashboard-redesign spec
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionButton,
  illustration,
  className = ''
}) => {
  // Default illustrations for different types
  const getDefaultIllustration = () => {
    switch (type) {
      case 'transactions':
        return '💳';
      case 'goals':
        return '🎯';
      case 'notifications':
        return '🔔';
      case 'bills':
        return '📅';
      default:
        return '📋';
    }
  };

  const displayIllustration = illustration || getDefaultIllustration();

  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}>
      {/* Illustration */}
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 text-2xl">
        {displayIllustration}
      </div>
      
      {/* Title */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
        {title}
      </h4>
      
      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed mb-4">
        {description}
      </p>
      
      {/* Action Button */}
      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-all active:scale-95 shadow-lg shadow-primary/25"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const TransactionsEmptyState: React.FC<{ onAddTransaction: () => void }> = ({ onAddTransaction }) => (
  <EmptyState
    type="transactions"
    title="Belum Ada Transaksi"
    description="Mulai catat pemasukan dan pengeluaran Anda untuk melacak keuangan dengan lebih baik"
    actionButton={{
      label: "Tambah Transaksi",
      onClick: onAddTransaction
    }}
  />
);

export const GoalsEmptyState: React.FC<{ onCreateGoal: () => void }> = ({ onCreateGoal }) => (
  <EmptyState
    type="goals"
    title="Belum Ada Target Impian"
    description="Buat target tabungan untuk mencapai impian Anda dengan lebih terarah dan termotivasi"
    actionButton={{
      label: "Buat Target",
      onClick: onCreateGoal
    }}
  />
);

export const BillsEmptyState: React.FC<{ onAddBill: () => void }> = ({ onAddBill }) => (
  <EmptyState
    type="bills"
    title="Tidak Ada Tagihan"
    description="Tambahkan tagihan rutin untuk mendapat pengingat dan kelola keuangan lebih teratur"
    actionButton={{
      label: "Tambah Tagihan",
      onClick: onAddBill
    }}
  />
);

export const NotificationsEmptyState: React.FC = () => (
  <EmptyState
    type="notifications"
    title="Tidak Ada Notifikasi"
    description="Semua notifikasi akan muncul di sini. Anda akan mendapat pemberitahuan untuk tagihan dan pencapaian target"
  />
);

export default EmptyState;