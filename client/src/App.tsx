import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Kanban = React.lazy(() => import('./components/Kanban'));
const VacanteForm = React.lazy(() => import('./components/VacanteForm'));
const DataView = React.lazy(() => import('./components/DataView'));
const VacantesList = React.lazy(() => import('./components/VacantesList'));
const VacanteDetail = React.lazy(() => import('./components/v3/VacanteDetail'));
const CandidatosList = React.lazy(() => import('./components/CandidatosList'));
const CandidatoForm = React.lazy(() => import('./components/CandidatoForm'));
const EmpresaSedeConfig = React.lazy(() => import('./components/EmpresaSedeConfig'));
const RecruiterAnalytics = React.lazy(() => import('./components/RecruiterAnalytics'));
const AIInsightsHub = React.lazy(() => import('./components/v3/ai/AIInsightsHub'));
const ReferralPortal = React.lazy(() => import('./components/v3/referidos/ReferralPortal'));
const AISourcingHub = React.lazy(() => import('./components/v3/sourcing/AISourcingHub'));
const UserManagement = React.lazy(() => import('./components/UserManagement'));
const Evaluations = React.lazy(() => import('./components/Evaluations'));
const SuperAdminPanel = React.lazy(() => import('./components/SuperAdminPanel'));
const AdminCandidatos = React.lazy(() => import('./components/AdminCandidatos'));

import './chartConfig';

import LoginPage from './components/auth/LoginPage';
import { ToastProvider } from './components/ToastNotification';
import { AuthProvider, useAuth } from './context/AuthProvider';
import PublicApplyPage from './components/public/PublicApplyPage';
import CandidateTrackingPage from './components/public/CandidateTrackingPage';

import { ThemeProvider } from './context/ThemeContext';
import { ConfirmProvider } from './components/ui/ConfirmModal';
import WorkplaceAssistant from './components/WorkplaceAssistant';


// Page Loader for lazy components
const PageLoader = () => (
  <div className="min-h-[50vh] w-full flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-main)' }}>
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* PUBLIC — Portal de postulación (sin autenticación) */}
      <Route path="/aplicar/:vacanteId" element={<PublicApplyPage />} />
      <Route path="/track/:token" element={<CandidateTrackingPage />} />

      {/* Redirect root to dashboard (admin panel) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Admin Panel Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/vacantes" element={<VacantesList />} />
                <Route path="/vacantes/:id" element={<VacanteDetail />} />
                <Route path="/candidatos" element={<CandidatosList />} />
                <Route path="/admin/candidatos" element={<AdminCandidatos />} />
                <Route path="/data" element={<DataView />} />
                <Route path="/agents" element={<AIInsightsHub />} />
                <Route path="/referidos" element={<ReferralPortal />} />
                <Route path="/sourcing" element={<AISourcingHub />} />
                <Route path="/create-vacante" element={<VacanteForm />} />
                <Route path="/edit-vacante/:id" element={<VacanteForm />} />
                <Route path="/create-candidato" element={<CandidatoForm />} />
                <Route path="/edit-candidato/:id" element={<CandidatoForm />} />
                <Route path="/configuracion" element={<EmpresaSedeConfig />} />
                <Route path="/analytics" element={<RecruiterAnalytics />} />
                <Route path="/usuarios" element={<UserManagement />} />
                <Route path="/evaluations" element={<Evaluations />} />
                <Route path="/sistema" element={<SuperAdminPanel />} />

                {/* Fallback redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </React.Suspense>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Router>
              <ToastProvider>
                <AppRoutes />
                <WorkplaceAssistant />
              </ToastProvider>
            </Router>
          </AuthProvider>
        </ConfirmProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
