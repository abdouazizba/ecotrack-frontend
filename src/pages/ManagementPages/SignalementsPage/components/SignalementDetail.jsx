import React, { useState } from 'react';
import {
  AlertCircle, Clock, CheckCircle, XCircle, Trash2,
  MapPin, Package, Tag, Calendar, ArrowRight, RotateCcw,
  AlertTriangle, Image, History, Route, Plus,
} from 'lucide-react';
import SignalementAudit from './SignalementAudit';

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

const SLA_LIMITS = { critical: 24, high: 48, medium: 120, low: 168 };

function getSlaWarning(sig) {
  if (!sig.created_at) return null;
  if (sig.status === 'closed' || sig.status === 'rejected') return null;
  const ageHours = (Date.now() - new Date(sig.created_at).getTime()) / 3600000;
  const limit = SLA_LIMITS[sig.priority] || 168;
  if (ageHours <= limit) return null;
  const days = Math.floor(ageHours / 24);
  return days > 0 ? `${days}j de retard` : `${Math.floor(ageHours)}h de retard`;
}

export default function SignalementDetail({ signalement, agents = [], tournees = [], onStatusChange, onDelete, onAgentAssign, onAddToTournee }) {
  const [rejectMode, setRejectMode]   = useState(false);
  const [motifRejet, setMotifRejet]   = useState('');
  const [closeMode, setCloseMode]     = useState(false);
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [closeNotes, setCloseNotes]   = useState('');
  const [showAudit, setShowAudit]     = useState(false);

  if (!signalement) {
    return (
      <div className="sig-detail-empty">
        <AlertCircle size={48} strokeWidth={1.2} />
        <p>Sélectionnez un signalement pour voir ses détails</p>
      </div>
    );
  }

  const status     = STATUS_META[signalement.status] || STATUS_META.pending;
  const priority   = PRIORITY_META[signalement.priority] || PRIORITY_META.medium;
  const StatusIcon = status.Icon;
  const slaWarning = getSlaWarning(signalement);

  const date = signalement.created_at
    ? new Date(signalement.created_at).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const handleRejectConfirm = () => {
    if (!motifRejet.trim()) return;
    onStatusChange(signalement.id, 'rejected', motifRejet.trim());
    setRejectMode(false);
    setMotifRejet('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCloseConfirm = () => {
    onStatusChange(signalement.id, 'closed', undefined, photoFile, closeNotes.trim() || undefined);
    setCloseMode(false);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setCloseNotes('');
  };

  const resetForms = () => {
    setRejectMode(false);
    setCloseMode(false);
    setMotifRejet('');
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setCloseNotes('');
  };

  return (
    <div className="sig-detail">
      {/* SLA warning banner */}
      {slaWarning && (
        <div className="sig-sla-banner">
          <AlertTriangle size={14} />
          <span>Délai dépassé — {slaWarning}</span>
        </div>
      )}

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="sig-btn-audit"
            onClick={() => setShowAudit((v) => !v)}
            title="Historique d'activité"
          >
            <History size={15} />
          </button>
          <button
            className="sig-btn-delete"
            onClick={() => window.confirm('Supprimer ce signalement ?') && onDelete(signalement.id)}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
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

      {/* photo signalement */}
      {signalement.photo_url && (
        <div className="sig-detail-photo">
          <img
            src={signalement.photo_url}
            alt="Signalement"
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* description */}
      <div className="sig-detail-section">
        <h3><Tag size={14} /> Description</h3>
        <p>{signalement.description || 'Aucune description fournie.'}</p>
      </div>

      {/* photo résolution */}
      {signalement.status === 'closed' && signalement.photo_resolution_url && (
        <div className="sig-detail-section">
          <h3><Image size={14} /> Photo de résolution</h3>
          <div className="sig-detail-photo">
            <img
              src={signalement.photo_resolution_url}
              alt="Preuve de résolution"
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
        </div>
      )}

      {/* motif rejet */}
      {signalement.status === 'rejected' && signalement.motif_rejet && (
        <div className="sig-detail-section sig-reject-reason">
          <h3><XCircle size={14} /> Motif du rejet</h3>
          <p>{signalement.motif_rejet}</p>
        </div>
      )}

      {/* tournée liée */}
      <div className="sig-detail-section">
        <h3><Route size={14} /> Tournée</h3>
        {signalement.id_tournee ? (() => {
          const t = tournees.find((tr) => tr.id === signalement.id_tournee);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
              <Route size={14} color="#3b82f6" />
              <span style={{ color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                {t ? (t.titre || t.code || `Tournée #${t.id.slice(0, 8)}`) : `Tournée #${signalement.id_tournee.slice(0, 8)}`}
              </span>
              {t && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  {t.date_prevue ? new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                </span>
              )}
            </div>
          );
        })() : (
          <>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', margin: '0 0 8px' }}>
              Ce signalement n'est rattaché à aucune tournée.
            </p>
            {onAddToTournee && tournees.filter((t) => t.status === 'pending' || t.status === 'in_progress').length > 0 && (
              <select
                className="sig-agent-select"
                value=""
                onChange={(e) => { if (e.target.value) onAddToTournee(signalement.id, e.target.value); }}
              >
                <option value="">— Ajouter à une tournée —</option>
                {tournees
                  .filter((t) => t.status === 'pending' || t.status === 'in_progress')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titre || t.code || `Tournée #${t.id.slice(0, 8)}`}
                      {t.date_prevue ? ` — ${new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                      {t.status === 'in_progress' ? ' (en cours)' : ''}
                    </option>
                  ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* actions */}
      <div className="sig-detail-section">
        <h3>Changer le statut</h3>

        {rejectMode ? (
          <div className="sig-reject-form">
            <label>Motif du rejet *</label>
            <textarea
              className="sig-reject-textarea"
              rows={3}
              placeholder="Expliquez la raison du rejet…"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              autoFocus
            />
            <div className="sig-reject-actions">
              <button className="sig-action-btn sig-action-cancel" onClick={resetForms}>
                Annuler
              </button>
              <button
                className="sig-action-btn sig-action-reject"
                onClick={handleRejectConfirm}
                disabled={!motifRejet.trim()}
              >
                <XCircle size={14} /> Confirmer le rejet
              </button>
            </div>
          </div>
        ) : closeMode ? (
          <div className="sig-close-form">
            <label>
              <Image size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Photo de preuve <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <label className="sig-close-file-label">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
                autoFocus
              />
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" className="sig-close-preview" />
              ) : (
                <div className="sig-close-file-placeholder">
                  <Image size={20} />
                  <span>Importer depuis l'appareil</span>
                </div>
              )}
            </label>

            <label style={{ marginTop: 12 }}>Notes (optionnel)</label>
            <textarea
              className="sig-reject-textarea"
              rows={2}
              placeholder="Notes de résolution…"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />

            <div className="sig-reject-actions">
              <button className="sig-action-btn sig-action-cancel" onClick={resetForms}>
                Annuler
              </button>
              <button
                className="sig-action-btn sig-action-close"
                onClick={handleCloseConfirm}
                disabled={!photoFile}
              >
                <CheckCircle size={14} /> Confirmer la clôture
              </button>
            </div>
          </div>
        ) : (
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
                onClick={() => setCloseMode(true)}
              >
                <CheckCircle size={14} /> Clôturer
              </button>
            )}
            {(signalement.status === 'pending' || signalement.status === 'in_progress') && (
              <button
                className="sig-action-btn sig-action-reject"
                onClick={() => setRejectMode(true)}
              >
                <XCircle size={14} /> Rejeter
              </button>
            )}
          </div>
        )}
      </div>

      {/* journal d'activité (accordéon) */}
      {showAudit && (
        <div className="sig-detail-section sig-audit-section">
          <h3><History size={14} /> Journal d'activité</h3>
          <SignalementAudit sigId={signalement.id} />
        </div>
      )}
    </div>
  );
}
