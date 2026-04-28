import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import './App.css';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Dashboard } from './components/Dashboard';
import { TransactionsList } from './components/TransactionsList';
import { Analytics } from './components/Analytics';
import { Navigation } from './components/Navigation';
import { ImportCSVModal } from './components/ImportCSVModal';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { UpdatePassword } from './components/UpdatePassword';
import { useAuth } from './context/AuthContext';
import { getDashboard } from './services/dashboard';
import { getDateRange } from './utils/dateRanges';
import { LogOut, User } from 'lucide-react';

// Map URL paths to tab IDs for Navigation active state
const pathToTab = (pathname) => {
  if (pathname.startsWith('/transactions')) return 'transactions';
  if (pathname.startsWith('/analytics')) return 'analytics';
  return 'dashboard';
};

// Dashboard page wrapper — fetches data and renders Dashboard
const DashboardPage = ({ timeRange, setTimeRange, onNavigate }) => {
  const { startDate, endDate } = useMemo(() => getDateRange(timeRange), [timeRange]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => getDashboard(startDate, endDate),
    refetchInterval: 30000,
  });

  if (isLoading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your financial data...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <p>Error loading data: {error.message}</p>
        <button onClick={() => refetch()} className="retry-btn">Retry</button>
      </div>
    );

  return (
    <Dashboard
      dashboardData={data}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      onNavigate={onNavigate}
    />
  );
};

// Authenticated App with Navigation + Routes
const AuthenticatedApp = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [timeRange, setTimeRange] = useState('this_month');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = pathToTab(location.pathname);

  const handleNavigation = (tab) => {
    const paths = { dashboard: '/', transactions: '/transactions', analytics: '/analytics' };
    navigate(paths[tab] || '/');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="app">
      <div className="app-container">
        <Navigation
          activeTab={activeTab}
          setActiveTab={handleNavigation}
          onImportClick={() => setShowImportModal(true)}
        >
          <div className="nav-user-section">
            <div className="nav-user-info">
              <User size={16} />
              <span className="nav-user-email">{user?.email}</span>
            </div>
            <button className="nav-logout-btn" onClick={handleSignOut}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </Navigation>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<DashboardPage timeRange={timeRange} setTimeRange={setTimeRange} onNavigate={handleNavigation} />} />
            <Route path="/transactions" element={<TransactionsList />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <ImportCSVModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      </div>
    </div>
  );
};

// Root App — shows auth or main app
const App = () => {
  const { session, loading, isRecovery } = useAuth();
  const [authView, setAuthView] = useState('login');

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show password update form when user clicks the recovery link
  if (isRecovery && session) {
    return <UpdatePassword />;
  }

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  );
};

export default App;
