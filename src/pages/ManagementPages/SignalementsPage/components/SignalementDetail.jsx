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
  closed:      { label: 'Cloture',    color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle },
  rejected:    { label: 'Rejete',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  Icon: XCircle },
};

const TYPE_LABELS = {
  overflowing: 'Debordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommage',
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

const sectionTitle = {
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 10px',
};

const actionBtn = (bg, borderColor, color) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 8,
  border: `1px solid ${borderColor}`,
  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.15s', fontFamily: 'inherit',
  background: bg, color,
});

const infoCard = {
  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px',
};

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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 14,
        color: '#94a3b8', padding: 40,
      }}>
        <AlertCircle size={48} strokeWidth={1.2} />
        <p style={{ fontSize: '0.92rem', textAlign: 'center', margin: 0 }}>
          Selectionnez un signalement pour voir ses details
        </p>
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
    : '-';

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
    <div style={{
      background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: 24, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* SLA warning banner */}
      {slaWarning && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 14px', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8,
          color: '#ef4444', fontSize: '0.78rem', fontWeight: 600,
        }}>
          <AlertTriangle size={14} />
          <span>Delai depasse -- {slaWarning}</span>
        </div>
      )}

      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', margin: '0 0 10px' }}>
            {TYPE_LABELS[signalement.type] || signalement.type || 'Signalement'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 600,
              color: status.color, background: status.bg,
            }}>
              <StatusIcon size={12} /> {status.label}
            </span>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
              fontSize: '0.72rem', fontWeight: 600,
              color: priority.color, background: `${priority.color}18`,
            }}>
              {priority.label}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowAudit((v) => !v)}
            title="Historique d'activite"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#6366f1', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
          >
            <History size={15} />
          </button>
          <button
            onClick={() => window.confirm('Supprimer ce signalement ?') && onDelete(signalement.id)}
            title="Supprimer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* meta info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={infoCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
            <Calendar size={13} color="#8b5cf6" /> Date
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>{date}</p>
        </div>
        {signalement.id_conteneur && (
          <div style={infoCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
              <Package size={13} color="#3b82f6" /> Conteneur
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>
              #{signalement.id_conteneur.toString().slice(0, 8)}
            </p>
          </div>
        )}
        {(signalement.latitude || signalement.longitude) && (
          <div style={infoCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b', fontSize: '0.75rem' }}>
              <MapPin size={13} color="#10b981" /> Position
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>
              {signalement.latitude?.toFixed(4)}, {signalement.longitude?.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* photo signalement */}
      {signalement.photo_url && (
        <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 240 }}>
          <img
            src={signalement.photo_url}
            alt="Signalement"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      {/* description */}
      <div>
        <h3 style={{ ...sectionTitle }}>
          <Tag size={14} color="#10b981" /> Description
        </h3>
        <p style={{
          fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0,
          ...infoCard,
        }}>
          {signalement.description || 'Aucune description fournie.'}
        </p>
      </div>

      {/* photo resolution */}
      {signalement.status === 'closed' && signalement.photo_resolution_url && (
        <div>
          <h3 style={{ ...sectionTitle }}>
            <Image size={14} color="#10b981" /> Photo de resolution
          </h3>
          <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 240 }}>
            <img
              src={signalement.photo_resolution_url}
              alt="Preuve de resolution"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
          </div>
        </div>
      )}

      {/* motif rejet */}
      {signalement.status === 'rejected' && signalement.motif_rejet && (
        <div>
          <h3 style={{ ...sectionTitle, color: '#ef4444' }}>
            <XCircle size={14} /> Motif du rejet
          </h3>
          <p style={{
            fontSize: '0.88rem', lineHeight: 1.6, margin: 0,
            background: 'rgba(239,68,68,0.06)', borderRadius: 10,
            padding: '14px', border: '1px solid rgba(239,68,68,0.18)',
            color: '#fca5a5',
          }}>
            {signalement.motif_rejet}
          </p>
        </div>
      )}

      {/* tournee liee */}
      <div>
        <h3 style={{ ...sectionTitle }}>
          <Route size={14} color="#10b981" /> Tournee
        </h3>
        {signalement.id_tournee ? (() => {
          const t = tournees.find((tr) => tr.id === signalement.id_tournee);
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}>
              <Route size={14} color="#3b82f6" />
              <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>
                {t ? (t.titre || t.code || `Tournee #${t.id.slice(0, 8)}`) : `Tournee #${signalement.id_tournee.slice(0, 8)}`}
              </span>
              {t && (
                <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  {t.date_prevue ? new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                </span>
              )}
            </div>
          );
        })() : (
          <>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 8px' }}>
              Ce signalement n'est rattache a aucune tournee.
            </p>
            {onAddToTournee && tournees.filter((t) => t.status === 'pending' || t.status === 'in_progress').length > 0 && (
              <select
                value=""
                onChange={(e) => { if (e.target.value) onAddToTournee(signalement.id, e.target.value); }}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  fontSize: '0.82rem', fontFamily: 'inherit', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', color: '#cbd5e1',
                  border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <option value="">-- Ajouter a une tournee --</option>
                {tournees
                  .filter((t) => t.status === 'pending' || t.status === 'in_progress')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titre || t.code || `Tournee #${t.id.slice(0, 8)}`}
                      {t.date_prevue ? ` -- ${new Date(t.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                      {t.status === 'in_progress' ? ' (en cours)' : ''}
                    </option>
                  ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* actions */}
      <div>
        <h3 style={{ ...sectionTitle }}>Changer le statut</h3>

        {rejectMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Motif du rejet *</label>
            <textarea
              rows={3}
              placeholder="Expliquez la raison du rejet..."
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              autoFocus
              style={{
                resize: 'vertical', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem',
                fontFamily: 'inherit', color: '#e2e8f0',
                background: 'rgba(255,255,255,0.03)', outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetForms}
                style={actionBtn('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', '#94a3b8')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Annuler
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!motifRejet.trim()}
                style={{
                  ...actionBtn('rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)', '#ef4444'),
                  opacity: !motifRejet.trim() ? 0.45 : 1,
                  cursor: !motifRejet.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <XCircle size={14} /> Confirmer le rejet
              </button>
            </div>
          </div>
        ) : closeMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
              <Image size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Photo de preuve <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: 16, borderRadius: 10, cursor: 'pointer',
              border: '2px dashed rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
              transition: 'border-color 0.15s',
            }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
                autoFocus
              />
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Apercu"
                  style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, color: '#64748b', fontSize: '0.82rem',
                }}>
                  <Image size={20} />
                  <span>Importer depuis l'appareil</span>
                </div>
              )}
            </label>

            <label style={{ marginTop: 12, fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
              Notes (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Notes de resolution..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              style={{
                resize: 'vertical', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem',
                fontFamily: 'inherit', color: '#e2e8f0',
                background: 'rgba(255,255,255,0.03)', outline: 'none',
                transition: 'border-color 0.15s',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={resetForms}
                style={actionBtn('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', '#94a3b8')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Annuler
              </button>
              <button
                onClick={handleCloseConfirm}
                disabled={!photoFile}
                style={{
                  ...actionBtn('rgba(16,185,129,0.1)', 'rgba(16,185,129,0.25)', '#10b981'),
                  opacity: !photoFile ? 0.45 : 1,
                  cursor: !photoFile ? 'not-allowed' : 'pointer',
                }}
              >
                <CheckCircle size={14} /> Confirmer la cloture
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {signalement.status !== 'pending' && (
              <button
                onClick={() => onStatusChange(signalement.id, 'pending')}
                style={actionBtn('rgba(245,158,11,0.1)', 'rgba(245,158,11,0.25)', '#f59e0b')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
              >
                <RotateCcw size={14} /> Reouvrir
              </button>
            )}
            {signalement.status === 'pending' && (
              <button
                onClick={() => onStatusChange(signalement.id, 'in_progress')}
                style={actionBtn('rgba(59,130,246,0.1)', 'rgba(59,130,246,0.25)', '#3b82f6')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
              >
                <ArrowRight size={14} /> Prendre en charge
              </button>
            )}
            {signalement.status === 'in_progress' && (
              <button
                onClick={() => setCloseMode(true)}
                style={actionBtn('rgba(16,185,129,0.1)', 'rgba(16,185,129,0.25)', '#10b981')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
              >
                <CheckCircle size={14} /> Cloturer
              </button>
            )}
            {(signalement.status === 'pending' || signalement.status === 'in_progress') && (
              <button
                onClick={() => setRejectMode(true)}
                style={actionBtn('rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)', '#ef4444')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                <XCircle size={14} /> Rejeter
              </button>
            )}
          </div>
        )}
      </div>

      {/* journal d'activite (accordion) */}
      {showAudit && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
          <h3 style={{ ...sectionTitle }}>
            <History size={14} color="#10b981" /> Journal d'activite
          </h3>
          <SignalementAudit sigId={signalement.id} />
        </div>
      )}
    </div>
  );
}
