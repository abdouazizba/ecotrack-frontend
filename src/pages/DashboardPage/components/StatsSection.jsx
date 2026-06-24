import React, { useMemo } from 'react';
import EchartsStatCard from '../../../components/charts/EchartsStatCard';

export default function StatsSection({ containers, signalements, zones, agents, tournees = [], criticalContainers = [], dashboardStats = {}, loading }) {
  const stats = useMemo(() => {
    // ── conteneurs — use DB totals from stats endpoint when available ──
    const totalContainers = dashboardStats.containers ?? containers.length;
    const avgFillRate = dashboardStats.averageFillRate != null
      ? Math.round(dashboardStats.averageFillRate)
      : (() => {
          const validFill = containers.filter((c) => c.fillLevel != null);
          return validFill.length
            ? Math.round(validFill.reduce((s, c) => s + (c.fillLevel || 0), 0) / validFill.length)
            : 0;
        })();
    const criticalCount = dashboardStats.criticalContainers
      ?? containers.filter((c) => (c.fillLevel || 0) > 80).length;
    const statusBreakdown = dashboardStats.containerBreakdown?.status || {};
    const maintenanceContainers = (statusBreakdown.maintenance ?? 0) + (statusBreakdown.retire ?? 0)
      || containers.filter((c) => c.status === 'maintenance' || c.status === 'retire').length;

    // ── zones ──
    const totalZones = zones.length;
    const activeZones = zones.filter((z) => z.is_active === true || z.is_active === 1).length;

    // ── signalements ──
    const totalSig = signalements.length;
    const pendingSig  = signalements.filter((s) => s.status === 'pending').length;
    const inProgressSig = signalements.filter((s) => s.status === 'in_progress').length;
    const closedSig   = signalements.filter((s) => s.status === 'closed').length;
    const tauxResolution = totalSig > 0 ? Math.round((closedSig / totalSig) * 100) : 0;

    // ── agents ──
    const activeAgents = agents.filter(
      (a) => a.status === 'active' || a.is_active === true || a.is_active === 1
    ).length;

    // ── tournées ──
    const tourneesEnCours   = tournees.filter((t) => t.status === 'in_progress').length;
    const tourneesPlanifiees = tournees.filter((t) => t.status === 'pending').length;
    const tourneesTerminees = tournees.filter((t) => t.status === 'done').length;

    // ── conteneurs critiques (needs-service) ──
    const needsServiceCount = criticalContainers.length;

    return {
      totalContainers, avgFillRate, criticalContainers: criticalCount, maintenanceContainers,
      totalZones, activeZones,
      pendingSig, inProgressSig, closedSig, tauxResolution,
      activeAgents,
      tourneesEnCours, tourneesPlanifiees, tourneesTerminees, needsServiceCount,
    };
  }, [containers, signalements, zones, agents, tournees, criticalContainers, dashboardStats]);

  if (loading) {
    return (
      <div className="stats-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="echarts-stat-card stat-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {/* ── ligne 1 : conteneurs ── */}
      <EchartsStatCard
        title="Conteneurs"
        value={stats.totalContainers.toString()}
        type="bar"
        color="#0284c7"
        subtitle="Total en service"
      />
      <EchartsStatCard
        title="Remplissage Moyen"
        value={stats.avgFillRate.toString()}
        type="gauge"
        inverted
        color={stats.avgFillRate > 80 ? '#ef4444' : stats.avgFillRate > 50 ? '#f59e0b' : '#10b981'}
        subtitle="Tous conteneurs"
      />
      <EchartsStatCard
        title="Conteneurs Critiques"
        value={stats.criticalContainers.toString()}
        type="pie"
        color="#ef4444"
        subtitle="Remplissage > 80 %"
      />
      <EchartsStatCard
        title="En Maintenance"
        value={stats.maintenanceContainers.toString()}
        type="bar"
        color="#8b5cf6"
        subtitle="Hors service / retirés"
      />

      {/* ── ligne 2 : zones & agents ── */}
      <EchartsStatCard
        title="Zones"
        value={stats.totalZones.toString()}
        type="line"
        color="#16a34a"
        subtitle={`${stats.activeZones} actives`}
      />
      <EchartsStatCard
        title="Agents Actifs"
        value={stats.activeAgents.toString()}
        type="bar"
        color="#0ea5e9"
        subtitle="Comptes activés"
      />

      {/* ── ligne 3 : signalements ── */}
      <EchartsStatCard
        title="Signalements Ouverts"
        value={stats.pendingSig.toString()}
        type="bar"
        color="#f59e0b"
        subtitle="En attente de traitement"
      />
      <EchartsStatCard
        title="En Cours"
        value={stats.inProgressSig.toString()}
        type="line"
        color="#3b82f6"
        subtitle="Traitement en cours"
      />
      <EchartsStatCard
        title="Taux de Résolution"
        value={stats.tauxResolution.toString()}
        type="gauge"
        color={stats.tauxResolution >= 70 ? '#10b981' : stats.tauxResolution >= 40 ? '#f59e0b' : '#ef4444'}
        subtitle={`${stats.closedSig ?? ''} signalement(s) résolus`}
      />
      <EchartsStatCard
        title="Résolus"
        value={(stats.closedSig ?? 0).toString()}
        type="pie"
        color="#10b981"
        subtitle="Signalements fermés"
      />

      {/* ── ligne 4 : tournées ── */}
      <EchartsStatCard
        title="Tournées En Cours"
        value={(stats.tourneesEnCours ?? 0).toString()}
        type="bar"
        color="#3b82f6"
        subtitle="Prises en charge"
      />
      <EchartsStatCard
        title="Tournées Planifiées"
        value={(stats.tourneesPlanifiees ?? 0).toString()}
        type="line"
        color="#f59e0b"
        subtitle="À prendre en charge"
      />
      <EchartsStatCard
        title="Tournées Terminées"
        value={(stats.tourneesTerminees ?? 0).toString()}
        type="pie"
        color="#10b981"
        subtitle="Complétées"
      />
      <EchartsStatCard
        title="Conteneurs à Collecter"
        value={(stats.needsServiceCount ?? 0).toString()}
        type="bar"
        color={stats.needsServiceCount > 10 ? '#ef4444' : '#f59e0b'}
        subtitle="Remplissage critique"
      />
    </div>
  );
}
