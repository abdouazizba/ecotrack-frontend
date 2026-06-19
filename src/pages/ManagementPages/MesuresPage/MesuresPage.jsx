import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, RefreshCw, Search, Thermometer, Battery, Wifi, Gauge, AlertTriangle } from 'lucide-react';
import { getCapteurs, getContainers, getZones } from '../../../services/api';

const TYPE_META = {
  REMPLISSAGE: { label: 'Remplissage', Icon: Gauge,       unit: '%',   color: '#3b82f6' },
  TEMPERATURE: { label: 'Température', Icon: Thermometer, unit: '°C',  color: '#f97316' },
  SIGNAL:      { label: 'Signal',      Icon: Wifi,        unit: 'dBm', color: '#8b5cf6' },
};

const STATUT_COLORS = {
  ACTIF: '#10b981', INACTIF: '#6b7280', EN_MAINTENANCE: '#f59e0b',
};

const REFRESH_INTERVAL = 30000;

function MiniGauge({ value, max = 100, color, size = 52 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
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

  // Filtres
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [zoneFilter, setZoneFilter]   = useState('all');
  const [criticalOnly, setCriticalOnly] = useState(false);

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

  // Auto-refresh
  useEffect(() => {
    const iv = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [load]);

  // Countdown timer
  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [lastRefresh]);

  // Lookups
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

  // Filtered capteurs
  const filtered = useMemo(() => {
    let list = capteurs;
    if (typeFilter !== 'all') list = list.filter(c => c.type === typeFilter);
    if (zoneFilter !== 'all') {
      list = list.filter(c => {
        const cont = contMap[c.id_conteneur];
        return cont?.zoneId === zoneFilter;
      });
    }
    if (criticalOnly) {
      list = list.filter(c => {
        if (c.type === 'REMPLISSAGE') return (c.valeur_actuelle ?? 0) > 80;
        if (c.batterie != null) return c.batterie < 20;
        return false;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const cont = contMap[c.id_conteneur];
        return (c.code_capteur || '').toLowerCase().includes(q)
          || (cont?.code_conteneur || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [capteurs, typeFilter, zoneFilter, criticalOnly, search, contMap]);

  // Stats
  const stats = useMemo(() => {
    const total = capteurs.length;
    const active = capteurs.filter(c => c.statut === 'ACTIF').length;
    const critical = capteurs.filter(c => c.type === 'REMPLISSAGE' && (c.valeur_actuelle ?? 0) > 80).length;
    const lowBatt = capteurs.filter(c => c.batterie != null && c.batterie < 20).length;
    return { total, active, critical, lowBatt };
  }, [capteurs]);

  const S = {
    page: { padding: 24, maxWidth: 1200, margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
    title: { fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
    refreshBar: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748b' },
    refreshBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.78rem' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 },
    statCard: (color) => ({ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }),
    statNum: (color) => ({ fontSize: '1.4rem', fontWeight: 800, color }),
    statLabel: { fontSize: '0.75rem', color: '#64748b' },
    controls: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
    searchInput: { flex: '1 1 180px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: '0.82rem', padding: '7px 12px', outline: 'none' },
    select: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: '0.78rem', padding: '6px 10px', cursor: 'pointer' },
    toggleBtn: (a) => ({ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: a ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: a ? '#ef4444' : '#94a3b8' }),
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
    card: { background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' },
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}><Activity size={22} color="#3b82f6" /> Mesures IoT</h1>
        <div style={S.refreshBar}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          <span>Refresh dans {countdown}s</span>
          <button style={S.refreshBtn} onClick={() => { setLoading(true); load(); }}>
            <RefreshCw size={12} /> Rafraîchir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={S.statsRow}>
        <div style={S.statCard('#3b82f6')}>
          <span style={S.statNum('#3b82f6')}>{stats.total}</span>
          <span style={S.statLabel}>Capteurs total</span>
        </div>
        <div style={S.statCard('#10b981')}>
          <span style={S.statNum('#10b981')}>{stats.active}</span>
          <span style={S.statLabel}>Actifs</span>
        </div>
        <div style={S.statCard('#ef4444')}>
          <span style={S.statNum('#ef4444')}>{stats.critical}</span>
          <span style={S.statLabel}>Remplissage critique</span>
        </div>
        <div style={S.statCard('#f59e0b')}>
          <span style={S.statNum('#f59e0b')}>{stats.lowBatt}</span>
          <span style={S.statLabel}>Batterie faible</span>
        </div>
      </div>

      {/* Filtres */}
      <div style={S.controls}>
        <input placeholder="Rechercher capteur ou conteneur…" value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={S.select}>
          <option value="all">Tous types</option>
          <option value="REMPLISSAGE">Remplissage</option>
          <option value="TEMPERATURE">Température</option>
          <option value="SIGNAL">Signal</option>
        </select>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={S.select}>
          <option value="all">Toutes zones</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.nom || z.name}</option>)}
        </select>
        <button style={S.toggleBtn(criticalOnly)} onClick={() => setCriticalOnly(!criticalOnly)}>
          <AlertTriangle size={11} /> Critiques uniquement
        </button>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      {/* Grille */}
      <div style={S.grid}>
        {filtered.map(cap => {
          const tm = TYPE_META[cap.type] || TYPE_META.REMPLISSAGE;
          const Icon = tm.Icon;
          const cont = contMap[cap.id_conteneur];
          const zoneName = cont?.zoneId ? zoneMap[cont.zoneId] : null;
          const val = cap.valeur_actuelle ?? cap.derniere_mesure?.taux_remplissage ?? null;
          const battColor = (cap.batterie ?? 100) > 50 ? '#10b981' : (cap.batterie ?? 100) > 20 ? '#f59e0b' : '#ef4444';
          const isCritical = cap.type === 'REMPLISSAGE' && val != null && val > 80;

          return (
            <div key={cap.id} style={{ ...S.card, borderColor: isCritical ? 'rgba(239,68,68,0.4)' : undefined }}>
              {isCritical && (
                <div style={{ position: 'absolute', top: 8, right: 10, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <AlertTriangle size={10} /> CRITIQUE
                </div>
              )}

              {/* Code capteur + type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tm.color}18`, color: tm.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} />
                </div>
                <div>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>{cap.code_capteur}</p>
                  <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0 }}>{tm.label}</p>
                </div>
              </div>

              {/* Jauge */}
              {val != null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <MiniGauge value={val} max={cap.type === 'REMPLISSAGE' ? 100 : cap.type === 'TEMPERATURE' ? 60 : 0} color={isCritical ? '#ef4444' : tm.color} />
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isCritical ? '#ef4444' : '#e2e8f0' }}>{Math.round(val)}</span>
                    <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 3 }}>{tm.unit}</span>
                  </div>
                </div>
              )}

              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                {cont && <span>📦 {cont.code_conteneur || cont.name}</span>}
                {zoneName && <span>📍 {zoneName}</span>}
                {cap.batterie != null && (
                  <span style={{ color: battColor, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Battery size={11} /> {cap.batterie}%
                  </span>
                )}
                <span style={{ color: STATUT_COLORS[cap.statut] || '#6b7280' }}>● {cap.statut}</span>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: '#475569', marginTop: 48, fontSize: '0.9rem' }}>
          Aucun capteur trouvé{criticalOnly ? ' en état critique' : ''}
        </p>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
