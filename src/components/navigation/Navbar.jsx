import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Bell, Search, User, ChevronDown, Battery, Trash2, AlertTriangle, Truck, CheckCheck, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import useNotifications from '../../hooks/useNotifications';
import LogoutModal from '../common/LogoutModal';
import './Navbar.css';

const NOTIF_ICON_MAP = { Battery, Trash2, AlertTriangle, Truck };

function notifRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

const WMO_ICON = (code) => {
  if (code === 0)                  return '☀️';
  if (code <= 3)                   return '⛅';
  if (code <= 48)                  return '🌫️';
  if (code <= 67 || (code >= 80 && code <= 82)) return '🌧️';
  if (code <= 77)                  return '❄️';
  return '⛈️';
};

function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const { latitude: lat, longitude: lon } = coords;
        const [meteo, geo] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`).then(r => r.json()),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).then(r => r.json()),
        ]);
        setWeather({
          temp: Math.round(meteo.current.temperature_2m),
          icon: WMO_ICON(meteo.current.weather_code),
          city: geo.address?.city || geo.address?.town || geo.address?.village || '',
        });
      } catch {}
    }, () => {});
  }, []);

  if (!weather) return null;

  return (
    <div className="weather-widget">
      <span className="weather-icon">{weather.icon}</span>
      <div className="weather-info">
        {weather.city && <span className="weather-city">{weather.city}</span>}
        <span className="weather-temp">{weather.temp}°C</span>
      </div>
    </div>
  );
}

export default function Navbar({ onLogout }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogout, setShowLogout]     = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogout(true);
  };

  const confirmLogout = () => {
    setShowLogout(false);
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
          <WeatherWidget />
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            style={{ position: 'relative' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* ── notification dropdown ── */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="icon-btn"
              onClick={() => setNotifOpen((o) => !o)}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={notifStyles.bellBadge}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={notifStyles.dropdown}>
                <div style={notifStyles.dropdownHeader}>
                  <span style={notifStyles.dropdownTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      style={notifStyles.markAllBtn}
                      onClick={() => { markAllAsRead(); }}
                    >
                      <CheckCheck size={14} />
                      Tout lu
                    </button>
                  )}
                </div>
                <div style={notifStyles.dropdownList}>
                  {notifications.length === 0 ? (
                    <div style={notifStyles.emptyState}>
                      <Bell size={24} color="#475569" />
                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
                        Aucune notification
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif) => {
                      const Icon = NOTIF_ICON_MAP[notif.icon] || Bell;
                      return (
                        <div
                          key={notif.id}
                          style={{
                            ...notifStyles.item,
                            ...(notif.read ? {} : notifStyles.itemUnread),
                          }}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div
                            style={{
                              ...notifStyles.itemIcon,
                              backgroundColor: `${notif.color}20`,
                            }}
                          >
                            <Icon size={14} color={notif.color} />
                          </div>
                          <div style={notifStyles.itemContent}>
                            <span style={notifStyles.itemTitle}>{notif.title}</span>
                            <span style={notifStyles.itemTime}>
                              {notifRelativeTime(notif.timestamp)}
                            </span>
                          </div>
                          {!notif.read && <div style={notifStyles.itemDot} />}
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={notifStyles.dropdownFooter}>
                  <button
                    style={notifStyles.viewAllBtn}
                    onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                  >
                    Voir tout
                  </button>
                </div>
              </div>
            )}
          </div>

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

      <LogoutModal
        isOpen={showLogout}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogout(false)}
      />
    </nav>
  );
}

const notifStyles = {
  bellBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '10px',
    minWidth: '16px',
    textAlign: 'center',
    lineHeight: '14px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '380px',
    background: '#1e2433',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  dropdownTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  markAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  dropdownList: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  itemUnread: {
    background: 'rgba(59,130,246,0.06)',
  },
  itemIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px',
    color: '#e2e8f0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    fontSize: '11px',
    color: '#64748b',
    flexShrink: 0,
    marginLeft: '8px',
  },
  itemDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  dropdownFooter: {
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center',
  },
  viewAllBtn: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '4px 8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 16px',
  },
};
