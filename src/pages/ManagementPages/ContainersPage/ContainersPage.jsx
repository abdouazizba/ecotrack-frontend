import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Edit2, Trash2, MapPin, Calendar,
  ChevronLeft, ChevronRight, X, Gauge, Layers, TrendingUp,
  Cpu, Thermometer, Wifi, Battery, AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getContainers, createContainer, updateContainer, deleteContainer,
  getZones, getCapteurs, getSignalementsContainer, getMesuresConteneur,
} from '../../../services/api';
import { enrichContainersWithSensors } from '../../../services/transformers';
import PageShell from '../../../components/common/PageShell';
import ContainerForm from './components/ContainerForm';

const REFRESH_INTERVAL = 30000;

/* ── Meta maps ────────────────────────────────────────────────────── */
const STATUS_META = {
  actif:       { label: 'En service',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  en_service:  { label: 'En service',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  maintenance: { label: 'Maintenance',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  retire:      { label: 'Retiré',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  inactif:     { label: 'Inactif',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const TYPE_META = {
  poubelle:          { label: 'Poubelle',          color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  benne:             { label: 'Benne',             color: '#3b82f6', bg: 'rgba(37,99,235,0.12)' },
  conteneur_enterre: { label: 'Enterré',           color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  composteur:        { label: 'Composteur',        color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  standard:          { label: 'Standard',          color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  selective:         { label: 'Sélectif',          color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  organic:           { label: 'Organique',         color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  hazardous:         { label: 'Dangereux',         color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
};

const CAP_TYPE = {
  REMPLISSAGE: { label: 'Remplissage', Icon: Gauge,       unit: '%',   color: '#2563eb', bg: 'rgba(37,99,235,0.10)' },
  TEMPERATURE: { label: 'Température', Icon: Thermometer, unit: '°C',  color: '#ea580c', bg: 'rgba(234,88,12,0.10)' },
  SIGNAL:      { label: 'Signal',      Icon: Wifi,        unit: 'dBm', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
};
const CAP_STATUS = {
  ACTIF:          { label: 'Actif',       color: '#16a34a' },
  INACTIF:        { label: 'Inactif',     color: '#6b7280' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#ea580c' },
};

const SIG_STATUS = {
  pending:     { l: 'Ouvert',   c: '#f59e0b' },
  in_progress: { l: 'En cours', c: '#3b82f6' },
  closed:      { l: 'Fermé',    c: '#10b981' },
  rejected:    { l: 'Rejeté',   c: '#ef4444' },
};

const STATUS_FILTERS = [
  ['all', 'Tous'],
  ['en_service', 'En service'],
  ['maintenance', 'Maintenance'],
  ['retire', 'Retiré'],
];

const TYPE_FILTERS = [
  ['all', 'Tous types'],
  ['standard', 'Standard'],
  ['selective', 'Sélectif'],
  ['organic', 'Organique'],
  ['hazardous', 'Dangereux'],
  ['poubelle', 'Poubelle'],
  ['benne', 'Benne'],
  ['conteneur_enterre', 'Enterré'],
  ['composteur', 'Composteur'],
];

const PAGE_SIZE = 15;

const DAYS = ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', "Auj."];

/* ── Helper: normalise status for filter matching ─────────────────── */
function matchStatus(containerStatus, filterKey) {
  if (filterKey === 'all') return true;
  if (filterKey === 'en_service') return containerStatus === 'actif' || containerStatus === 'en_service';
  return containerStatus === filterKey;
}

/* ── Sparkline sub-component ──────────────────────────────────────── */
function Sparkline({ containerId, currentFill, mesures = [] }) {
  const fill = Math.min(100, Math.max(0, currentFill || 0));
  let pts;
  if (mesures.length >= 2) {
    const sorted = [...mesures].sort((a, b) => new Date(a.date_mesure) - new Date(b.date_mesure));
    const last7 = sorted.slice(-7);
    pts = last7.map((m) => Math.round(m.fillLevel ?? m.taux_remplissage ?? 0));
    while (pts.length < 7) pts.unshift(pts[0] ?? 0);
  } else {
    pts = Array(7).fill(fill);
  }
  const color = fill > 80 ? '#ef4444' : fill > 50 ? '#f59e0b' : '#10b981';
  const W = 280, H = 60;
  const minV = Math.max(0, Math.min(...pts) - 5);
  const maxV = Math.min(100, Math.max(...pts) + 5);
  const span = maxV - minV || 1;
  const toX = (i) => ((i / 6) * W).toFixed(1);
  const toY = (v) => (H - ((v - minV) / span) * (H - 12) - 6).toFixed(1);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px 10px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-${containerId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${containerId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r={i === 6 ? 4 : 2.5}
            fill={color} opacity={i === 6 ? 1 : 0.55} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {DAYS.map((d) => <span key={d} style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>{d}</span>)}
      </div>
    </div>
  );
}

/* ── FillBar sub-component ────────────────────────────────────────── */
function FillBar({ value }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  const label = pct > 80 ? 'Critique' : pct > 50 ? 'Attention' : 'Normal';
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{pct.toFixed(0)}%</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color }}>{label}</span>
      </div>
      <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
        <span>0%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  );
}

/* ── FillBarMini for list items ────────────────────────────────────── */
function FillBarMini({ value }) {
  const pct = Math.min(Math.max(parseFloat(value) || 0, 0), 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.65rem', color, fontWeight: 700, minWidth: 28 }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */
export default function ContainersPage() {
  const navigate = useNavigate();

  const [containers, setContainers] = useState([]);
  const [capteurs, setCapteurs]     = useState([]);
  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);

  const [tab, setTab]                           = useState('monitoring');
  const [countdown, setCountdown]               = useState(REFRESH_INTERVAL / 1000);

  const [showForm, setShowForm]               = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);

  // Detail sub-data
  const [sigs, setSigs]       = useState([]);
  const [mesures, setMesures] = useState([]);

  /* ── Load ──────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, zData, capData] = await Promise.all([getContainers(), getZones(), getCapteurs()]);
      const rawContainers = Array.isArray(cData) ? cData : cData?.data || [];
      const capList = Array.isArray(capData) ? capData : capData?.data || [];
      setCapteurs(capList);
      setContainers(enrichContainersWithSensors(rawContainers, capList));
      setZones(Array.isArray(zData) ? zData : zData?.data || []);
      setCountdown(REFRESH_INTERVAL / 1000);
      setError(null);
    } catch {
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh in monitoring mode
  useEffect(() => {
    if (tab !== 'monitoring') return;
    const iv = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [load, tab]);
  useEffect(() => {
    if (tab !== 'monitoring') return;
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load detail sub-data when selection changes
  useEffect(() => {
    if (!selected?.id) { setSigs([]); setMesures([]); return; }
    getSignalementsContainer(selected.id).then(d => setSigs(d || [])).catch(() => setSigs([]));
    getMesuresConteneur(selected.id).then(d => setMesures(Array.isArray(d) ? d : [])).catch(() => setMesures([]));
  }, [selected?.id]);

  /* ── Maps ──────────────────────────────────────────────────────── */
  const zoneMap = useMemo(() => {
    const m = {};
    zones.forEach(z => { m[z.id] = z.nom || z.name; });
    return m;
  }, [zones]);

  /* ── Filtered + paginated ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = containers;
    if (filter !== 'all') list = list.filter(c => matchStatus(c.status, filter));
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.name || c.code_conteneur || '').toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (zoneMap[c.zoneId] || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [containers, filter, typeFilter, search, zoneMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter, typeFilter, search]);
  useEffect(() => {
    if (selected && !filtered.find(c => c.id === selected.id)) setSelected(null);
  }, [filtered, selected]);

  /* ── Stats ─────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: containers.length,
    enService: containers.filter(c => c.status === 'actif' || c.status === 'en_service').length,
    critique: containers.filter(c => (c.fillLevel || 0) > 80).length,
    maintenance: containers.filter(c => c.status === 'maintenance').length,
  }), [containers]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditingContainer(null);
    setShowForm(true);
  };

  const openEdit = (container) => {
    setEditingContainer(container);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingContainer) {
        await updateContainer(editingContainer.id, formData);
      } else {
        await createContainer(formData);
      }
      setShowForm(false);
      setEditingContainer(null);
      await load();
    } catch {
      setError(editingContainer ? 'Erreur lors de la modification' : 'Erreur lors de la creation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce conteneur ?')) return;
    try {
      await deleteContainer(id);
      if (selected?.id === id) setSelected(null);
      await load();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  /* ── Helpers ───────────────────────────────────────────────────── */
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const getContainerName = (c) => c.name || c.code_conteneur || `Conteneur #${c.id?.toString().slice(0, 6)}`;

  const linkedCapteurs = useMemo(() => {
    if (!selected) return [];
    return capteurs.filter(cap => cap.id_conteneur === selected.id);
  }, [selected, capteurs]);

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  /* ── Filters ReactNode ──────────────────────────────────────────── */
  const filtersNode = (
    <>
      {STATUS_FILTERS.map(([key, label]) => (
        <button key={key} onClick={() => setFilter(key)}
          style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: filter === key ? '#10b981' : 'rgba(255,255,255,0.06)', color: filter === key ? '#fff' : '#94a3b8', transition: 'all 0.15s' }}>
          {label}
        </button>
      ))}
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' }}>
        {TYPE_FILTERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </>
  );

  return (
    <PageShell
      icon={Box}
      title="Conteneurs"
      count={filtered.length}
      hasTabs
      activeTab={tab}
      onTabChange={(t) => { setTab(t); setSelected(null); }}
      stats={[
        { label: 'Total conteneurs',    value: stats.total,       color: '#3b82f6' },
        { label: 'En service',           value: stats.enService,   color: '#10b981' },
        { label: 'Remplissage critique', value: stats.critique,    color: '#ef4444' },
        { label: 'En maintenance',       value: stats.maintenance, color: '#f59e0b' },
      ]}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Rechercher un conteneur..."
      onCreateClick={openCreate}
      createLabel="Nouveau conteneur"
      refreshCountdown={countdown}
      onRefresh={() => { setLoading(true); load(); }}
      filters={filtersNode}
    >

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '8px 14px', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* ── Dual panel ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* ── Left: list ───────────────────────────────────────────── */}
        <div style={{ flex: selected ? '0 0 420px' : 1, display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'flex 0.2s' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
            {loading && <p style={{ color: '#64748b', padding: 20 }}>Chargement...</p>}
            {!loading && paginated.length === 0 && <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>Aucun conteneur trouve</p>}
            {paginated.map(c => {
              const type = TYPE_META[c.type] || TYPE_META.standard;
              const status = STATUS_META[c.status] || STATUS_META.actif;
              const isSelected = selected?.id === c.id;
              const fillPct = Math.min(Math.max(c.fillLevel || 0, 0), 100);
              const isCritical = fillPct > 80;

              return (
                <div key={c.id} onClick={() => setSelected(c)}
                  style={{
                    background: isSelected ? 'rgba(16,185,129,0.08)' : '#1e2433',
                    border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : isSelected ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                    transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: type.bg, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Box size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                          {c.code_conteneur || c.name || `#${c.id?.toString().slice(0, 6)}`}
                        </span>
                        <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: type.bg, color: type.color }}>
                          {type.label}
                        </span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {zoneMap[c.zoneId] || '—'}
                      </p>
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: status.bg, color: status.color, flexShrink: 0 }}>
                      {status.label}
                    </span>
                  </div>
                  <FillBarMini value={c.fillLevel} />
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === 1 ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === 1 ? '#334155' : '#94a3b8', opacity: page === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#475569' }}>...</span>}
                    <button onClick={() => setPage(p)}
                      style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: page === p ? '#10b981' : 'rgba(255,255,255,0.06)', color: page === p ? '#fff' : '#94a3b8' }}>
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: page === totalPages ? 'default' : 'pointer', background: 'rgba(255,255,255,0.06)', color: page === totalPages ? '#334155' : '#94a3b8', opacity: page === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── Right: detail panel ──────────────────────────────────── */}
        {selected && (
          <div style={{ flex: 1, background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideIn 0.2s ease' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: (TYPE_META[selected.type] || TYPE_META.standard).bg, color: (TYPE_META[selected.type] || TYPE_META.standard).color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box size={24} />
                </div>
                <div>
                  <span style={{ color: '#7dd3fc', fontFamily: 'monospace', fontWeight: 700, fontSize: '1.15rem' }}>
                    {getContainerName(selected)}
                  </span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: (TYPE_META[selected.type] || TYPE_META.standard).bg, color: (TYPE_META[selected.type] || TYPE_META.standard).color }}>
                      {(TYPE_META[selected.type] || TYPE_META.standard).label}
                    </span>
                    <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: (STATUS_META[selected.status] || STATUS_META.actif).bg, color: (STATUS_META[selected.status] || STATUS_META.actif).color }}>
                      {(STATUS_META[selected.status] || STATUS_META.actif).label}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            </div>

            {/* Fill level */}
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gauge size={13} color="#10b981" /> Taux de remplissage
              </p>
              <FillBar value={selected.fillLevel} />
            </div>

            {/* Sparkline */}
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} color="#10b981" /> Historique 7 jours
              </p>
              <Sparkline containerId={selected.id} currentFill={selected.fillLevel} mesures={mesures} />
            </div>

            {/* Info grid */}
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} color="#10b981" /> Informations
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { icon: MapPin, label: 'Zone', value: zoneMap[selected.zoneId] || '—', color: '#10b981' },
                  { icon: MapPin, label: 'Adresse', value: selected.adresse || selected.address || '—', color: '#3b82f6' },
                  { icon: Box, label: 'Capacite', value: selected.capacity ? `${selected.capacity} L` : '—', color: '#8b5cf6' },
                  {
                    icon: Gauge, label: 'Taux de remplissage',
                    value: selected.fillLevel != null ? `${Math.round(selected.fillLevel)}%` : '—',
                    color: (selected.fillLevel || 0) > 80 ? '#ef4444' : (selected.fillLevel || 0) > 50 ? '#f59e0b' : '#10b981',
                  },
                  { icon: Calendar, label: "Date d'installation", value: fmtDate(selected.date_installation), color: '#f59e0b' },
                  { icon: Calendar, label: 'Derniere collecte', value: fmtDate(selected.derniere_collecte || selected.last_collection), color: '#06b6d4' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                      <item.icon size={13} color={item.color} /> {item.label}
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GPS */}
            {selected.latitude != null && selected.longitude != null && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} color="#3b82f6" /> Coordonnees GPS
                </p>
                <p style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, margin: 0, fontFamily: 'monospace' }}>
                  {Number(selected.latitude).toFixed(5)}, {Number(selected.longitude).toFixed(5)}
                </p>
              </div>
            )}

            {/* Capteurs */}
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={13} color="#10b981" /> Capteurs associes {linkedCapteurs.length > 0 && `(${linkedCapteurs.length})`}
              </p>
              {linkedCapteurs.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>Aucun capteur associe</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedCapteurs.map(cap => {
                    const tm = CAP_TYPE[cap.type] || { label: cap.type, Icon: Cpu, unit: '', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
                    const sm = CAP_STATUS[cap.statut] || CAP_STATUS.INACTIF;
                    const Icon = tm.Icon;
                    const battColor = cap.batterie > 50 ? '#16a34a' : cap.batterie > 20 ? '#ea580c' : '#ef4444';
                    return (
                      <div key={cap.id} onClick={() => navigate('/capteurs', { state: { selectedCapteurId: cap.id } })}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: tm.bg, color: tm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                            {cap.code_capteur || `Capteur #${cap.id?.toString().slice(0, 6)}`}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{tm.label}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: sm.color }}>● {sm.label}</span>
                            {cap.batterie != null && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.68rem', fontWeight: 600, color: battColor }}>
                                <Battery size={10} /> {cap.batterie}%
                              </span>
                            )}
                            {cap.valeur_actuelle != null && (
                              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>{cap.valeur_actuelle}{tm.unit}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: '#475569', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Signalements */}
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} color="#f59e0b" /> Signalements ({sigs.length})
              </p>
              {sigs.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>Aucun signalement</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sigs.slice(0, 5).map(s => {
                    const sm = SIG_STATUS[s.status] || SIG_STATUS.pending;
                    return (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${sm.c}18`, color: sm.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle size={14} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                            {s.description?.slice(0, 60) || 'Signalement'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: sm.c }}>● {sm.l}</span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {sigs.length > 5 && <p style={{ color: '#475569', fontSize: '0.75rem', margin: '4px 0 0' }}>+ {sigs.length - 5} autres</p>}
                </div>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 6px' }}>Notes</p>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{selected.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => openEdit(selected)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                <Edit2 size={14} /> Modifier
              </button>
              <button onClick={() => handleDelete(selected.id)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Empty state when nothing selected */}
        {!selected && !loading && containers.length > 0 && (
          <div style={{ flex: 0, display: 'none' }} />
        )}
      </div>

      {/* ── Form modal ─────────────────────────────────────────────── */}
      <ContainerForm
        show={showForm}
        editingContainer={editingContainer}
        zones={zones}
        onClose={() => { setShowForm(false); setEditingContainer(null); }}
        onSubmit={handleFormSubmit}
      />

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </PageShell>
  );
}
