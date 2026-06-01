import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContainersPage from './pages/ManagementPages/ContainersPage';
import ZonesPage from './pages/ManagementPages/ZonesPage';
import UsersPage from './pages/ManagementPages/UsersPage';
import SignalementsPage from './pages/ManagementPages/SignalementsPage';
import SignalementsAgentsPage from './pages/ManagementPages/SignalementsPage/SignalementsAgentsPage';
import SignalementsCitoyensPage from './pages/ManagementPages/SignalementsPage/SignalementsCitoyensPage';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import useAuthStore from './store/authStore';
import './App.css';

// Layout que wraps le Sidebar + les routes protégées
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <Sidebar />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Vérifier la persistence du store au démarrage
    const storedUser = localStorage.getItem('auth-store');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.state?.user) {
          console.log('✓ User restored from storage:', parsed.state.user);
        }
      } catch (e) {
        console.error('Failed to restore auth state:', e);
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes avec Sidebar persistant */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/containers" element={<ContainersPage />} />
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/signalements" element={<SignalementsPage />} />
          <Route path="/signalements/agents" element={<SignalementsAgentsPage />} />
          <Route path="/signalements/citoyens" element={<SignalementsCitoyensPage />} />
        </Route>
        
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
