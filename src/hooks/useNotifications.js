import { useState, useEffect, useCallback, useRef } from 'react';
import { getCapteurs, getContainers, getSignalements, getTournees } from '../services/api';

const STORAGE_KEY = 'ecotrack-notifications-read';
const POLL_INTERVAL = 120000; // 2 minutes

function getReadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveReadIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isWithin24h(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return now - d < 24 * 60 * 60 * 1000;
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setReadIds] = useState(getReadIds);
  const intervalRef = useRef(null);

  const buildNotifications = useCallback(async () => {
    const results = [];

    try {
      const [capteurs, containers, signalements, tournees] = await Promise.allSettled([
        getCapteurs(),
        getContainers(),
        getSignalements(),
        getTournees(),
      ]);

      // Battery low sensors
      if (capteurs.status === 'fulfilled' && Array.isArray(capteurs.value)) {
        capteurs.value.forEach((c) => {
          if (c.batterie != null && c.batterie < 20) {
            results.push({
              id: `battery-${c.id}`,
              type: 'battery',
              title: 'Batterie faible',
              message: `Le capteur ${c.code_capteur || c.id?.slice(0, 8)} est a ${c.batterie}% de batterie`,
              timestamp: c.created_at || new Date().toISOString(),
              read: false,
              icon: 'Battery',
              color: '#f59e0b',
            });
          }
        });
      }

      // Critical fill containers
      if (containers.status === 'fulfilled' && Array.isArray(containers.value)) {
        containers.value.forEach((c) => {
          if (c.fillLevel != null && c.fillLevel > 80) {
            results.push({
              id: `critical_fill-${c.id}`,
              type: 'critical_fill',
              title: 'Conteneur presque plein',
              message: `${c.name || c.code_conteneur || 'Conteneur'} est rempli a ${Math.round(c.fillLevel)}%`,
              timestamp: c.created_at || new Date().toISOString(),
              read: false,
              icon: 'Trash2',
              color: '#ef4444',
            });
          }
        });
      }

      // New signalements (pending, created in last 24h)
      if (signalements.status === 'fulfilled' && Array.isArray(signalements.value)) {
        signalements.value.forEach((s) => {
          if (s.status === 'pending' && isWithin24h(s.created_at)) {
            results.push({
              id: `new_signal-${s.id}`,
              type: 'new_signal',
              title: 'Nouveau signalement',
              message: s.titre || s.description?.slice(0, 80) || 'Un signalement est en attente',
              timestamp: s.created_at || new Date().toISOString(),
              read: false,
              icon: 'AlertTriangle',
              color: '#f97316',
            });
          }
        });
      }

      // Tournee updates (in_progress or done today)
      if (tournees.status === 'fulfilled' && Array.isArray(tournees.value)) {
        tournees.value.forEach((t) => {
          if (
            (t.status === 'in_progress' || t.status === 'done') &&
            isToday(t.date_prevue || t.created_at)
          ) {
            const statusLabel = t.status === 'in_progress' ? 'en cours' : 'terminee';
            results.push({
              id: `tournee_update-${t.id}`,
              type: 'tournee_update',
              title: 'Mise a jour tournee',
              message: `${t.titre || t.code || 'Tournee'} est ${statusLabel}`,
              timestamp: t.date_prevue || t.created_at || new Date().toISOString(),
              read: false,
              icon: 'Truck',
              color: t.status === 'done' ? '#10b981' : '#3b82f6',
            });
          }
        });
      }
    } catch (err) {
      console.error('Error building notifications:', err);
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return results;
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notifs = await buildNotifications();
      const currentReadIds = getReadIds();
      setReadIds(currentReadIds);
      setNotifications(
        notifs.map((n) => ({
          ...n,
          read: currentReadIds.includes(n.id),
        }))
      );
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [buildNotifications]);

  useEffect(() => {
    const initialDelay = setTimeout(() => {
      fetchNotifications();
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    }, 5000);
    return () => {
      clearTimeout(initialDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback((id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveReadIds(next);
      return next;
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const allIds = prev.map((n) => n.id);
      setReadIds((prevIds) => {
        const merged = [...new Set([...prevIds, ...allIds])];
        saveReadIds(merged);
        return merged;
      });
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markAsRead, markAllAsRead, loading };
}
