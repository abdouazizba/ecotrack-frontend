import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, AlertCircle, List, User, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import LogoutModal from '../../components/common/LogoutModal';
import './CitoyenPortal.css';

const NAV_ITEMS = [
  { to: '/citoyen',                  label: 'Accueil',       Icon: Home,         end: true },
  { to: '/citoyen/signaler',         label: 'Signaler',      Icon: AlertCircle },
  { to: '/citoyen/mes-signalements', label: 'Mes rapports',  Icon: List },
  { to: '/citoyen/profil',           label: 'Profil',        Icon: User },
];

export default function CitoyenPortal() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const confirmLogout = () => { setShowLogout(false); logout(); navigate('/login'); };

  return (
    <div className="cp-root">
      {/* Ambient orbs */}
      <div className="cp-orbs">
        <div className="cp-orb cp-orb-1" />
        <div className="cp-orb cp-orb-2" />
        <div className="cp-orb cp-orb-3" />
      </div>

      {/* Header */}
      <header className="cp-header">
        <div className="cp-header-left">
          <img src="/Logo-Ecotrack.png" alt="EcoTrack" className="cp-header-logo" />
          <span className="cp-header-brand">Eco<span>Track</span></span>
        </div>
        <div className="cp-header-right">
          <span className="cp-header-greeting">
            Bonjour, {user?.firstName || 'Citoyen'} 👋
          </span>
          <NavLink to="/citoyen/profil" className="cp-header-avatar" title="Mon profil">
            {initials}
          </NavLink>
          <button className="cp-logout-btn" onClick={() => setShowLogout(true)}>
            <LogOut size={13} style={{ marginRight: 4 }} />
            Quitter
          </button>
        </div>
      </header>

      {/* Sidebar (desktop) */}
      <div className="cp-layout">
        <aside className="cp-sidebar">
          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `cp-side-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
          <button className="cp-side-item" onClick={() => setShowLogout(true)} style={{ marginTop: 'auto' }}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </aside>

        {/* Page content */}
        <main className="cp-content">
          <Outlet />
        </main>
      </div>

      <LogoutModal
        isOpen={showLogout}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogout(false)}
      />

      {/* Bottom nav (mobile) */}
      <nav className="cp-bottom-nav">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `cp-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
