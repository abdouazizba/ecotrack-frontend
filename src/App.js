import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ContainersPage from './pages/ManagementPages/ContainersPage';
import ZonesPage from './pages/ManagementPages/ZonesPage';
import UsersPage from './pages/ManagementPages/UsersPage';
import TourneesPage from './pages/ManagementPages/TourneesPage';
import SignalementsPage from './pages/ManagementPages/SignalementsPage';
import CapteurPage from './pages/ManagementPages/CapteurPage';
import SignalementsAgentsPage from './pages/ManagementPages/SignalementsPage/SignalementsAgentsPage';
import SignalementsCitoyensPage from './pages/ManagementPages/SignalementsPage/SignalementsCitoyensPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Sidebar from './components/navigation/Sidebar';
import Navbar from './components/navigation/Navbar';
import useAuthStore from './store/authStore';
import './App.css';

function ProtectedLayout() {
  return (
    <ProtectedRoute>
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

function App() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);


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
          <Route path="/tournees" element={<TourneesPage />} />
          <Route path="/signalements" element={<SignalementsPage />} />
          <Route path="/capteurs" element={<CapteurPage />} />
          <Route path="/signalements/agents" element={<SignalementsAgentsPage />} />
          <Route path="/signalements/citoyens" element={<SignalementsCitoyensPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
