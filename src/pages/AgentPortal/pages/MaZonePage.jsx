import React, { useEffect, useState, useMemo } from 'react';
import { Package, CheckCircle, Wrench, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getAgentZoneContainers } from '../../../services/api';
import useAuthStore from '../../../store/authStore';

const PAGE_SIZE = 12;

const STATUT_META = {
  actif:       { label: 'Actif',       color: '#10b981' },
  maintenance: { label: 'Maintenance', color: '#f59e0b' },
  retire:      { label: 'Retiré',      color: '#ef4444' },
};

const TYPE_LABELS = {
  standard:  'Standard',
  selective: 'Sélectif',
  organic:   'Organique',
  hazardous: 'Dangereux',
};

const S = {
  page:  { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  title: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, flex: 1 },
  counter: { fontSize: '0.8rem', color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 20 },
  controls: { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' },
  searchWrap: { position: 'relative', flex: '1 1 180px', minWidth: 0 },
  searchIcon: { position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' },
  searchInput: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#e2e8f0', fontSize: '0.85rem', padding: '7px 10px 7px 32px',
    outline: 'none',
  },
  filterBtn: (active) => ({
    padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: '0.78rem', fontWeight: 600,
    background: active ? '#3b82f6' : 'rgba(255,255,255,0.06)',
    color:      active ? '#fff'    : '#94a3b8',
    transition: 'all 0.15s',
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  card: {
    background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: '#7dd3fc', fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 600 },
  badge: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
    background: `${color}1a`, color: color,
  }),
  type: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem' },
  meta: { color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6 },
  empty: { textAlign: 'center', color: '#475569', padding: '48px 0', fontSize: '0.9rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 },
  pageBtn: (disabled) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: disabled ? '#334155' : '#94a3b8',
    cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
  }),
  pageInfo: { color: '#64748b', fontSize: '0.82rem', minWidth: 90, textAlign: 'center' },
};

export default function MaZonePage() {
  const { user } = useAuthStore();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    if (!user?.id) return;
    getAgentZoneContainers(user.id)
      .then((data) => setContainers(Array.isArray(data) ? data : []))
      .catch(() => setError('Impossible de charger les conteneurs de votre zone'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = filter === 'all' ? containers : containers.filter((c) => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.code_conteneur || '').toLowerCase().includes(q) ||
          (TYPE_LABELS[c.type] || c.type || '').toLowerCase().includes(q) ||
          (c.zone_nom || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [containers, filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (f) => { setFilter(f); setPage(1); };
  const changeSearch = (v) => { setSearch(v); setPage(1); };

  if (loading) return <div style={{ padding: 24, color: '#64748b' }}>Chargement…</div>;
  if (error)   return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <Package size={20} color="#3b82f6" />
        <h1 style={S.title}>Tous les conteneurs</h1>
        <span style={S.counter}>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={S.controls}>
        <div style={S.searchWrap}>
          <Search size={14} style={S.searchIcon} />
          <input
            style={S.searchInput}
            placeholder="Rechercher par code, type, zone…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
        {['all', 'actif', 'maintenance', 'retire'].map((f) => (
          <button key={f} style={S.filterBtn(filter === f)} onClick={() => changeFilter(f)}>
            {f === 'all' ? 'Tous' : STATUT_META[f]?.label || f}
          </button>
        ))}
      </div>

      {paged.length === 0 ? (
        <p style={S.empty}>Aucun conteneur dans cette catégorie.</p>
      ) : (
        <div style={S.grid}>
          {paged.map((c) => {
            const meta = STATUT_META[c.status] || STATUT_META.actif;
            return (
              <div key={c.id} style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.code}>{c.code_conteneur || c.id?.slice(0, 8)}</span>
                  <span style={S.badge(meta.color)}>{meta.label}</span>
                </div>
                <p style={S.type}>{TYPE_LABELS[c.type] || c.type || 'Standard'}</p>
                <div style={S.meta}>
                  {c.zone_nom && <div>Zone : <span style={{ color: '#cbd5e1' }}>{c.zone_nom}</span></div>}
                  {(c.latitude && c.longitude) && (
                    <div>{parseFloat(c.latitude).toFixed(4)}, {parseFloat(c.longitude).toFixed(4)}</div>
                  )}
                  {c.fillLevel != null && (
                    <div>Remplissage : <span style={{ color: c.fillLevel >= 80 ? '#ef4444' : c.fillLevel >= 50 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{c.fillLevel}%</span></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div style={S.pagination}>
          <button
            style={S.pageBtn(safePage === 1)}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={S.pageInfo}>Page {safePage} / {totalPages}</span>
          <button
            style={S.pageBtn(safePage === totalPages)}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
