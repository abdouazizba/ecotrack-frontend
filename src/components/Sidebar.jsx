import React, { useState } from 'react';
import { BarChart3, Package, Truck, AlertCircle, Menu, X, LogOut, Home, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    { icon: Package, label: 'Conteneurs', id: 'containers', path: '/containers' },
    { icon: Truck, label: 'Zones', id: 'tours', path: '/zones' },
    { icon: AlertCircle, label: 'Signalements', id: 'signals', path: '/signalements' },
    { icon: BarChart3, label: 'Utilisateurs', id: 'analytics', path: '/users' },
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/Logo-Ecotrack.png" alt="EcoTrack Logo" className="logo-image" />
          {isOpen && <span className="logo-text">EcoBeast</span>}
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="toggle-btn"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* User Info */}
      {isOpen && (
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <p className="user-name">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.email?.split('@')[0] || 'Utilisateur'}
            </p>
            <p className="user-role">
              {user?.role === 'admin' ? '👑 Admin' : '👤 Agent'}
            </p>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="menu-item"
            title={item.label}
          >
            <item.icon size={20} />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Logout */}
      <button 
        onClick={handleLogout} 
        className="sidebar-logout"
        title="Déconnexion"
      >
        <LogOut size={20} />
        {isOpen && <span>Déconnexion</span>}
      </button>

      <style>{`
        .sidebar {
          position: fixed;
          left: 12px;
          top: 82px;
          bottom: 12px;
          height: calc(100vh - 106px);
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #fff;
          transition: width 0.3s ease;
          width: 280px;
          display: flex;
          flex-direction: column;
          border-right: 2px solid #22c55e;
          border-radius: 16px;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          overflow: hidden;
        }

        .sidebar.collapsed {
          width: 90px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #22c55e;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .logo-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .logo-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .logo-text {
          font-size: 18px;
          font-weight: bold;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .toggle-btn {
          background: transparent;
          border: none;
          color: #22c55e;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .toggle-btn:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
        }

        .sidebar-user {
          padding: 16px;
          border-bottom: 1px solid rgba(34, 197, 94, 0.2);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #1a1a1a;
          flex-shrink: 0;
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-email {
          font-size: 13px;
          margin: 0;
          color: #fff;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-role {
          font-size: 12px;
          margin: 4px 0 0 0;
          color: #22c55e;
          opacity: 0.8;
        }

        .user-name {
          font-size: 13px;
          margin: 0;
          color: #fff;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sidebar-menu {
          flex: 1;
          padding: 12px 8px;
          overflow-y: auto;
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          border-radius: 10px;
          transition: all 0.2s ease;
          cursor: pointer;
          border-left: 3px solid transparent;
          background: transparent;
          border: none;
          width: calc(100% - 32px);
          font-family: inherit;
          font-size: inherit;
          text-align: left;
        }

        .menu-item:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-left-color: #22c55e;
          padding-left: 14px;
        }

        .menu-item span {
          font-size: 14px;
          font-weight: 500;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(34, 197, 94, 0.2);
          margin: 12px 0;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          gap: 12px;
          width: calc(100% - 16px);
          padding: 12px 16px;
          margin: 0 8px 16px 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-family: inherit;
          font-size: inherit;
        }

        .sidebar-logout:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        .sidebar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar::-webkit-scrollbar-track {
          background: rgba(34, 197, 94, 0.05);
        }

        .sidebar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 3px;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }

          .sidebar.open {
            width: 250px;
          }
        }
      `}</style>
    </div>
  );
}
