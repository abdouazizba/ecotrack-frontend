import React from 'react';
import { LogOut, Settings, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Navbar({ onLogout }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onLogout?.();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span>♻️</span>
          </div>
          <div className="navbar-title">
            <h1>EcoTrack Dashboard</h1>
            <p>Gestion Intelligente des Déchets</p>
          </div>
        </div>

        <div className="navbar-center">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Chercher..."
            />
          </div>
        </div>

        <div className="navbar-right">
          <button className="icon-btn">
            <Bell size={18} />
          </button>

          <button className="icon-btn">
            <Settings size={18} />
          </button>

          <div className="user-section">
            <div className="user-avatar">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <p className="user-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="user-role">
                {user?.role === 'admin' ? '👑 Admin' : '👤 Agent'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="icon-btn logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
