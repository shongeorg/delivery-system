import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { OwnerGuard } from './components/OwnerGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StaffPage } from './pages/StaffPage';
import { StaffDetailPage } from './pages/StaffDetailPage';
import { PayrollPage } from './pages/PayrollPage';
import { FinancePage } from './pages/FinancePage';
import { KitchenPage } from './pages/KitchenPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <OwnerGuard>
                  <Layout />
                </OwnerGuard>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="staff/:id" element={<StaffDetailPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="finances" element={<FinancePage />} />
              <Route path="kitchen" element={<KitchenPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
