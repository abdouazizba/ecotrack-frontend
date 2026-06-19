import React, { useState, useEffect, useCallback } from 'react';
import { getSignalementsCitoyen } from '../../../services/api';
import useAuthStore from '../../../store/authStore';
import { AlertCircle, Clock, CheckCircle, XCircle, RefreshCw, Image } from 'lucide-react';

const TYPE_LABELS = {
  full:        { label: 'Conteneur plein',    emoji: '🗑️' },
  overflowing: { label: 'Débordement',         emoji: '⚠️' },
  damaged:     { label: 'Endommagé',           emoji: '🔧' },
  smell:       { label: 'Mauvaise odeur',      emoji: '👃' },
  other:       { label: 'Autre',               emoji: '📝' },
};

const STATUS_CONFIG = {
  pending:     { label: 'Ouvert',      badgeClass: 'cp-badge-open',     Icon: AlertCircle },
  in_progress: { label: 'En cours',    badgeClass: 'cp-badge-progress', Icon: Clock },
  closed:      { label: 'Résolu',      badgeClass: 'cp-badge-closed',   Icon: CheckCircle },
  rejected:    { label: 'Rejeté',      badgeClass: 'cp-badge-rejected', Icon: XCircle },
};

const PRIORITY_LABELS = {
  low:      { label: 'Basse',    color: 'rgba(255,255,255,0.4)' },
  medium:   { label: 'Normale',  color: '#34d399' },
  high:     { label: 'Haute',    color: '#fbbf24' },
  critical: { label: 'Critique', color: '#ef4444' },
};

const FILTERS = [
  { key: 'all',         label: 'Tous' },
  { key: 'pending',     label: 'Ouverts' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'closed',      label: 'Résolus' },
  { key: 'rejected',    label: 'Rejetés' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MesSignalementsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSignalementsCitoyen(user.id);
      setItems(data);
    } catch {
      setError('Impossible de charger vos signalements.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? items : items.filter((s) => s.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = f.key === 'all' ? items.length : items.filter((s) => s.status === f.key).length;
    return acc;
  }, {});

  return (
    <div className="msp-page">
      {/* Header */}
      <div className="msp-header">
        <div>
          <h2 className="msp-title">Mes signalements</h2>
          <p className="msp-sub">{items.length} signalement{items.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className="cp-btn-ghost msp-refresh" onClick={load} title="Actualiser">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter pills */}
      <div className="msp-filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`msp-filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {counts[key] > 0 && <span className="msp-filter-count">{counts[key]}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div className="cp-loading"><span className="cp-spin" /><span>Chargement…</span></div>
      )}
      {error && !loading && (
        <div className="msp-error">{error}</div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="cp-empty">
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <span>Aucun signalement{filter !== 'all' ? ' dans cette catégorie' : ''}.</span>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="msp-list">
          {filtered.map((s) => {
            const cfg    = STATUS_CONFIG[s.status]  || STATUS_CONFIG.pending;
            const typeInfo = TYPE_LABELS[s.type]   || { label: s.type, emoji: '📝' };
            const prio   = PRIORITY_LABELS[s.priority];
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} className={`msp-card cp-card ${isOpen ? 'open' : ''}`}>
                <button className="msp-card-header" onClick={() => setExpanded(isOpen ? null : s.id)}>
                  <span className="msp-card-emoji">{typeInfo.emoji}</span>
                  <div className="msp-card-info">
                    <span className="msp-card-type">{typeInfo.label}</span>
                    <span className="msp-card-date">{formatDate(s.created_at || s.date_creation)}</span>
                  </div>
                  <div className="msp-card-right">
                    <span className={`cp-badge ${cfg.badgeClass}`}>
                      <cfg.Icon size={11} />{cfg.label}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="msp-card-body">
                    {s.description && <p className="msp-card-desc">"{s.description}"</p>}
                    {prio && (
                      <div className="msp-card-meta">
                        <span style={{ color: prio.color }}>● Priorité {prio.label}</span>
                      </div>
                    )}
                    {s.photo_url && (
                      <div className="msp-card-photo-wrap">
                        <Image size={12} color="rgba(255,255,255,0.4)" />
                        <img src={s.photo_url} alt="signalement" className="msp-card-photo" />
                      </div>
                    )}
                    {s.notes_resolution && (
                      <div className="msp-card-notes">
                        <strong>Note de résolution :</strong> {s.notes_resolution}
                      </div>
                    )}
                    {s.status === 'rejected' && s.motif_rejet && (
                      <div className="msp-card-notes" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                        <strong style={{ color: '#ef4444' }}>Motif du rejet :</strong> {s.motif_rejet}
                      </div>
                    )}
                    {s.status === 'rejected' && !s.motif_rejet && s.notes_resolution && (
                      <div className="msp-card-notes" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                        <strong style={{ color: '#ef4444' }}>Motif du rejet :</strong> {s.notes_resolution}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .msp-page { padding: 1.5rem 1.5rem 2rem; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
        .msp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
        .msp-title { margin: 0; font-size: 1.3rem; font-weight: 700; color: white; }
        .msp-sub   { margin: 0.2rem 0 0; font-size: 0.82rem; color: rgba(255,255,255,0.45); }
        .msp-refresh { padding: 0.45rem 0.7rem; }
        .msp-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .msp-filter-btn { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); border-radius: 999px; color: rgba(255,255,255,0.55); font-size: 0.8rem; padding: 0.35rem 0.9rem; cursor: pointer; transition: all 0.15s; }
        .msp-filter-btn:hover { background: rgba(255,255,255,0.11); color: white; }
        .msp-filter-btn.active { background: rgba(52,211,153,0.18); border-color: rgba(52,211,153,0.4); color: #6ee7b7; }
        .msp-filter-count { background: rgba(255,255,255,0.12); border-radius: 999px; font-size: 0.7rem; padding: 0 0.35rem; font-weight: 700; }
        .msp-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); border-radius: 14px; color: #fca5a5; padding: 1rem; font-size: 0.88rem; text-align: center; }
        .msp-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .msp-card { overflow: hidden; }
        .msp-card.open { border-color: rgba(52,211,153,0.3); }
        .msp-card-header { display: flex; align-items: center; gap: 0.75rem; width: 100%; background: none; border: none; cursor: pointer; padding: 1rem 1.1rem; text-align: left; color: white; }
        .msp-card-emoji { font-size: 1.5rem; flex-shrink: 0; }
        .msp-card-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .msp-card-type { font-size: 0.9rem; font-weight: 600; color: white; }
        .msp-card-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .msp-card-right { flex-shrink: 0; }
        .msp-card-body { padding: 0 1.1rem 1rem; display: flex; flex-direction: column; gap: 0.65rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem; }
        .msp-card-desc { margin: 0; font-size: 0.88rem; color: rgba(255,255,255,0.6); font-style: italic; line-height: 1.5; }
        .msp-card-meta { font-size: 0.8rem; }
        .msp-card-photo-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
        .msp-card-photo { width: 100%; max-height: 180px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
        .msp-card-notes { background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2); border-radius: 10px; padding: 0.6rem 0.9rem; font-size: 0.83rem; color: rgba(255,255,255,0.65); }
      `}</style>
    </div>
  );
}
