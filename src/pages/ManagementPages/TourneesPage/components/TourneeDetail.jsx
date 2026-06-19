import React from 'react';
import {
  Plus, Trash2, Clock, CheckCircle, MapPin, Calendar, XCircle,
  UserCheck, Users, AlertTriangle, Package, X, Timer, Edit2,
} from 'lucide-react';
import { TOURNEE_STATUS, TYPE_LABELS, PRIORITY_META } from '../utils/constants';

function parseDuration(debut, fin) {
  if (!debut || !fin) return null;
  const toSec = (t) => {
    const [h, m, s] = t.split(':').map(Number);
    return h * 3600 + m * 60 + (s || 0);
  };
  const diff = toSec(fin) - toSec(debut);
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function TourneeDetail({
  tournee,
  sigs: sigsProp,
  sigsLoading = false,
  agents,
  onStatusChange,
  onDelete,
  onAddSigClick,
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
  const sigs         = sigsProp ?? tournee.signalements ?? [];
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
            <>
              <button className="tr-btn-status" onClick={() => onStatusChange(tournee.id, 'in_progress')}>
                <Clock size={14} /> Démarrer
              </button>
              <button className="tr-btn-status" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }} onClick={() => { if (window.confirm('Annuler cette tournée ?')) onStatusChange(tournee.id, 'cancelled'); }}>
                <XCircle size={14} /> Annuler
              </button>
            </>
          )}
          {tournee.status === 'in_progress' && (
            <>
              <button className="tr-btn-status tr-btn-done" onClick={() => onStatusChange(tournee.id, 'done')}>
                <CheckCircle size={14} /> Terminer
              </button>
              <button className="tr-btn-status" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }} onClick={() => { if (window.confirm('Annuler cette tournée ?')) onStatusChange(tournee.id, 'cancelled'); }}>
                <XCircle size={14} /> Annuler
              </button>
            </>
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

      {/* équipe (lecture seule — assignée à la création) */}
      <div className="tr-team-section">
        {(() => {
          const allAgents = tournee.agents || [];
          const conducteurs = allAgents.filter((a) => a.role === 'CONDUCTEUR');
          const soutien = allAgents.filter((a) => a.role !== 'CONDUCTEUR');
          const resolveName = (a) => {
            const data = agents.find((ag) => String(ag.id) === String(a.id));
            return data ? `${data.firstName} ${data.lastName}` : `Agent ${String(a.id).slice(0, 8)}`;
          };

          return (
            <>
              <div className="tr-agent-section">
                <div className="tras-label">
                  <UserCheck size={16} />
                  <span>Équipe assignée</span>
                </div>
                {allAgents.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.84rem', margin: '6px 0 0' }}>
                    Aucun agent — modifiez la tournée pour assigner une équipe
                  </p>
                ) : (
                  <div className="tr-soutien-chips" style={{ marginTop: 6 }}>
                    {conducteurs.map((a) => (
                      <span key={a.id} className="tr-soutien-chip" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <UserCheck size={12} /> {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>responsable</span>
                      </span>
                    ))}
                    {soutien.map((a) => (
                      <span key={a.id} className="tr-soutien-chip">
                        {resolveName(a)} <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>soutien</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* suivi temps */}
      {(tournee.heure_debut || tournee.heure_fin) && (
        <div className="tr-time-section">
          <Timer size={15} />
          {tournee.heure_debut && (
            <span>Début : <strong>{tournee.heure_debut}</strong></span>
          )}
          {tournee.heure_fin && (
            <span>Fin : <strong>{tournee.heure_fin}</strong></span>
          )}
          {(() => {
            const dur = parseDuration(tournee.heure_debut, tournee.heure_fin);
            return dur ? <span className="tr-duration">Durée : <strong>{dur}</strong></span> : null;
          })()}
        </div>
      )}

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

      {sigsLoading ? (
        <div className="tr-sigs-empty">
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Chargement des signalements…</p>
        </div>
      ) : total === 0 ? (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
