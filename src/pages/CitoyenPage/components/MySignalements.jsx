import React, { useState, useEffect, useCallback } from 'react';
import { getSignalementsCitoyen } from '../../../services/api';
import { Clock, CheckCircle, XCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  pending:     { label: 'Ouvert',      color: '#ea580c', bg: '#fff7ed', Icon: AlertCircle },
  in_progress: { label: 'En cours',    color: '#f59e0b', bg: '#fffbeb', Icon: Clock },
  closed:      { label: 'Clôturé',     color: '#10b981', bg: '#f0fdf4', Icon: CheckCircle },
  rejected:    { label: 'Rejeté',      color: '#6b7280', bg: '#f9fafb', Icon: XCircle },
};

const TYPE_LABELS = {
  full:        'Conteneur plein',
  overflowing: 'Débordement',
  damaged:     'Endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const PRIORITY_LABELS = {
  low:      { label: 'Basse',    color: '#6b7280' },
  medium:   { label: 'Normale',  color: '#3b82f6' },
  high:     { label: 'Haute',    color: '#f59e0b' },
  critical: { label: 'Critique', color: '#ef4444' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MySignalements({ userId }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSignalementsCitoyen(userId);
      setSignalements(data);
    } catch {
      setError('Impossible de charger vos signalements.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? signalements : signalements.filter((s) => s.status === filter);

  const counts = {
    all: signalements.length,
    pending: signalements.filter((s) => s.status === 'pending').length,
    in_progress: signalements.filter((s) => s.status === 'in_progress').length,
    closed: signalements.filter((s) => s.status === 'closed').length,
    rejected: signalements.filter((s) => s.status === 'rejected').length,
  };

  return (
    <div className="my-signals-container">
      <div className="my-signals-header">
        <div className="my-signals-title">
          <AlertCircle size={18} />
          <span>Mes signalements</span>
          <span className="my-signals-total">{signalements.length}</span>
        </div>
        <button className="my-signals-refresh" onClick={load} title="Actualiser">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="my-signals-filters">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'pending', label: 'Ouverts' },
          { key: 'in_progress', label: 'En cours' },
          { key: 'closed', label: 'Clôturés' },
          { key: 'rejected', label: 'Rejetés' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`my-signals-filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {counts[key] > 0 && <span className="filter-count">{counts[key]}</span>}
          </button>
        ))}
      </div>

      {loading && (
        <div className="my-signals-loading">
          <Loader size={20} className="spin" />
          <span>Chargement...</span>
        </div>
      )}

      {error && !loading && (
        <div className="my-signals-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="my-signals-empty">
          <span>Aucun signalement{filter !== 'all' ? ' dans cette catégorie' : ''}.</span>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="my-signals-list">
          {filtered.map((s) => {
            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
            const prio = PRIORITY_LABELS[s.priority];
            return (
              <div key={s.id} className="my-signal-card">
                <div className="my-signal-card-header">
                  <span className="my-signal-type">{TYPE_LABELS[s.type] || s.type}</span>
                  <span
                    className="my-signal-status"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    <cfg.Icon size={12} />
                    {cfg.label}
                  </span>
                </div>
                {s.description && (
                  <p className="my-signal-desc">{s.description}</p>
                )}
                <div className="my-signal-meta">
                  {prio && (
                    <span className="my-signal-priority" style={{ color: prio.color }}>
                      ● {prio.label}
                    </span>
                  )}
                  <span className="my-signal-date">{formatDate(s.created_at || s.date_creation)}</span>
                </div>
                {s.photo_url && (
                  <img src={s.photo_url} alt="signalement" className="my-signal-photo" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
