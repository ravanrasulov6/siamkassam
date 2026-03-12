import { lazy, Suspense } from 'react';
import './styles/index.css';
import './styles/components.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

/* Lazy Loaded Pages */
const WelcomePage = lazy(() => import('./pages/public/WelcomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const OnboardingFlow = lazy(() => import('./pages/onboarding/OnboardingFlow'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const POSPage = lazy(() => import('./pages/sales/POSPage'));
const CustomersPage = lazy(() => import('./pages/customers/CustomersPage'));
const DebtsPage = lazy(() => import('./pages/debts/DebtsPage'));
const ExpensesPage = lazy(() => import('./pages/dashboard/ExpensesPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const AIHubPage = lazy(() => import('./pages/ai/AIHubPage'));
const MessagesPage = lazy(() => import('./pages/messages/MessagesPage'));

const PageLoader = () => (
  <div className="loading-screen">
    <div className="spinner spinner-lg"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Onboarding (requires auth, but no business yet) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingFlow />
                  </ProtectedRoute>
                }
              />

              {/* Protected app routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><DashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><ProductsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><POSPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><CustomersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/debts"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><DebtsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><ExpensesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><ReportsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><SettingsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><AIHubPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute requireBusiness>
                    <AppLayout><MessagesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
