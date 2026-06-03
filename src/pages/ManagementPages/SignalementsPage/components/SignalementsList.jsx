import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

export default function SignalementsList({
  signalements, selectedId, filter, loading,
  onSelect, onFilterChange,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [signalements]);

  const totalPages = Math.ceil(signalements.length / PAGE_SIZE);
  const paged = signalements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="sig-left">
      <div className="sig-left-header">
        <h2>Signalements</h2>
        <span className="sig-count-badge">{signalements.length}</span>
      </div>

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

      <div className="sig-list">
        {loading && <p className="sig-empty">Chargement…</p>}
        {!loading && signalements.length === 0 && (
          <p className="sig-empty">Aucun signalement{filter !== 'all' ? ' dans ce statut' : ''}</p>
        )}
        {paged.map((sig) => {
          const status   = STATUS_META[sig.status]   || STATUS_META.pending;
          const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
          const overdue  = getSlaOverdue(sig);
          const date = sig.created_at
            ? new Date(sig.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : '—';

          return (
            <button
              key={sig.id}
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
              {sig.description && (
                <p className="sigc-desc">{sig.description}</p>
              )}
            </button>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={signalements.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
