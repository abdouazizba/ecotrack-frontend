import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, Search, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Navbar.css';

export default function Navbar({ onLogout }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
    onLogout?.();
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const initials =
    user?.firstName && user?.lastName
      ? (user.firstName[0] + user.lastName[0]).toUpperCase()
      : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split('@')[0] || 'User';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <img src="/Logo-Ecotrack.png" alt="EcoBeast" className="navbar-logo-img" />
          <div className="navbar-title">
            <h1>EcoBeast</h1>
            <p>Gestion Intelligente des Déchets</p>
          </div>
        </div>

        <div className="navbar-center">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Chercher..." />
          </div>
        </div>

        <div className="navbar-right">
          <button className="icon-btn"><Bell size={18} /></button>

          {/* ── user dropdown ── */}
          <div className="user-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="user-dropdown-trigger"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <p className="user-name">{displayName}</p>
                <p className="user-role">
                  {{ admin: 'Admin', super_admin: 'Super Admin', agent: 'Agent', citoyen: 'Citoyen' }[user?.role] || user?.role || '—'}
                </p>
              </div>
              <ChevronDown
                size={14}
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: '#94a3b8',
                  flexShrink: 0,
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="udm-header">
                  <div className="udm-avatar">{initials}</div>
                  <div className="udm-header-text">
                    <p className="udm-name">{displayName}</p>
                    <p className="udm-email">{user?.email}</p>
                  </div>
                </div>
                <div className="udm-divider" />
                <button className="udm-item" onClick={handleProfile}>
                  <User size={15} />
                  Mon Profil
                </button>
                <div className="udm-divider" />
                <button className="udm-item udm-item--danger" onClick={handleLogout}>
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </nav>
  );
}
