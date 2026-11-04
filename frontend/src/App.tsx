import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
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
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="map" element={<InteractiveMapPage />} />
            <Route path="routing" element={<FloodAwareRoutingPage />} />
            <Route path="report" element={<CitizenReportingPage />} />
            <Route path="ai-engine" element={<AIIntelligencePage />} />
            <Route path="demo" element={<DemonstrationPage />} />
            <Route path="responder" element={<ResponderDashboardPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="incidents/:id" element={<IncidentDetailsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
