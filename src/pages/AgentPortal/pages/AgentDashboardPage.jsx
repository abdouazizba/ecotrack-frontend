import React, { useEffect, useState } from 'react';
import { Route, Map, AlertCircle, Package } from 'lucide-react';
import { getTourneesByAgent, getAgentZone, getSignalements } from '../../../services/api';
import useAuthStore from '../../../store/authStore';

export default function AgentDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ tournees: 0, zone: null, signalements: 0, containers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const [tournees, zone, signalements] = await Promise.all([
          getTourneesByAgent(user.id).catch(() => []),
          getAgentZone(user.id).catch(() => null),
          getSignalements({ limit: 10000 }).catch(() => []),
        ]);
        const openCount = signalements.filter(
          (s) => s.status === 'pending' || s.status === 'in_progress'
        ).length;
        setStats({
          tournees: tournees.length,
          zone,
          signalements: openCount,
          containers: zone?.conteneurs?.length ?? 0,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const cards = [
    { icon: Route,        label: 'Mes tournées',         value: stats.tournees,     color: '#3b82f6' },
    { icon: Map,          label: 'Zone assignée',         value: stats.zone?.nom ?? '—', color: '#10b981', isText: true },
    { icon: AlertCircle,  label: 'Signalements ouverts', value: stats.signalements, color: '#f59e0b' },
    { icon: Package,      label: 'Containers à vérifier',value: stats.containers,   color: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        Bonjour, {user?.firstName || 'Agent'} 👋
      </h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Voici un résumé de votre activité.</p>

      {loading ? (
        <p style={{ color: '#64748b' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {cards.map(({ icon: Icon, label, value, color, isText }) => (
            <div
              key={label}
              style={{
                background: '#1e2433',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} />
              </div>
              <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0 }}>{label}</p>
              <p style={{ color: '#e2e8f0', fontSize: isText ? '0.95rem' : '1.6rem', fontWeight: 700, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
