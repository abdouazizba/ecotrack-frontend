import React, { useMemo } from 'react';
import ChartCard from '../../../components/charts/ChartCard';

// ── palette ─────────────────────────────────────────────────────────────────
const COLORS = {
  green:  '#10b981',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  red:    '#ef4444',
  orange: '#f97316',
  purple: '#8b5cf6',
  sky:    '#0ea5e9',
};

const GRID = { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true };
const TOOLTIP = { backgroundColor: '#fff', borderColor: '#e2e8f0', textStyle: { color: '#1e293b' } };

// ── chart builders ────────────────────────────────────────────────────────────

function buildEvolution(signalements) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const labels = days.map((d) =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
  );
  const values = days.map((d) => {
    const dayStr = d.toISOString().split('T')[0];
    return signalements.filter((s) => {
      const ca = s.created_at;
      return ca && (typeof ca === 'string' ? ca.startsWith(dayStr) : false);
    }).length;
  });

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    grid: GRID,
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    series: [{
      data: values,
      type: 'line',
      smooth: 0.4,
      itemStyle: { color: COLORS.blue },
      lineStyle: { color: COLORS.blue, width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.blue + '40' }, { offset: 1, color: COLORS.blue + '05' }] } },
      symbolSize: 6,
    }],
  };
}

function buildSignalByType(signalements) {
  const TYPE_FR = { overflowing: 'Débordement', full: 'Plein', damaged: 'Endommagé', smell: 'Odeur', other: 'Autre' };
  const TYPE_COLOR = { overflowing: COLORS.red, full: COLORS.amber, damaged: COLORS.orange, smell: COLORS.purple, other: COLORS.sky };

  const counts = {};
  signalements.forEach((s) => { counts[s.type] = (counts[s.type] || 0) + 1; });
  const items = Object.entries(counts).map(([type, count]) => ({
    value: count,
    name: TYPE_FR[type] || type,
    itemStyle: { color: TYPE_COLOR[type] || COLORS.blue },
  }));

  return {
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'],
      data: items.length ? items : [{ value: 1, name: 'Aucune donnée', itemStyle: { color: '#e2e8f0' } }],
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  };
}

function buildPriority(signalements) {
  const PRIO = [
    { key: 'critical', label: 'Critique', color: COLORS.red },
    { key: 'high',     label: 'Haute',    color: COLORS.orange },
    { key: 'medium',   label: 'Normale',  color: COLORS.blue },
    { key: 'low',      label: 'Basse',    color: COLORS.green },
  ];
  const counts = {};
  signalements.forEach((s) => { counts[s.priority] = (counts[s.priority] || 0) + 1; });

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    grid: GRID,
    xAxis: { type: 'category', data: PRIO.map((p) => p.label), axisLabel: { color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    series: [{
      type: 'bar',
      data: PRIO.map((p) => ({ value: counts[p.key] || 0, itemStyle: { color: p.color, borderRadius: [6, 6, 0, 0] } })),
      barMaxWidth: 56,
    }],
  };
}

function buildFillByZone(containers, zones) {
  const zoneData = zones.map((z) => {
    const zc = containers.filter((c) => c.zoneId === z.id && c.fillLevel != null);
    const avg = zc.length ? Math.round(zc.reduce((s, c) => s + (c.fillLevel || 0), 0) / zc.length) : 0;
    return { nom: z.nom || `Zone ${z.id}`, avg };
  }).filter((z) => z.avg > 0 || zones.length < 10);

  const colors = zoneData.map((z) =>
    z.avg > 80 ? COLORS.red : z.avg > 50 ? COLORS.amber : COLORS.green
  );

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis', formatter: '{b}: {c}%' },
    grid: GRID,
    xAxis: { type: 'category', data: zoneData.map((z) => z.nom), axisLabel: { color: '#64748b', rotate: zoneData.length > 5 ? 30 : 0 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', max: 100, axisLabel: { color: '#64748b', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      type: 'bar',
      data: zoneData.map((z, i) => ({ value: z.avg, itemStyle: { color: colors[i], borderRadius: [6, 6, 0, 0] } })),
      barMaxWidth: 56,
    }],
  };
}

function buildTopAgents(signalements, agents) {
  const counts = {};
  signalements
    .filter((s) => s.id_utilisateur && s.status !== 'pending')
    .forEach((s) => { counts[s.id_utilisateur] = (counts[s.id_utilisateur] || 0) + 1; });

  const agentMap = {};
  agents.forEach((a) => { agentMap[a.id] = `${a.firstName} ${a.lastName}`.trim() || a.email; });

  const top5 = Object.entries(counts)
    .map(([id, count]) => ({ name: agentMap[id] || `Agent #${id.slice(0, 6)}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (top5.length === 0) {
    top5.push({ name: 'Aucune donnée', count: 0 });
  }

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis', formatter: '{b}: {c} signalement(s)' },
    grid: { left: '2%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    yAxis: { type: 'category', data: top5.map((a) => a.name), axisLabel: { color: '#64748b' } },
    series: [{
      type: 'bar',
      data: top5.map((a) => ({
        value: a.count,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: COLORS.green }, { offset: 1, color: COLORS.sky }] }, borderRadius: [0, 6, 6, 0] },
      })),
    }],
  };
}

function buildTourneeStatus(tournees) {
  const STATUTS = [
    { key: 'pending',     label: 'Planifiée',  color: COLORS.amber },
    { key: 'in_progress', label: 'En cours',   color: COLORS.blue },
    { key: 'done',        label: 'Terminée',   color: COLORS.green },
    { key: 'cancelled',   label: 'Annulée',    color: COLORS.red },
  ];
  const counts = {};
  tournees.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
  const items = STATUTS.map((s) => ({ value: counts[s.key] || 0, name: s.label, itemStyle: { color: s.color } })).filter((i) => i.value > 0);

  return {
    tooltip: { ...TOOLTIP, trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'],
      data: items.length ? items : [{ value: 1, name: 'Aucune donnée', itemStyle: { color: '#e2e8f0' } }],
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  };
}

function buildTourneeEvolution(tournees) {
  const weeks = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i) * 7);
    return d;
  });
  const labels = weeks.map((d) =>
    `Sem. ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
  );
  const completed = weeks.map((d, i) => {
    const start = new Date(d);
    const end = i < weeks.length - 1 ? new Date(weeks[i + 1]) : new Date();
    return tournees.filter((t) => {
      if (t.status !== 'done') return false;
      const td = new Date(t.date_prevue || t.created_at);
      return td >= start && td < end;
    }).length;
  });
  const planned = weeks.map((d, i) => {
    const start = new Date(d);
    const end = i < weeks.length - 1 ? new Date(weeks[i + 1]) : new Date();
    return tournees.filter((t) => {
      const td = new Date(t.date_prevue || t.created_at);
      return td >= start && td < end;
    }).length;
  });

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    legend: { data: ['Planifiées', 'Terminées'], textStyle: { color: '#64748b' }, bottom: 0 },
    grid: GRID,
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    series: [
      { name: 'Planifiées', data: planned, type: 'bar', itemStyle: { color: COLORS.amber, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 },
      { name: 'Terminées', data: completed, type: 'bar', itemStyle: { color: COLORS.green, borderRadius: [4, 4, 0, 0] }, barMaxWidth: 24 },
    ],
  };
}

function buildContainersByZone(containers, zones) {
  const zoneData = zones.map((z) => {
    const count = containers.filter((c) => c.zoneId === z.id).length;
    return { nom: z.nom || `Zone ${z.id}`, count };
  }).filter((z) => z.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis', formatter: '{b}: {c} conteneurs' },
    grid: { left: '2%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    yAxis: { type: 'category', data: zoneData.map((z) => z.nom), axisLabel: { color: '#64748b', fontSize: 11 } },
    series: [{
      type: 'bar',
      data: zoneData.map((z) => ({
        value: z.count,
        itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: COLORS.blue }, { offset: 1, color: COLORS.sky }] }, borderRadius: [0, 6, 6, 0] },
      })),
    }],
  };
}

function buildResolutionTime(signalements) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const labels = days.map((d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
  const values = days.map((d) => {
    const dayStr = d.toISOString().split('T')[0];
    const resolved = signalements.filter((s) =>
      s.status === 'closed' && s.date_resolution && s.created_at &&
      (typeof s.date_resolution === 'string' ? s.date_resolution.startsWith(dayStr) : false)
    );
    if (resolved.length === 0) return 0;
    const totalH = resolved.reduce((sum, s) => sum + (new Date(s.date_resolution) - new Date(s.created_at)), 0);
    return Math.round(totalH / resolved.length / 3600000);
  });

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis', formatter: '{b}: {c}h' },
    grid: GRID,
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b', formatter: '{value}h' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      data: values,
      type: 'bar',
      itemStyle: {
        color: (p) => p.value > 48 ? COLORS.red : p.value > 24 ? COLORS.amber : COLORS.green,
        borderRadius: [6, 6, 0, 0],
      },
      barMaxWidth: 40,
    }],
  };
}

function buildCitoyenActivity(signalements) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const labels = days.map((d) => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
  const values = days.map((d) => {
    const dayStr = d.toISOString().split('T')[0];
    const unique = new Set(
      signalements
        .filter((s) => s.id_utilisateur && s.created_at && (typeof s.created_at === 'string' ? s.created_at.startsWith(dayStr) : false))
        .map((s) => s.id_utilisateur)
    );
    return unique.size;
  });

  return {
    tooltip: { ...TOOLTIP, trigger: 'axis' },
    grid: GRID,
    xAxis: { type: 'category', data: labels, axisLabel: { color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, minInterval: 1 },
    series: [{
      data: values,
      type: 'line',
      smooth: 0.4,
      itemStyle: { color: COLORS.purple },
      lineStyle: { color: COLORS.purple, width: 2.5 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.purple + '40' }, { offset: 1, color: COLORS.purple + '05' }] } },
      symbolSize: 6,
    }],
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ChartsSection({ containers, signalements, zones, agents, tournees = [], loading }) {
  const evolution      = useMemo(() => buildEvolution(signalements), [signalements]);
  const byType         = useMemo(() => buildSignalByType(signalements), [signalements]);
  const priority       = useMemo(() => buildPriority(signalements), [signalements]);
  const fillZone       = useMemo(() => buildFillByZone(containers, zones), [containers, zones]);
  const topAgents      = useMemo(() => buildTopAgents(signalements, agents), [signalements, agents]);
  const tourneeStatus  = useMemo(() => buildTourneeStatus(tournees), [tournees]);
  const tourneeEvo     = useMemo(() => buildTourneeEvolution(tournees), [tournees]);
  const containersByZone = useMemo(() => buildContainersByZone(containers, zones), [containers, zones]);
  const resolutionTime = useMemo(() => buildResolutionTime(signalements), [signalements]);
  const citoyenActivity = useMemo(() => buildCitoyenActivity(signalements), [signalements]);

  if (loading) {
    return (
      <div className="charts-grid-2col">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="chart-skeleton" style={{ height: 320, borderRadius: 12, background: '#f1f5f9' }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Row 1 — Signalements */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Signalements — 7 derniers jours" option={evolution} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Signalements par type" option={byType} height={300} />
        </div>
      </div>

      {/* Row 2 — Priorités & Performance résolution */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Signalements par priorité" option={priority} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Délai moyen de résolution (heures)" option={resolutionTime} height={300} />
        </div>
      </div>

      {/* Row 3 — Zones & Conteneurs */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Remplissage moyen par zone (%)" option={fillZone} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Conteneurs par zone" option={containersByZone} height={300} />
        </div>
      </div>

      {/* Row 4 — Tournées */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Tournées — évolution hebdomadaire" option={tourneeEvo} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Répartition des tournées" option={tourneeStatus} height={300} />
        </div>
      </div>

      {/* Row 5 — Performance & Engagement */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Top 5 agents — signalements traités" option={topAgents} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Citoyens actifs — 7 derniers jours" option={citoyenActivity} height={300} />
        </div>
      </div>
    </>
  );
}
