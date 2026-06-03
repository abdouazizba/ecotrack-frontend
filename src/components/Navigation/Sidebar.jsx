import React, { useState } from 'react';
import {
  BarChart3, Package, Truck, AlertCircle, Menu, X,
  LogOut, Home, ChevronDown, Route, Users, Map, Cpu,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import './Sidebar.css';

// ── Menu structure grouped by category ───────────────────────────
const MENU_GROUPS = [
  {
    label: 'Général',
    items: [
      { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { icon: Package, label: 'Conteneurs', id: 'containers', path: '/containers' },
      { icon: Map,     label: 'Zones',      id: 'zones',       path: '/zones' },
    ],
  },
  {
    label: 'Logistique',
    items: [
      {
        icon: Route,
        label: 'Tournées',
        id: 'tournees',
        path: '/tournees',
      },
      {
        icon: AlertCircle,
        label: 'Signalements',
        id: 'signals',
        path: '/signalements',
        submenu: [
          { label: 'Tous les signalements', path: '/signalements' },
          { label: 'Signalements Agents',   path: '/signalements/agents' },
          { label: 'Signalements Citoyens', path: '/signalements/citoyens' },
        ],
      },
      { icon: Cpu, label: 'Capteurs', id: 'capteurs', path: '/capteurs' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { icon: Users, label: 'Utilisateurs', id: 'users', path: '/users' },
    ],
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen]           = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleSubmenu = (id) =>
    setExpandedMenu((prev) => (prev === id ? null : id));

  const isItemActive = (item) =>
    location.pathname === item.path ||
    (item.submenu && item.submenu.some((s) => location.pathname === s.path));

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* ── Logo ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/Logo-Ecotrack.png" alt="EcoBeast" className="logo-image" />
          {isOpen && <span className="logo-text">EcoBeast</span>}
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── User chip ── */}
      {isOpen && (
        <div className="sidebar-user">
          <div className="user-chip">
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="user-meta">
            <p className="user-name">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email?.split('@')[0] || 'Utilisateur'}
            </p>
            <p className="user-role">{user?.role === 'admin' ? 'Admin' : 'Agent'}</p>
          </div>
        </div>
      )}

      {/* ── Menu ── */}
      <nav className="sidebar-menu">
        {MENU_GROUPS.map((group) => (
          <div key={group.label} className="menu-group">
            {isOpen && <span className="group-label">{group.label}</span>}

            {group.items.map((item) => {
              const active   = isItemActive(item);
              const expanded = expandedMenu === item.id;
              const Icon     = item.icon;

              return (
                <div key={item.id} className="menu-item-wrapper">
                  <button
                    onClick={() => item.submenu ? toggleSubmenu(item.id) : navigate(item.path)}
                    className={`menu-item ${active ? 'active' : ''}`}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon size={18} />
                    {isOpen && (
                      <>
                        <span>{item.label}</span>
                        {item.submenu && (
                          <ChevronDown
                            size={14}
                            style={{
                              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                              transition: 'transform 0.25s',
                              marginLeft: 'auto',
                              opacity: 0.6,
                            }}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {item.submenu && isOpen && expanded && (
                    <div className="submenu">
                      {item.submenu.map((sub) => (
                        <button
                          key={sub.path}
                          onClick={() => navigate(sub.path)}
                          className={`submenu-item ${location.pathname === sub.path ? 'active' : ''}`}
                        >
                          <div className="submenu-dot" />
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Logout ── */}
      <button onClick={handleLogout} className="sidebar-logout" title="Déconnexion">
        <LogOut size={18} />
        {isOpen && <span>Déconnexion</span>}
      </button>

    </div>
  );
}
