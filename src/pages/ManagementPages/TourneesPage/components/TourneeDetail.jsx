import React from 'react';
import {
  Plus, Trash2, Clock, CheckCircle, MapPin, Calendar,
  UserCheck, AlertTriangle, Package, X, User, Edit2,
} from 'lucide-react';
import { TOURNEE_STATUS, TYPE_LABELS, PRIORITY_META } from '../utils/constants';

export default function TourneeDetail({
  tournee,
  agents,
  onStatusChange,
  onDelete,
  onAgentChange,
  onAddSigClick,
  onAssignClick,
  onRemoveSignalement,
  onEditClick,
}) {
  if (!tournee) {
    return (
      <div className="tr-empty">
        <Package size={48} strokeWidth={1.2} />
        <p>Sélectionnez une tournée ou créez-en une nouvelle</p>
      </div>
    );
  }

  const statusMeta   = TOURNEE_STATUS[tournee.status] || TOURNEE_STATUS.pending;
  const sigs         = tournee.signalements || [];
  const total        = sigs.length;
  const closedCount  = sigs.filter((s) => s.status === 'closed').length;
  const progress     = total > 0 ? Math.round((closedCount / total) * 100) : 0;
  const allDone      = total > 0 && closedCount === total;

  return (
    <div className="tr-detail">
      {/* suggestion complétion automatique */}
      {tournee.status === 'in_progress' && allDone && (
        <div className="tr-completion-banner">
          <CheckCircle size={15} />
          <span>Tous les signalements sont traités —</span>
          <button onClick={() => onStatusChange(tournee.id, 'done')}>
            Marquer comme terminée
          </button>
        </div>
      )}

      {/* header */}
      <div className="tr-header">
        <div className="trh-left">
          <h2>{tournee.titre}</h2>
          <div className="trh-meta">
            <span><MapPin size={14} /> {tournee.zone_nom || '—'}</span>
            <span><Calendar size={14} /> {tournee.date_prevue || '—'}</span>
            <span className="t-badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
              {statusMeta.label}
            </span>
          </div>
        </div>
        <div className="trh-actions">
          {tournee.status === 'pending' && (
            <button className="tr-btn-status" onClick={() => onStatusChange(tournee.id, 'in_progress')}>
              <Clock size={14} /> Démarrer
            </button>
          )}
          {tournee.status === 'in_progress' && (
            <button className="tr-btn-status tr-btn-done" onClick={() => onStatusChange(tournee.id, 'done')}>
              <CheckCircle size={14} /> Terminer
            </button>
          )}
          {onEditClick && (tournee.status === 'pending' || tournee.status === 'in_progress') && (
            <button className="tr-btn-edit" onClick={() => onEditClick(tournee)} title="Modifier la tournée">
              <Edit2 size={15} />
            </button>
          )}
          <button className="tr-btn-delete" onClick={() => onDelete(tournee.id)} title="Supprimer la tournée">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* agent responsable */}
      <div className="tr-agent-section">
        <div className="tras-label">
          <UserCheck size={16} />
          <span>Agent responsable</span>
        </div>
        <select
          className="tras-select"
          value={tournee.agent_id || ''}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          <option value="">— Non assigné —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.firstName} {a.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* barre de progression */}
      {total > 0 && (
        <div className="tr-progress">
          <div className="tr-progress-label">
            <span>Traitement</span>
            <span>{closedCount} / {total} ({progress}%)</span>
          </div>
          <div className="tr-progress-bar">
            <div
              className="tr-progress-fill"
              style={{ width: `${progress}%`, background: progress === 100 ? '#10b981' : '#3b82f6' }}
            />
          </div>
        </div>
      )}

      {/* signalements */}
      <div className="tr-sigs-header">
        <h3>
          <AlertTriangle size={16} />
          Signalements ({total})
        </h3>
        <button className="tl-btn-new" onClick={onAddSigClick}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {total === 0 ? (
        <div className="tr-sigs-empty">
          <Package size={32} strokeWidth={1.2} />
          <p>Aucun signalement — cliquez sur Ajouter pour en inclure</p>
        </div>
      ) : (
        <div className="tr-sigs-list">
          {sigs.map((sig) => {
            const priority = PRIORITY_META[sig.priority] || PRIORITY_META.medium;
            return (
              <div key={sig.id} className="sig-card">
                <div className="sig-card-top">
                  <div className="sig-info">
                    <span className="sig-type">{TYPE_LABELS[sig.type] || sig.type}</span>
                    <span className="t-badge" style={{ color: priority.color, background: `${priority.color}18` }}>
                      {priority.label}
                    </span>
                  </div>
                  <button
                    className="sig-btn-remove"
                    onClick={() => onRemoveSignalement(sig.id)}
                    title="Retirer ce signalement"
                  >
                    <X size={14} />
                  </button>
                </div>
                {sig.description && <p className="sig-desc">{sig.description}</p>}
                <div className="sig-footer">
                  <span className="sig-agent">
                    <User size={12} />
                    {sig.assigned_agent_nom || 'Non assigné'}
                  </span>
                  <button
                    className="sig-btn-assign"
                    onClick={() => onAssignClick(sig)}
                  >
                    <UserCheck size={13} />
                    {sig.assigned_agent_id ? 'Réassigner' : 'Assigner'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
