import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
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
import { SettingsPage } from './pages/SettingsPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* OAuth Callback processing route */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route path="/" element={<Layout />}>
            {/* Public routes */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignUpPage />} />

            {/* Authenticated routes */}
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
            <Route path="routing" element={
              <ProtectedRoute>
                <FloodAwareRoutingPage />
              </ProtectedRoute>
            } />
            <Route path="report" element={
              <ProtectedRoute>
                <CitizenReportingPage />
              </ProtectedRoute>
            } />
            <Route path="ai-engine" element={
              <ProtectedRoute>
                <AIIntelligencePage />
              </ProtectedRoute>
            } />
            <Route path="demo" element={
              <ProtectedRoute>
                <DemonstrationPage />
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
