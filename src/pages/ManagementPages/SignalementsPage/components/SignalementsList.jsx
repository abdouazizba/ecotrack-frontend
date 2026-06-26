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
  low:      { label: 'Basse',    color: '#10b981' },
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
  const isSelected = selectedId === sig.id;
  const date = sig.created_at
    ? new Date(sig.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '—';

  const cardBorder = overdue
    ? 'rgba(239,68,68,0.3)'
    : isSelected
      ? 'rgba(59,130,246,0.4)'
      : 'rgba(255,255,255,0.08)';

  const cardBg = overdue && !isSelected
    ? 'rgba(239,68,68,0.04)'
    : isSelected
      ? 'rgba(59,130,246,0.08)'
      : '#1e2433';

  return (
    <div
      onClick={() => onSelect(sig.id)}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 10,
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {/* Top row: type + status badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.3 }}>
          {TYPE_LABELS[sig.type] || sig.type || 'Signalement'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {overdue && (
            <span title="Délai dépassé" style={{ display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={11} color="#ef4444" />
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 20,
            fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap',
            color: status.color, background: status.bg,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Meta row: priority dot + label + date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: priority.color,
        }} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
          {priority.label}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: 'auto' }}>
          {date}
        </span>
      </div>

      {/* Description preview */}
      {sig.description && (
        <p style={{
          fontSize: '0.72rem', color: '#64748b', margin: 0,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}>
          {sig.description}
        </p>
      )}
    </div>
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
    <div style={{
      display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
    }}>
      {/* Header: title + count + view toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px 10px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Signalements</h2>
        <span style={{
          background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 20, padding: '2px 10px',
          fontSize: '0.72rem', fontWeight: 700,
        }}>
          {signalements.length}
        </span>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {[
            { mode: 'list', Icon: List, title: 'Vue liste' },
            { mode: 'by_zone', Icon: MapPin, title: 'Par zone' },
          ].map(({ mode, Icon, title }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={title}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, border: 'none', borderRadius: 8,
                cursor: 'pointer', transition: 'all 0.15s',
                background: viewMode === mode ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                color: viewMode === mode ? '#fff' : '#64748b',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs + search (hidden when PageShell handles them) */}
      {!hideFilters && (
        <>
          <div style={{
            display: 'flex', flexWrap: 'wrap', padding: '8px 10px', gap: 4,
            borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0,
          }}>
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                style={{
                  padding: '5px 10px', border: 'none', borderRadius: 6,
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  background: filter === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: filter === key ? '#3b82f6' : '#64748b',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Recherche + filtre priorite */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 12px 10px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{
                flex: 1, minWidth: 120,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, color: '#e2e8f0',
                fontSize: '0.8rem', padding: '5px 10px', outline: 'none',
              }}
            />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityChange?.(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, color: '#94a3b8',
                fontSize: '0.78rem', padding: '5px 8px', cursor: 'pointer',
              }}
            >
              <option value="all">Toutes priorites</option>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Normale</option>
              <option value="low">Basse</option>
            </select>
          </div>
        </>
      )}

      {/* List area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.82rem', padding: '28px 0', margin: 0 }}>
            Chargement...
          </p>
        )}
        {!loading && signalements.length === 0 && (
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.82rem', padding: '28px 0', margin: 0 }}>
            Aucun signalement{filter !== 'all' ? ' dans ce statut' : ''}
          </p>
        )}

        {!loading && viewMode === 'list' && paged.map((sig) => (
          <SigCard key={sig.id} sig={sig} selectedId={selectedId} onSelect={onSelect} />
        ))}

        {!loading && viewMode === 'by_zone' && zoneEntries.map(([zid, sigs]) => (
          <div key={zid} style={{ marginBottom: 8 }}>
            {/* Zone group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px 6px',
              fontSize: '0.72rem', fontWeight: 700, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 4,
            }}>
              <MapPin size={13} color="#10b981" />
              <span>{zid === '__no_zone__' ? 'Zone non identifiee' : (zoneNameMap[zid] || zid)}</span>
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                fontSize: '0.68rem', padding: '1px 7px',
                borderRadius: 10, fontWeight: 700,
              }}>
                {sigs.length}
              </span>
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
