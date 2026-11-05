import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InteractiveMapPage } from './pages/InteractiveMapPage';
import { CitizenReportingPage } from './pages/CitizenReportingPage';
import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AIIntelligencePage } from './pages/AIIntelligencePage';
import { FloodAwareRoutingPage } from './pages/FloodAwareRoutingPage';
import { ResponderDashboardPage } from './pages/ResponderDashboardPage';
import { DemonstrationPage } from './pages/DemonstrationPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Authentication Routes (NO Application Sidebar) */}
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="auth/callback" element={<AuthCallbackPage />} />
          </Route>

          {/* Public Landing Page & Protected Application Routes */}
          <Route path="/" element={<Layout />}>
            {/* Public landing page */}
            <Route index element={<LandingPage />} />

            {/* Authenticated application routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="map" element={
              <ProtectedRoute>
                <InteractiveMapPage />
              </ProtectedRoute>
            } />
            <Route path="routes" element={
              <ProtectedRoute>
                <FloodAwareRoutingPage />
              </ProtectedRoute>
            } />
            <Route path="routing" element={
              <Navigate to="/routes" replace />
            } />
            <Route path="ai-intelligence" element={
              <ProtectedRoute>
                <AIIntelligencePage />
              </ProtectedRoute>
            } />
            <Route path="ai-engine" element={
              <Navigate to="/ai-intelligence" replace />
            } />
            <Route path="live-demo" element={
              <ProtectedRoute>
                <DemonstrationPage />
              </ProtectedRoute>
            } />
            <Route path="demo" element={
              <Navigate to="/live-demo" replace />
            } />
            <Route path="citizen-reports" element={
              <ProtectedRoute>
                <CitizenReportingPage />
              </ProtectedRoute>
            } />
            <Route path="report" element={
              <Navigate to="/citizen-reports" replace />
            } />
            <Route path="notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="incidents/:id" element={
              <ProtectedRoute>
                <IncidentDetailsPage />
              </ProtectedRoute>
            } />

            {/* Role-gated authenticated routes */}
            <Route path="responder" element={
              <ProtectedRoute allowedRoles={['responder', 'administrator']}>
                <ResponderDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
