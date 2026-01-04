import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary Component
 * 
 * Provides graceful error handling with user-friendly error messages and retry functionality
 * Implements Requirements 12.3, 12.5, 12.6 from dashboard-redesign spec
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 * 
 * Provides a user-friendly error display with retry functionality
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg 
          className="w-8 h-8 text-red-600 dark:text-red-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" 
          />
        </svg>
      </div>
      
      {/* Error Title */}
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
        Oops! Terjadi Kesalahan
      </h3>
      
      {/* Error Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
        {getErrorMessage(error)}
      </p>
      
      {/* Development Error Details */}
      {isDevelopment && (
        <details className="mb-6 max-w-md">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Detail Error (Development)
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-left overflow-auto max-h-32">
            {error.stack}
          </pre>
        </details>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-all active:scale-95 shadow-lg shadow-primary/25"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Coba Lagi
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors border border-gray-200 dark:border-gray-700"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Muat Ulang Halaman
        </button>
      </div>
    </div>
  );
};

/**
 * Get user-friendly error message based on error type
 */
const getErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.';
  }
  
  if (message.includes('timeout')) {
    return 'Permintaan memakan waktu terlalu lama. Silakan coba lagi dalam beberapa saat.';
  }
  
  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.';
  }
  
  if (message.includes('forbidden') || message.includes('403')) {
    return 'Anda tidak memiliki izin untuk mengakses fitur ini.';
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return 'Data yang diminta tidak ditemukan. Halaman mungkin telah dipindahkan atau dihapus.';
  }
  
  if (message.includes('server') || message.includes('500')) {
    return 'Terjadi masalah pada server. Tim kami sedang menangani masalah ini.';
  }
  
  // Generic fallback message
  return 'Terjadi kesalahan yang tidak terduga. Silakan coba lagi atau hubungi dukungan jika masalah berlanjut.';
};

/**
 * Network Error Fallback Component
 * 
 * Specialized error component for network-related errors
 */
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      </svg>
    </div>
    
    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
      Koneksi Terputus
    </h3>
    
    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
      Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.
    </p>
    
    <button
      onClick={resetError}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-all active:scale-95 shadow-lg shadow-primary/25"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Coba Lagi
    </button>
  </div>
);

export default ErrorBoundary;