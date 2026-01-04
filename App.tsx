import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import DashboardSkeleton from './components/Skeletons/DashboardSkeleton';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const TransactionsPage = lazy(() => import('./components/TransactionsPage'));
const PlanningPage = lazy(() => import('./components/PlanningPage'));
const ReportsPage = lazy(() => import('./components/ReportsPage'));
const AIChatPage = lazy(() => import('./components/AIChatPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));

// Fallback component for lazy loading
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-gray-500 font-medium">Memuat halaman...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [theme, toggleTheme] = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();

  // Auth loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">Memuat Dompet Digital...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <Layout theme={theme} toggleTheme={toggleTheme}>
          {dataLoading ? (
            <DashboardSkeleton />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/planning" element={<PlanningPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          )}
        </Layout>
      ) : (
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      )}
    </Router>
  );
};

export default App;