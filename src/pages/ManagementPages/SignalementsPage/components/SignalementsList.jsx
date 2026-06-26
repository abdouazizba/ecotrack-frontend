import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle, List, MapPin } from 'lucide-react';
import Pagination from '../../../../components/common/Pagination';

const PAGE_SIZE = 20;

const STATUS_META = {
  pending:     { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: AlertCircle },
  in_progress: { label: 'En cours',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Icon: Clock },
  closed:      { label: 'Clôturé',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle },
  rejected:    { label: 'Rejeté',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: XCircle },
};

const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const PRIORITY_META = {
  critical: { label: 'Critique', color: '#ef4444' },
  high:     { label: 'Haute',    color: '#f97316' },
  medium:   { label: 'Normale',  color: '#3b82f6' },
  low:      { label: 'Basse',    color: '#22c55e' },
};

const SLA_LIMITS = { critical: 24, high: 48, medium: 120, low: 168 };

const getSlaOverdue = (sig) => {
  if (!sig.created_at || sig.status === 'closed' || sig.status === 'rejected') return false;
  const ageHours = (Date.now() - new Date(sig.created_at).getTime()) / 3600000;
  return ageHours > (SLA_LIMITS[sig.priority] || 168);
};

const FILTERS = [
  ['all', 'Tous'],
  ['pending', 'En attente'],
  ['in_progress', 'En cours'],
  ['closed', 'Clôturé'],
  ['rejected', 'Rejeté'],
];

function SigCard({ sig, selectedId, onSelect }) {
  const status   = STATUS_META[sig.status]   || STATUS_META.pending;
  const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
  const overdue  = getSlaOverdue(sig);
  const date = sig.created_at
    ? new Date(sig.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <button
      className={`sig-card ${selectedId === sig.id ? 'active' : ''} ${overdue ? 'sig-card-overdue' : ''}`}
      onClick={() => onSelect(sig.id)}
    >
      <div className="sigc-top">
        <span className="sigc-type">{TYPE_LABELS[sig.type] || sig.type || 'Signalement'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {overdue && (
            <span className="sig-sla-dot" title="Délai dépassé">
              <AlertTriangle size={11} color="#ef4444" />
            </span>
          )}
          <span className="sig-badge" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="sigc-meta">
        <span className="sig-priority-dot" style={{ background: priority.color }} />
        <span className="sigc-prio">{priority.label}</span>
        <span className="sigc-date">{date}</span>
      </div>
      {sig.description && <p className="sigc-desc">{sig.description}</p>}
    </button>
  );
}

export default function SignalementsList({
  signalements, allSignalements, selectedId, filter, loading,
  priorityFilter = 'all', search = '',
  zones = [], containers = [],
  onSelect, onFilterChange, onPriorityChange, onSearchChange,
  hideFilters = false,
}) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  useEffect(() => { setPage(1); }, [signalements, viewMode]);

  // Build lookup maps for zone grouping
  const conteneurZoneMap = useMemo(() => {
    const map = {};
    containers.forEach((c) => { if (c.id) map[c.id] = c.zoneId || null; });
    return map;
  }, [containers]);

  const zoneNameMap = useMemo(() => {
    const map = {};
    zones.forEach((z) => { if (z.id) map[z.id] = z.nom || z.name || z.id; });
    return map;
  }, [zones]);

  // Group signalements by zone (uses allSignalements in list mode filter pass)
  const byZone = useMemo(() => {
    if (viewMode !== 'by_zone') return null;
    const groups = {};
    signalements.forEach((s) => {
      const zid = s.id_zone || conteneurZoneMap[s.id_conteneur] || '__no_zone__';
      if (!groups[zid]) groups[zid] = [];
      groups[zid].push(s);
    });
    return groups;
  }, [signalements, viewMode, conteneurZoneMap]);

  // Paginated flat list
  const totalPages = Math.ceil(signalements.length / PAGE_SIZE);
  const paged = signalements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const zoneEntries = byZone
    ? Object.entries(byZone).sort(([a], [b]) => {
        if (a === '__no_zone__') return 1;
        if (b === '__no_zone__') return -1;
        return (zoneNameMap[a] || '').localeCompare(zoneNameMap[b] || '');
      })
    : [];

  return (
    <div className="sig-left">
      <div className="sig-left-header">
        <h2>Signalements</h2>
        <span className="sig-count-badge">{signalements.length}</span>
        <div className="sig-view-toggle">
          <button
            className={`sig-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="Vue liste"
          >
            <List size={14} />
          </button>
          <button
            className={`sig-view-btn ${viewMode === 'by_zone' ? 'active' : ''}`}
            onClick={() => setViewMode('by_zone')}
            title="Par zone"
          >
            <MapPin size={14} />
          </button>
        </div>
      </div>

      {!hideFilters && (
        <>
          <div className="sig-tabs">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={`sig-tab ${filter === key ? 'active' : ''}`}
                onClick={() => onFilterChange(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Recherche + filtre priorité */}
          <div style={{ display: 'flex', gap: 8, padding: '0 12px 10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{ flex: 1, minWidth: 120, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#e2e8f0', fontSize: '0.8rem', padding: '5px 10px', outline: 'none' }}
            />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange?.(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: '0.78rem', padding: '5px 8px', cursor: 'pointer' }}
            >
              <option value="all">Toutes priorités</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Normale</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </>
      )}

      <div className="sig-list">
        {loading && <p className="sig-empty">Chargement…</p>}
        {!loading && signalements.length === 0 && (
          <p className="sig-empty">Aucun signalement{filter !== 'all' ? ' dans ce statut' : ''}</p>
        )}

        {!loading && viewMode === 'list' && paged.map((sig) => (
          <SigCard key={sig.id} sig={sig} selectedId={selectedId} onSelect={onSelect} />
        ))}

        {!loading && viewMode === 'by_zone' && zoneEntries.map(([zid, sigs]) => (
          <div key={zid} className="sig-zone-group">
            <div className="sig-zone-header">
              <MapPin size={13} />
              <span>{zid === '__no_zone__' ? 'Zone non identifiée' : (zoneNameMap[zid] || zid)}</span>
              <span className="sig-zone-count">{sigs.length}</span>
            </div>
            {sigs.map((sig) => (
              <SigCard key={sig.id} sig={sig} selectedId={selectedId} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>

      {viewMode === 'list' && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={signalements.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
