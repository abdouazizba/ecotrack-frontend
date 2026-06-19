import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Admin pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContainersPage from './pages/ManagementPages/ContainersPage';
import ZonesPage from './pages/ManagementPages/ZonesPage';
import UsersPage from './pages/ManagementPages/UsersPage';
import TourneesPage from './pages/ManagementPages/TourneesPage';
import SignalementsPage from './pages/ManagementPages/SignalementsPage';
import CapteurPage from './pages/ManagementPages/CapteurPage';
import CollecteursPage from './pages/ManagementPages/CollecteursPage/CollecteursPage';
import MesuresPage from './pages/ManagementPages/MesuresPage/MesuresPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/navigation/Sidebar';
import Navbar from './components/navigation/Navbar';

// Citizen portal
import CitoyenPortal from './pages/CitoyenPortal/CitoyenPortal';
import AccueilPage from './pages/CitoyenPortal/pages/AccueilPage';
import SignalerPage from './pages/CitoyenPortal/pages/SignalerPage';
import MesSignalementsPage from './pages/CitoyenPortal/pages/MesSignalementsPage';
import ProfilPage from './pages/CitoyenPortal/pages/ProfilPage';

// Agent portal
import AgentPortal, {
  AgentDashboardPage,
  MesTourneesPage,
  ConteneurPage,
} from './pages/AgentPortal';

import useAuthStore from './store/authStore';
import './App.css';

const ADMIN_ROLES  = ['admin', 'super_admin'];
const AGENT_ROLES  = ['agent'];
const CITOYEN_ROLES = ['citoyen'];

// ── Admin layout (Sidebar + Navbar) ──────────────────────────
function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      <Navbar />
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

// ── Agent layout ─────────────────────────────────────────────
function AgentLayout() {
  return (
    <ProtectedRoute allowedRoles={AGENT_ROLES}>
      <Outlet />
    </ProtectedRoute>
  );
}

// ── Citizen layout ────────────────────────────────────────────
function CitoyenLayout() {
  return (
    <ProtectedRoute allowedRoles={CITOYEN_ROLES}>
      <Outlet />
    </ProtectedRoute>
  );
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const defaultRedirect = !isAuthenticated
    ? '/login'
    : user?.role === 'citoyen'
    ? '/citoyen'
    : user?.role === 'agent'
    ? '/agent'
    : '/dashboard';

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Citizen portal ── */}
        <Route element={<CitoyenLayout />}>
          <Route element={<CitoyenPortal />}>
            <Route path="/citoyen" element={<AccueilPage />} />
            <Route path="/citoyen/signaler" element={<SignalerPage />} />
            <Route path="/citoyen/mes-signalements" element={<MesSignalementsPage />} />
            <Route path="/citoyen/profil" element={<ProfilPage />} />
          </Route>
        </Route>

        {/* ── Agent portal — AgentPortal is the layout with <Outlet /> ── */}
        <Route element={<AgentLayout />}>
          <Route element={<AgentPortal />}>
            <Route path="/agent" element={<AgentDashboardPage />} />
            <Route path="/agent/tournees" element={<MesTourneesPage />} />
            <Route path="/agent/conteneurs" element={<ConteneurPage />} />
          </Route>
        </Route>

        {/* ── Admin portal ── */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/tournees" element={<TourneesPage />} />
          <Route path="/signalements" element={<SignalementsPage />} />
          <Route path="/capteurs" element={<CapteurPage />} />
          <Route path="/collecteurs" element={<CollecteursPage />} />
          <Route path="/mesures" element={<MesuresPage />} />
          <Route path="/espace-citoyen" element={<Navigate to="/citoyen" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to={defaultRedirect} replace />} />
        <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
