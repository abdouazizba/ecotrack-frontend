import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Route, Package, LogOut, Menu, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import LogoutModal from '../../components/common/LogoutModal';
import Navbar from '../../components/navigation/Navbar';
import '../../components/navigation/Sidebar.css';
import './AgentPortal.css';

const NAV_ITEMS = [
  { to: '/agent',            label: 'Tableau de bord', Icon: Home,    end: true },
  { to: '/agent/tournees',   label: 'Mes tournées',    Icon: Route },
  { to: '/agent/conteneurs', label: 'Conteneurs',      Icon: Package },
];

export default function AgentPortal() {
  const { logout } = useAuthStore();
  const navigate   = useNavigate();
  const [isOpen, setIsOpen]         = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  const confirmLogout = () => { setShowLogout(false); logout(); navigate('/login'); };

  return (
    <>
      <Navbar />
      <div className="dashboard-container agent-portal">
        <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
          <div className="sidebar-header">
            <button onClick={() => setIsOpen(!isOpen)} className="toggle-btn">
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className="sidebar-menu">
            <div className="menu-group">
              {isOpen && <span className="group-label">Agent</span>}
              {NAV_ITEMS.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                  title={!isOpen ? label : undefined}
                >
                  <Icon size={18} />
                  {isOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </nav>

          <button
            onClick={() => setShowLogout(true)}
            className="sidebar-logout"
            title="Déconnexion"
          >
            <LogOut size={18} />
            {isOpen && <span>Déconnexion</span>}
          </button>

          <LogoutModal
            isOpen={showLogout}
            onConfirm={confirmLogout}
            onCancel={() => setShowLogout(false)}
          />
        </div>

        <main className="dashboard-main">
          <div style={{ minHeight: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
