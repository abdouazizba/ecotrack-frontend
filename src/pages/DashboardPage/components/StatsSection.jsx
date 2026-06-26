import React, { useMemo } from 'react';
import EchartsStatCard from '../../../components/charts/EchartsStatCard';
import { Package, AlertTriangle, Truck, Users, TrendingUp, Zap } from 'lucide-react';

const sectionTitle = (icon, label) => (
  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 2px' }}>
    {icon}
    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)', marginLeft: 8 }} />
  </div>
);

const perfCard = (title, value, subtitle, color, emoji) => (
  <div className="perf-hero" style={{
    background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
    border: `1px solid ${color}25`,
    borderRadius: 16, padding: '20px 22px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 12, right: 16, fontSize: '2.2rem', opacity: 0.15 }}>{emoji}</div>
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
    <span style={{ fontSize: '2.8rem', fontWeight: 800, color, lineHeight: 1.1, margin: '8px 0' }}>{value}</span>
    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</span>
  </div>
);

export default function StatsSection({ containers, signalements, zones, agents, tournees = [], criticalContainers = [], dashboardStats = {}, loading }) {
  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalContainers = dashboardStats.containers ?? containers.length;
    const avgFillRate = dashboardStats.averageFillRate != null
      ? Math.round(dashboardStats.averageFillRate)
      : (() => {
          const valid = containers.filter((c) => c.fillLevel != null);
          return valid.length ? Math.round(valid.reduce((s, c) => s + (c.fillLevel || 0), 0) / valid.length) : 0;
        })();
    const criticalCount = dashboardStats.criticalContainers
      ?? containers.filter((c) => (c.fillLevel || 0) > 80).length;
    const needsServiceCount = criticalContainers.length;

    const pendingSig = signalements.filter((s) => s.status === 'pending').length;
    const closedSig = signalements.filter((s) => s.status === 'closed').length;
    const totalSig = signalements.length;
    const tauxResolution = totalSig > 0 ? Math.round((closedSig / totalSig) * 100) : 0;

    const resolved = signalements.filter((s) => s.status === 'closed' && s.date_resolution && s.created_at);
    let avgResolutionH = 0;
    if (resolved.length > 0) {
      const totalH = resolved.reduce((sum, s) => sum + (new Date(s.date_resolution) - new Date(s.created_at)), 0);
      avgResolutionH = Math.round(totalH / resolved.length / 3600000);
    }

    const cutoff48h = new Date(now.getTime() - 48 * 3600000);
    const stale48h = signalements.filter((s) =>
      s.status === 'pending' && s.created_at && new Date(s.created_at) < cutoff48h
    ).length;

    const done = tournees.filter((t) => t.status === 'done');
    const totalCollectes = done.reduce((s, t) => s + (t.conteneurs_collectes || 0), 0);
    const tauxCollecte = done.length > 0 && totalContainers > 0
      ? Math.min(100, Math.round((totalCollectes / (done.length * totalContainers)) * 100 * done.length))
      : 0;

    const tourneesEnCours = tournees.filter((t) => t.status === 'in_progress').length;
    const tourneesPlanifiees = tournees.filter((t) => t.status === 'pending').length;
    const tourneesTerminees = tournees.filter((t) => t.status === 'done').length;

    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const activeCitoyens = new Set(
      signalements
        .filter((s) => s.id_utilisateur && s.created_at && new Date(s.created_at) >= weekAgo)
        .map((s) => s.id_utilisateur)
    ).size;

    const todaySigs = signalements.filter((s) => s.created_at && new Date(s.created_at) >= todayStart);
    const todayCreated = todaySigs.length;
    const todayResolved = signalements.filter((s) =>
      s.status === 'closed' && s.date_resolution && new Date(s.date_resolution) >= todayStart
    ).length;
    const todayTournees = tournees.filter((t) =>
      t.status === 'done' && t.date_prevue && new Date(t.date_prevue) >= todayStart
    ).length;
    const todayCollected = tournees
      .filter((t) => (t.status === 'in_progress' || t.status === 'done') && t.date_prevue && new Date(t.date_prevue) >= todayStart)
      .reduce((s, t) => s + (t.conteneurs_collectes || 0), 0);

    return {
      totalContainers, avgFillRate, criticalCount, needsServiceCount,
      pendingSig, tauxResolution, closedSig,
      avgResolutionH, stale48h, tauxCollecte,
      tourneesEnCours, tourneesPlanifiees, tourneesTerminees,
      activeCitoyens,
      todayCreated, todayResolved, todayTournees, todayCollected,
    };
  }, [containers, signalements, tournees, criticalContainers, dashboardStats]);

  if (loading) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="echarts-stat-card stat-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">

      {/* ══ PERFORMANCE DU JOUR — gros cards proéminents ══ */}
      {sectionTitle(<Zap size={15} color="#f59e0b" />, "Performance du jour")}
      {perfCard('Signalements reçus', stats.todayCreated, "Aujourd'hui", '#f59e0b', '📥')}
      {perfCard('Signalements résolus', stats.todayResolved, "Fermés aujourd'hui", '#10b981', '✅')}
      {perfCard('Tournées complétées', stats.todayTournees, "Terminées aujourd'hui", '#3b82f6', '🚛')}
      {perfCard('Conteneurs collectés', stats.todayCollected, "Vidés aujourd'hui", '#0ea5e9', '♻️')}

      {/* ══ CONTENEURS ══ */}
      {sectionTitle(<Package size={15} color="#0284c7" />, "Conteneurs")}
      <div className="card-wide">
        <EchartsStatCard title="Total conteneurs" value={stats.totalContainers.toString()} type="bar" color="#0284c7" subtitle="En service" />
      </div>
      <EchartsStatCard title="Remplissage moyen" value={`${stats.avgFillRate}%`} type="gauge" inverted
        color={stats.avgFillRate > 80 ? '#ef4444' : stats.avgFillRate > 50 ? '#f59e0b' : '#10b981'} subtitle="Tous conteneurs" />
      <EchartsStatCard title="Alertes critiques" value={stats.criticalCount.toString()} type="pie" color="#ef4444"
        subtitle={`${stats.needsServiceCount} à collecter`} />

      {/* ══ SIGNALEMENTS ══ */}
      {sectionTitle(<AlertTriangle size={15} color="#f59e0b" />, "Signalements")}
      <EchartsStatCard title="Ouverts" value={stats.pendingSig.toString()} type="bar" color="#f59e0b" subtitle="En attente" />
      <EchartsStatCard title="Taux de résolution" value={`${stats.tauxResolution}%`} type="gauge"
        color={stats.tauxResolution >= 70 ? '#10b981' : stats.tauxResolution >= 40 ? '#f59e0b' : '#ef4444'} subtitle={`${stats.closedSig} résolus`} />
      <EchartsStatCard title="Délai moyen" value={stats.avgResolutionH > 24 ? `${Math.round(stats.avgResolutionH / 24)}j` : `${stats.avgResolutionH}h`}
        type="line" color={stats.avgResolutionH > 72 ? '#ef4444' : stats.avgResolutionH > 24 ? '#f59e0b' : '#10b981'} subtitle="Création → fermeture" />
      <EchartsStatCard title="En retard > 48h" value={stats.stale48h.toString()} type="bar"
        color={stats.stale48h > 5 ? '#ef4444' : stats.stale48h > 0 ? '#f59e0b' : '#10b981'}
        subtitle={stats.stale48h === 0 ? 'Tout est à jour' : 'Non traités'} />

      {/* ══ TOURNÉES & ENGAGEMENT ══ */}
      {sectionTitle(<Truck size={15} color="#3b82f6" />, "Tournées & engagement")}
      <EchartsStatCard title="En cours" value={stats.tourneesEnCours.toString()} type="bar" color="#3b82f6" subtitle="Prises en charge" />
      <EchartsStatCard title="Planifiées" value={stats.tourneesPlanifiees.toString()} type="line" color="#f59e0b" subtitle="À venir" />
      <EchartsStatCard title="Taux de collecte" value={`${stats.tauxCollecte}%`} type="gauge"
        color={stats.tauxCollecte >= 70 ? '#10b981' : stats.tauxCollecte >= 40 ? '#f59e0b' : '#ef4444'} subtitle="Conteneurs vidés" />
      <EchartsStatCard title="Citoyens actifs" value={stats.activeCitoyens.toString()} type="bar" color="#8b5cf6" subtitle="7 derniers jours" />
    </div>
  );
}
