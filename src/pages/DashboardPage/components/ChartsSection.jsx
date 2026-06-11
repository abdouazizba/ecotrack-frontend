import React, { useMemo } from 'react';
import ChartCard from '../../../components/Charts/ChartCard';

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

function buildStatutSig(signalements) {
  const STATUTS = [
    { key: 'pending',     label: 'Ouvert',   color: COLORS.amber },
    { key: 'in_progress', label: 'En cours', color: COLORS.blue },
    { key: 'closed',      label: 'Fermé',    color: COLORS.green },
    { key: 'rejected',    label: 'Rejeté',   color: COLORS.red },
  ];
  const counts = {};
  signalements.forEach((s) => { counts[s.status] = (counts[s.status] || 0) + 1; });
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

// ── component ─────────────────────────────────────────────────────────────────

export default function ChartsSection({ containers, signalements, zones, agents, loading }) {
  const evolution  = useMemo(() => buildEvolution(signalements), [signalements]);
  const byType     = useMemo(() => buildSignalByType(signalements), [signalements]);
  const priority   = useMemo(() => buildPriority(signalements), [signalements]);
  const statut     = useMemo(() => buildStatutSig(signalements), [signalements]);
  const fillZone   = useMemo(() => buildFillByZone(containers, zones), [containers, zones]);
  const topAgents  = useMemo(() => buildTopAgents(signalements, agents), [signalements, agents]);

  if (loading) {
    return (
      <>
        <div className="charts-grid-2col">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="chart-skeleton" style={{ height: 320, borderRadius: 12, background: '#f1f5f9' }} />
          ))}
        </div>
        <div className="chart-wrapper full-width">
          <div className="chart-skeleton" style={{ height: 280, borderRadius: 12, background: '#f1f5f9' }} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Row 1 */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Évolution des Signalements (7 jours)" option={evolution} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Signalements par Type" option={byType} height={300} />
        </div>
      </div>

      {/* Row 2 */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Signalements par Priorité" option={priority} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Statut des Signalements" option={statut} height={300} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="charts-grid-2col">
        <div className="chart-wrapper">
          <ChartCard title="Remplissage Moyen par Zone (%)" option={fillZone} height={300} />
        </div>
        <div className="chart-wrapper">
          <ChartCard title="Top 5 Agents — Signalements Traités" option={topAgents} height={300} />
        </div>
      </div>
    </>
  );
}
