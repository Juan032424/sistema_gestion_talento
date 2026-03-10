import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Kanban from './components/Kanban';
import VacanteForm from './components/VacanteForm';
import DataView from './components/DataView';
import VacantesList from './components/VacantesList';
import VacanteDetail from './components/v3/VacanteDetail';
import CandidatosList from './components/CandidatosList';
import CandidatoForm from './components/CandidatoForm';
import EmpresaSedeConfig from './components/EmpresaSedeConfig';
import RecruiterAnalytics from './components/RecruiterAnalytics';
import ErrorBoundary from './components/ErrorBoundary';
import AIInsightsHub from './components/v3/ai/AIInsightsHub';
import ReferralPortal from './components/v3/referidos/ReferralPortal';
import AISourcingHub from './components/v3/sourcing/AISourcingHub';
import UserManagement from './components/UserManagement';
import Evaluations from './components/Evaluations';
import SuperAdminPanel from './components/SuperAdminPanel';

import './chartConfig';

import LoginPage from './components/auth/LoginPage';
import { ToastProvider } from './components/ToastNotification';
import { AuthProvider, useAuth } from './context/AuthProvider';
import PublicApplyPage from './components/public/PublicApplyPage';


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
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

      {/* Redirect root to dashboard (admin panel) */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Admin Panel Routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/vacantes" element={<VacantesList />} />
              <Route path="/vacantes/:id" element={<VacanteDetail />} />
              <Route path="/candidatos" element={<CandidatosList />} />
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
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
