import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { AppShell } from './components/layout/AppShell';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewInspection } from './pages/NewInspection';
import { AnalysisOcr } from './pages/AnalysisOcr';
import { EvidenceViewer } from './pages/EvidenceViewer';
import { OfficerReview } from './pages/OfficerReview';
import { FinalizeInspection } from './pages/FinalizeInspection';
import { ReportDetails } from './pages/ReportDetails';
import { ProductRepository } from './pages/ProductRepository';
import { ProductDetail } from './pages/ProductDetail';
import { EnforcementDashboard } from './pages/EnforcementDashboard';
import { RulesLibrary } from './pages/RulesLibrary';
import { AuditLogs } from './pages/AuditLogs';
import { EmaapAdapter } from './pages/EmaapAdapter';
import { SystemHealthPage } from './pages/SystemHealthPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              {/* Authenticated App Shell */}
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inspections" element={<Dashboard />} />
                <Route path="/inspections/new" element={<NewInspection />} />
                <Route path="/inspections/:id" element={<AnalysisOcr />} />
                <Route path="/inspections/:id/ocr" element={<AnalysisOcr />} />
                <Route path="/inspections/:id/compliance" element={<AnalysisOcr />} />
                <Route path="/inspections/:id/evidence" element={<EvidenceViewer />} />
                <Route path="/inspections/:id/review" element={<OfficerReview />} />
                <Route path="/inspections/:id/finalize" element={<FinalizeInspection />} />
                <Route path="/reports" element={<ReportDetails />} />
                <Route path="/reports/:id" element={<ReportDetails />} />
                <Route path="/products" element={<ProductRepository />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/enforcement" element={<EnforcementDashboard />} />
                <Route path="/rules" element={<RulesLibrary />} />
                <Route path="/rules/:id" element={<RulesLibrary />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/integrations/emaap" element={<EmaapAdapter />} />
                <Route path="/system-health" element={<SystemHealthPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
