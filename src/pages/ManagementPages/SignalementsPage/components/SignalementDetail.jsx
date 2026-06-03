import React from 'react';
import {
  AlertCircle, Clock, CheckCircle, XCircle, Trash2,
  MapPin, Package, Tag, Calendar, ArrowRight, RotateCcw,
} from 'lucide-react';

const STATUS_META = {
  pending:     { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', Icon: AlertCircle },
  in_progress: { label: 'En cours',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Icon: Clock },
  closed:      { label: 'Clôturé',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle },
  rejected:    { label: 'Rejeté',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: XCircle },
};

const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const PRIORITY_META = {
  critical: { label: 'Critique', color: '#ef4444' },
  high:     { label: 'Haute',    color: '#f97316' },
  medium:   { label: 'Normale',  color: '#3b82f6' },
  low:      { label: 'Basse',    color: '#22c55e' },
};

export default function SignalementDetail({ signalement, onStatusChange, onDelete }) {
  if (!signalement) {
    return (
      <div className="sig-detail-empty">
        <AlertCircle size={48} strokeWidth={1.2} />
        <p>Sélectionnez un signalement pour voir ses détails</p>
      </div>
    );
  }

  const status = STATUS_META[signalement.status] || STATUS_META.pending;
  const priority = PRIORITY_META[signalement.priority] || PRIORITY_META.medium;
  const StatusIcon = status.Icon;

  const date = signalement.created_at
    ? new Date(signalement.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <div className="sig-detail">
      {/* header */}
      <div className="sig-detail-header">
        <div className="sdh-left">
          <h2>{TYPE_LABELS[signalement.type] || signalement.type || 'Signalement'}</h2>
          <div className="sdh-badges">
            <span className="sig-badge" style={{ color: status.color, background: status.bg }}>
              <StatusIcon size={12} /> {status.label}
            </span>
            <span className="sig-badge" style={{ color: priority.color, background: `${priority.color}18` }}>
              {priority.label}
            </span>
          </div>
        </div>
        <button
          className="sig-btn-delete"
          onClick={() => window.confirm('Supprimer ce signalement ?') && onDelete(signalement.id)}
          title="Supprimer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* meta */}
      <div className="sig-detail-meta">
        <span><Calendar size={14} /> {date}</span>
        {signalement.id_conteneur && (
          <span><Package size={14} /> Conteneur #{signalement.id_conteneur.toString().slice(0, 8)}</span>
        )}
        {(signalement.latitude || signalement.longitude) && (
          <span><MapPin size={14} /> {signalement.latitude?.toFixed(4)}, {signalement.longitude?.toFixed(4)}</span>
        )}
      </div>

      {/* photo */}
      {signalement.photo_url && (
        <div className="sig-detail-photo">
          <img
            src={signalement.photo_url}
            alt="Photo du signalement"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* description */}
      <div className="sig-detail-section">
        <h3><Tag size={14} /> Description</h3>
        <p>{signalement.description || 'Aucune description fournie.'}</p>
      </div>

      {/* actions */}
      <div className="sig-detail-section">
        <h3>Changer le statut</h3>
        <div className="sig-actions">
          {signalement.status !== 'pending' && (
            <button
              className="sig-action-btn sig-action-reopen"
              onClick={() => onStatusChange(signalement.id, 'pending')}
            >
              <RotateCcw size={14} /> Réouvrir
            </button>
          )}
          {signalement.status === 'pending' && (
            <button
              className="sig-action-btn sig-action-progress"
              onClick={() => onStatusChange(signalement.id, 'in_progress')}
            >
              <ArrowRight size={14} /> Prendre en charge
            </button>
          )}
          {signalement.status === 'in_progress' && (
            <button
              className="sig-action-btn sig-action-close"
              onClick={() => onStatusChange(signalement.id, 'closed')}
            >
              <CheckCircle size={14} /> Clôturer
            </button>
          )}
          {(signalement.status === 'pending' || signalement.status === 'in_progress') && (
            <button
              className="sig-action-btn sig-action-reject"
              onClick={() => onStatusChange(signalement.id, 'rejected')}
            >
              <XCircle size={14} /> Rejeter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
