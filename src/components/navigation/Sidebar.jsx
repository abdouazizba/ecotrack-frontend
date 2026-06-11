import React, { useState, useEffect } from 'react';
import {
  Package, AlertCircle, Menu, X,
  LogOut, Home, ChevronDown, Route, Users, Map, Cpu,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getSignalementsOuverts, getCapteurs } from '../../services/api';
import './Sidebar.css';

export default function Sidebar() {
  const [isOpen, setIsOpen]           = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [badges, setBadges]           = useState({ signals: 0, capteurs: 0 });
  const navigate  = useNavigate();
  const location  = useLocation();
  const { logout } = useAuthStore();

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [signalements, capteurs] = await Promise.all([
          getSignalementsOuverts().catch(() => []),
          getCapteurs().catch(() => []),
        ]);
        setBadges({
          signals: signalements.length,
          capteurs: capteurs.filter(c => c.batterie != null && c.batterie < 20).length,
        });
      } catch {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

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
        { icon: Route, label: 'Tournées', id: 'tournees', path: '/tournees' },
        {
          icon: AlertCircle,
          label: 'Signalements',
          id: 'signals',
          path: '/signalements',
          badge: badges.signals,
          submenu: [
            { label: 'Tous les signalements', path: '/signalements' },
            { label: 'Signalements Agents',   path: '/signalements/agents' },
            { label: 'Signalements Citoyens', path: '/signalements/citoyens' },
          ],
        },
        { icon: Cpu, label: 'Capteurs', id: 'capteurs', path: '/capteurs', badge: badges.capteurs },
      ],
    },
    {
      label: 'Administration',
      items: [
        { icon: Users, label: 'Utilisateurs', id: 'users', path: '/users' },
      ],
    },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleSubmenu = (id) =>
    setExpandedMenu((prev) => (prev === id ? null : id));

  const isItemActive = (item) =>
    location.pathname === item.path ||
    (item.submenu && item.submenu.some((s) => location.pathname === s.path));

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* ── Toggle ── */}
      <div className="sidebar-header">
        <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

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
                        {item.badge > 0 && (
                          <span className="menu-item-badge">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                        {item.submenu && (
                          <ChevronDown
                            size={14}
                            className={`submenu-chevron ${expanded ? 'rotated' : ''}`}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {item.submenu && isOpen && (
                    <div className={`submenu ${expanded ? 'expanded' : ''}`}>
                      <div className="submenu-inner">
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
