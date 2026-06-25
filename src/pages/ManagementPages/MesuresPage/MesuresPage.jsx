import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity, RefreshCw, Search, Thermometer, Battery, Wifi, Gauge, AlertTriangle,
  ChevronLeft, ChevronRight, X, MapPin, Cpu, Clock,
} from 'lucide-react';
import { getCapteurs, getContainers, getZones } from '../../../services/api';

const TYPE_META = {
  REMPLISSAGE: { label: 'Remplissage', Icon: Gauge,       unit: '%',   color: '#3b82f6', max: 100 },
  TEMPERATURE: { label: 'Température', Icon: Thermometer, unit: '°C',  color: '#f97316', max: 60 },
  SIGNAL:      { label: 'Signal',      Icon: Wifi,        unit: 'dBm', color: '#8b5cf6', max: 0 },
};

const STATUT_META = {
  ACTIF:          { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  INACTIF:        { label: 'Inactif',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  EN_MAINTENANCE: { label: 'Maintenance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const REFRESH_INTERVAL = 30000;
const PAGE_SIZE = 15;

function MiniGauge({ value, max = 100, color, size = 56 }) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / (max || 100)) * 100));
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ * 0.75;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

export default function MesuresPage() {
  const [capteurs, setCapteurs]       = useState([]);
  const [containers, setContainers]   = useState([]);
  const [zones, setZones]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown]     = useState(REFRESH_INTERVAL / 1000);
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [zoneFilter, setZoneFilter]   = useState('all');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [page, setPage]               = useState(1);
  const [selected, setSelected]       = useState(null);

  const load = useCallback(async () => {
    try {
      const [capData, contData, zoneData] = await Promise.all([getCapteurs(), getContainers(), getZones()]);
      setCapteurs(Array.isArray(capData) ? capData : []);
      setContainers(Array.isArray(contData) ? contData : []);
      setZones(Array.isArray(zoneData) ? zoneData : []);
      setLastRefresh(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, REFRESH_INTERVAL); return () => clearInterval(iv); }, [load]);
  useEffect(() => { const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000); return () => clearInterval(iv); }, [lastRefresh]);

  const contMap = useMemo(() => {
    const m = {};
    containers.forEach(c => { m[c.id] = c; });
    return m;
  }, [containers]);

  const zoneMap = useMemo(() => {
    const m = {};
    zones.forEach(z => { m[z.id] = z.nom || z.name; });
    return m;
  }, [zones]);

  const getVal = (cap) => cap.valeur_actuelle ?? cap.derniere_mesure?.taux_remplissage ?? null;
  const isCritical = (cap) => cap.type === 'REMPLISSAGE' && getVal(cap) != null && getVal(cap) > 80;

  const filtered = useMemo(() => {
    let list = capteurs;
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (zoneFilter !== 'all') list = list.filter(c => contMap[c.id_conteneur]?.zoneId === zoneFilter);
    if (criticalOnly) list = list.filter(c => isCritical(c) || (c.batterie != null && c.batterie < 20));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.code_capteur || '').toLowerCase().includes(q) || (contMap[c.id_conteneur]?.code_conteneur || '').toLowerCase().includes(q));
    }
    return list;
  }, [capteurs, typeFilter, zoneFilter, criticalOnly, search, contMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [typeFilter, zoneFilter, criticalOnly, search]);
  useEffect(() => {
    if (selected && !filtered.find(c => c.id === selected.id)) setSelected(null);
  }, [filtered, selected]);

  const stats = useMemo(() => ({
    total: capteurs.length,
    active: capteurs.filter(c => c.statut === 'ACTIF').length,
    critical: capteurs.filter(c => isCritical(c)).length,
    lowBatt: capteurs.filter(c => c.batterie != null && c.batterie < 20).length,
  }), [capteurs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 20, gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Activity size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, flex: 1 }}>
          Mesures IoT <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#64748b' }}>({filtered.length})</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span>Refresh {countdown}s</span>
          <button onClick={() => { setLoading(true); load(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem' }}>
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6' },
          { label: 'Actifs', value: stats.active, color: '#10b981' },
          { label: 'Critiques', value: stats.critical, color: '#ef4444' },
          { label: 'Batterie faible', value: stats.lowBatt, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 110 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input placeholder="Rechercher capteur / conteneur…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.82rem', padding: '7px 12px 7px 32px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' }}>
          <option value="all">Tous types</option>
          <option value="REMPLISSAGE">Remplissage</option>
          <option value="TEMPERATURE">Température</option>
          <option value="SIGNAL">Signal</option>
        </select>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' }}>
          <option value="all">Toutes zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom || z.name}</option>)}
        </select>
        <button onClick={() => setCriticalOnly(!criticalOnly)}
          style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: criticalOnly ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: criticalOnly ? '#ef4444' : '#94a3b8' }}>
          <AlertTriangle size={11} /> Critiques
        </button>
      </div>

      {/* Dual panel */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>

        {/* Left — list */}
        <div style={{ flex: selected ? '0 0 400px' : 1, display: 'flex', flexDirection: 'column', minHeight: 0, transition: 'flex 0.2s' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
            {loading && <p style={{ color: '#64748b', padding: 20 }}>Chargement…</p>}
            {!loading && paginated.length === 0 && <p style={{ color: '#475569', textAlign: 'center', padding: 40 }}>Aucun capteur trouvé</p>}
            {paginated.map(cap => {
              const tm = TYPE_META[cap.type] || TYPE_META.REMPLISSAGE;
              const Icon = tm.Icon;
              const val = getVal(cap);
              const critical = isCritical(cap);
              const cont = contMap[cap.id_conteneur];
              const isSelected = selected?.id === cap.id;

              return (
                <div key={cap.id} onClick={() => setSelected(cap)}
                  style={{ background: isSelected ? 'rgba(59,130,246,0.08)' : '#1e2433', border: `1px solid ${critical ? 'rgba(239,68,68,0.3)' : isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${critical ? '#ef4444' : tm.color}15`, color: critical ? '#ef4444' : tm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.82rem' }}>{cap.code_capteur}</span>
                      <span style={{ fontSize: '0.68rem', color: tm.color, fontWeight: 600 }}>{tm.label}</span>
                      {critical && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.15)', padding: '1px 6px', borderRadius: 10 }}>CRITIQUE</span>}
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{cont?.code_conteneur || '—'}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {val != null && (
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: critical ? '#ef4444' : '#e2e8f0' }}>
                        {Math.round(val)}<span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: 2 }}>{tm.unit}</span>
                      </span>
                    )}
                    {cap.batterie != null && (
                      <div style={{ fontSize: '0.68rem', color: cap.batterie < 20 ? '#ef4444' : cap.batterie < 50 ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', marginTop: 2 }}>
                        <Battery size={10} /> {cap.batterie}%
                      </div>
                    )}
                  </div>
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ color: '#475569' }}>…</span>}
                  <button onClick={() => setPage(p)}
                    style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: page === p ? '#3b82f6' : 'rgba(255,255,255,0.06)', color: page === p ? '#fff' : '#94a3b8' }}>
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

        {/* Right — detail */}
        {selected && (() => {
          const tm = TYPE_META[selected.type] || TYPE_META.REMPLISSAGE;
          const Icon = tm.Icon;
          const val = getVal(selected);
          const critical = isCritical(selected);
          const cont = contMap[selected.id_conteneur];
          const zoneName = cont?.zoneId ? zoneMap[cont.zoneId] : null;
          const sm = STATUT_META[selected.statut] || STATUT_META.ACTIF;

          return (
            <div style={{ flex: 1, background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${critical ? '#ef4444' : tm.color}15`, color: critical ? '#ef4444' : tm.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>{selected.code_capteur}</p>
                    <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>{tm.label}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: sm.bg, color: sm.color }}>{sm.label}</span>
                {critical && <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>CRITIQUE</span>}
              </div>

              {/* Gauge center */}
              {val != null && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '16px 0' }}>
                  <MiniGauge value={Math.abs(val)} max={tm.max || 100} color={critical ? '#ef4444' : tm.color} size={80} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 800, color: critical ? '#ef4444' : '#e2e8f0' }}>{Math.round(val)}</span>
                    <span style={{ fontSize: '1rem', color: '#64748b', marginLeft: 4 }}>{tm.unit}</span>
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { icon: Cpu, label: 'Conteneur', value: cont?.code_conteneur || '—', color: '#3b82f6' },
                  { icon: MapPin, label: 'Zone', value: zoneName || '—', color: '#10b981' },
                  { icon: Battery, label: 'Batterie', value: selected.batterie != null ? `${selected.batterie}%` : '—', color: selected.batterie < 20 ? '#ef4444' : selected.batterie < 50 ? '#f59e0b' : '#10b981' },
                  { icon: Clock, label: 'Dernière mesure', value: selected.derniere_mesure?.date_mesure ? new Date(selected.derniere_mesure.date_mesure).toLocaleString('fr-FR') : '—', color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
                      <item.icon size={13} color={item.color} /> {item.label}
                    </div>
                    <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {cont && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 8px' }}>Conteneur associé</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{cont.code_conteneur}</span>
                    {cont.type_conteneur && <span style={{ color: '#94a3b8' }}>{cont.type_conteneur}</span>}
                    {cont.fillRate != null && <span style={{ color: cont.fillRate > 80 ? '#ef4444' : '#10b981' }}>Remplissage: {cont.fillRate}%</span>}
                    {zoneName && <span style={{ color: '#94a3b8' }}>{zoneName}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
