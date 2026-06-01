import React, { useState } from 'react';
import { BarChart3, Package, Truck, AlertCircle, Menu, X, LogOut, Home, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
    { icon: Package, label: 'Conteneurs', id: 'containers', path: '/containers' },
    { icon: Truck, label: 'Zones', id: 'tours', path: '/zones' },
    { 
      icon: AlertCircle, 
      label: 'Signalements', 
      id: 'signals', 
      path: '/signalements',
      submenu: [
        { label: 'Tous les signalements', path: '/signalements' },
        { label: 'Signalements Agents', path: '/signalements/agents' },
        { label: 'Signalements Citoyens', path: '/signalements/citoyens' },
      ]
    },
    { icon: BarChart3, label: 'Utilisateurs', id: 'analytics', path: '/users' },
  ];

  const toggleSubmenu = (id) => {
    setExpandedMenu(expandedMenu === id ? null : id);
  };

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
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
          const isExpanded = expandedMenu === item.id;

          return (
            <div key={item.id} className="menu-item-wrapper">
              <button
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.id);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`menu-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <item.icon size={20} />
                {isOpen && (
                  <>
                    <span>{item.label}</span>
                    {item.submenu && (
                      <ChevronDown 
                        size={16} 
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                          marginLeft: 'auto'
                        }}
                      />
                    )}
                  </>
                )}
              </button>

              {/* Submenu */}
              {item.submenu && isOpen && isExpanded && (
                <div className="submenu">
                  {item.submenu.map((subitem) => (
                    <button
                      key={subitem.path}
                      onClick={() => navigate(subitem.path)}
                      className={`submenu-item ${location.pathname === subitem.path ? 'active' : ''}`}
                    >
                      <div className="submenu-dot"></div>
                      <span>{subitem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #fff;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 280px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(34, 197, 94, 0.1);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .sidebar.collapsed {
          width: 100px;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(34, 197, 94, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-shrink: 0;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .logo-image {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .toggle-btn {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #10b981;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 10px;
          flex-shrink: 0;
        }

        .toggle-btn:hover {
          background: rgba(34, 197, 94, 0.25);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.4);
        }

        .sidebar-user {
          padding: 16px;
          border-bottom: 1px solid rgba(34, 197, 94, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          min-width: 0;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #ffffff;
          flex-shrink: 0;
          font-size: 14px;
        }

        .user-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .user-name {
          font-size: 13px;
          margin: 0;
          color: #f1f5f9;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-role {
          font-size: 11px;
          margin: 4px 0 0 0;
          color: #10b981;
          font-weight: 600;
          opacity: 0.9;
        }

        .sidebar-menu {
          flex: 1;
          padding: 12px 8px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .menu-item-wrapper {
          margin-bottom: 8px;
        }

        .menu-item {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          padding: 12px 16px;
          color: rgba(241, 245, 249, 0.6);
          text-decoration: none;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border: none;
          width: calc(100% - 16px);
          margin-left: 8px;
          margin-right: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          text-align: left;
          font-weight: 500;
          background: transparent;
        }

        .sidebar.collapsed .menu-item {
          justify-content: center;
          width: 56px;
          margin: 0 auto 8px auto;
          padding: 12px;
        }

        .menu-item:hover {
          background: rgba(34, 197, 94, 0.15);
          color: #10b981;
        }

        .menu-item.active {
          background: rgba(34, 197, 94, 0.25);
          color: #10b981;
          border-left: 3px solid #10b981;
          padding-left: 13px;
        }

        .menu-item span {
          font-size: 13px;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        /* SUBMENU */
        .submenu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 0;
          margin-top: 4px;
          margin-left: 12px;
          border-left: 2px solid rgba(34, 197, 94, 0.2);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .submenu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          color: rgba(241, 245, 249, 0.5);
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
          margin: 0 8px;
          width: calc(100% - 16px);
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .submenu-item:hover {
          background: rgba(34, 197, 94, 0.1);
          color: #10b981;
        }

        .submenu-item.active {
          background: rgba(34, 197, 94, 0.15);
          color: #10b981;
          font-weight: 600;
        }

        .submenu-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.4);
          flex-shrink: 0;
        }

        .submenu-item.active .submenu-dot {
          background: #10b981;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(34, 197, 94, 0.1);
          margin: 12px 0;
          flex-shrink: 0;
        }

        .sidebar-logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: calc(100% - 16px);
          padding: 12px 16px;
          margin: 0 8px 16px 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .sidebar.collapsed .sidebar-logout {
          width: 56px;
          padding: 12px;
          margin: 0 auto 16px auto;
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

          .submenu {
            margin-left: 0;
            border-left: none;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
