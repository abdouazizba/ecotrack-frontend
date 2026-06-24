import React, { useState } from 'react';
import { Bell, Battery, Trash2, AlertTriangle, Truck, CheckCheck } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';

const ICON_MAP = {
  Battery,
  Trash2,
  AlertTriangle,
  Truck,
};

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'critical', label: 'Critiques' },
  { key: 'signals', label: 'Signalements' },
  { key: 'tournees', label: 'Tournees' },
];

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function filterNotifications(notifications, filter) {
  switch (filter) {
    case 'unread':
      return notifications.filter((n) => !n.read);
    case 'critical':
      return notifications.filter((n) => n.type === 'critical_fill' || n.type === 'battery');
    case 'signals':
      return notifications.filter((n) => n.type === 'new_signal');
    case 'tournees':
      return notifications.filter((n) => n.type === 'tournee_update');
    default:
      return notifications;
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = filterNotifications(notifications, activeFilter);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Bell size={24} color="#3b82f6" />
          <h1 style={styles.title}>Notifications</h1>
          {unreadCount > 0 && (
            <span style={styles.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button style={styles.markAllBtn} onClick={markAllAsRead}>
            <CheckCheck size={16} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            style={{
              ...styles.filterBtn,
              ...(activeFilter === f.key ? styles.filterBtnActive : {}),
            }}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Bell size={48} color="#475569" />
          <p style={styles.emptyTitle}>Aucune notification</p>
          <p style={styles.emptyText}>
            {activeFilter === 'all'
              ? "Vous n'avez aucune notification pour le moment."
              : 'Aucune notification dans cette categorie.'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map((notif) => {
            const IconComponent = ICON_MAP[notif.icon] || Bell;
            return (
              <div
                key={notif.id}
                style={{
                  ...styles.card,
                  ...(notif.read ? {} : styles.cardUnread),
                }}
              >
                {/* Unread dot */}
                {!notif.read && <div style={styles.unreadDot} />}

                {/* Icon */}
                <div
                  style={{
                    ...styles.iconWrap,
                    backgroundColor: `${notif.color}20`,
                  }}
                >
                  <IconComponent size={20} color={notif.color} />
                </div>

                {/* Content */}
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>{notif.title}</span>
                    <span style={styles.cardTime}>{relativeTime(notif.timestamp)}</span>
                  </div>
                  <p style={styles.cardMessage}>{notif.message}</p>
                </div>

                {/* Action */}
                {!notif.read && (
                  <button
                    style={styles.readBtn}
                    onClick={() => markAsRead(notif.id)}
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#e2e8f0',
    margin: 0,
  },
  badge: {
    background: '#ef4444',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
    minWidth: '20px',
    textAlign: 'center',
  },
  markAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#3b82f6',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background 0.2s',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    padding: '6px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: '#3b82f6',
    color: '#fff',
    borderColor: '#3b82f6',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    background: '#1e2433',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    position: 'relative',
    transition: 'background 0.2s',
  },
  cardUnread: {
    background: '#1e2a3d',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  unreadDot: {
    position: 'absolute',
    left: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#3b82f6',
  },
  iconWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  cardTime: {
    fontSize: '12px',
    color: '#64748b',
    flexShrink: 0,
  },
  cardMessage: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  readBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#64748b',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'color 0.2s',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#e2e8f0',
    marginTop: '16px',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
};
