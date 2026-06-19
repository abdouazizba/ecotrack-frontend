import React, { useEffect, useState, useCallback } from 'react';
import {
  Route, Calendar, CheckCircle, Clock, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Image, AlertTriangle, Package, ArrowRight,
  List, Map,
} from 'lucide-react';
import {
  getTourneesByAgent,
  updateTourneeStatus,
  getSignalementsByTournee,
  patchSignalement,
} from '../../../services/api';
import TourneeMap from './TourneeMap';
import useAuthStore from '../../../store/authStore';

const STATUS_META = {
  pending:     { label: 'Planifiée',  color: '#f59e0b', Icon: Clock },
  in_progress: { label: 'En cours',   color: '#3b82f6', Icon: AlertCircle },
  done:        { label: 'Terminée',   color: '#10b981', Icon: CheckCircle },
  cancelled:   { label: 'Annulée',    color: '#ef4444', Icon: XCircle },
};

const SIG_STATUS = {
  pending:     { label: 'En attente',  color: '#f59e0b' },
  in_progress: { label: 'En cours',    color: '#3b82f6' },
  closed:      { label: 'Clôturé',     color: '#10b981' },
  rejected:    { label: 'Rejeté',      color: '#ef4444' },
};

const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

const btn = (extra = {}) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '6px 14px', borderRadius: 7, border: 'none',
  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
  ...extra,
});

// ── Inline close modal ────────────────────────────────────────────────────────
function CloseModal({ sigId, onConfirm, onCancel, submitting }) {
  const [photoFile, setPhotoFile]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [notes, setNotes]             = useState('');

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => onConfirm(sigId, photoFile, notes);

  const handleCancel = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    onCancel();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
      onClick={handleCancel}
    >
      <div
        style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, width: 340, maxWidth: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 14px', fontSize: '1rem' }}>Clôturer le signalement</h3>

        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 8px' }}>
          Photo de preuve <span style={{ color: '#ef4444' }}>*</span>
        </p>
        <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />
          {photoPreview ? (
            <img src={photoPreview} alt="Aperçu" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
          ) : (
            <div style={{ border: '1.5px dashed rgba(255,255,255,0.15)', borderRadius: 8, height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#475569' }}>
              <Image size={20} />
              <span style={{ fontSize: '0.78rem' }}>Importer depuis l'appareil</span>
            </div>
          )}
        </label>

        <textarea
          placeholder="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: '0.82rem', resize: 'vertical', marginBottom: 14, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCancel}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!photoFile || submitting}
            style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: photoFile ? 'pointer' : 'not-allowed', background: photoFile ? '#10b981' : 'rgba(16,185,129,0.3)', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <CheckCircle size={14} /> {submitting ? 'Envoi…' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Signalements d'une tournée ────────────────────────────────────────────────
function TourneeSignalements({ tourneeId, onUpdate }) {
  const [sigs, setSigs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [closingId, setClosingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getSignalementsByTournee(tourneeId);
    setSigs(data);
    setLoading(false);
  }, [tourneeId]);

  useEffect(() => { load(); }, [load]);

  const handleTakeCharge = async (id) => {
    // Mise à jour optimiste immédiate — évite de dépendre du re-fetch
    setSigs((prev) => prev.map((s) => s.id === id ? { ...s, status: 'in_progress' } : s));
    try {
      await patchSignalement(id, { status: 'in_progress' });
      await load();
      onUpdate?.();
    } catch {
      setError('Erreur lors de la prise en charge');
      await load(); // réinitialise l'état depuis le serveur si l'appel a échoué
    }
  };

  const handleCloseConfirm = async (id, photoFile, notes) => {
    if (!photoFile) return;
    setSubmitting(true);
    try {
      await patchSignalement(id, { status: 'closed', photoFile, notes });
      setClosingId(null);
      await load();
      onUpdate?.();
    } catch {
      setError('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.8rem', padding: '8px 0' }}>Chargement…</p>;

  if (sigs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569' }}>
        <Package size={28} strokeWidth={1.2} />
        <p style={{ fontSize: '0.82rem', margin: '6px 0 0' }}>Aucun signalement dans cette tournée</p>
      </div>
    );
  }

  const tabBtn = (mode, Icon, label) => (
    <button
      onClick={() => setViewMode(mode)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600,
        background: viewMode === mode ? '#3b82f6' : 'rgba(255,255,255,0.07)',
        color: viewMode === mode ? '#fff' : '#64748b',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <>
      {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8 }}>{error}</p>}

      {/* Toggle vue */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {tabBtn('list', List, 'Liste')}
        {tabBtn('map',  Map,  'Carte')}
      </div>

      {/* Vue carte */}
      {viewMode === 'map' && (
        <TourneeMap
          sigs={sigs}
          onTakeCharge={handleTakeCharge}
          onStartClose={(id) => setClosingId(id)}
        />
      )}

      {/* Vue liste */}
      {viewMode === 'list' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sigs.map((s) => {
          const meta = SIG_STATUS[s.status] || SIG_STATUS.pending;
          const date = s.created_at
            ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : '—';
          return (
            <div
              key={s.id}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                  {TYPE_LABELS[s.type] || s.type || 'Signalement'}
                </p>
                <span style={{ padding: '2px 8px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, fontSize: '0.72rem', fontWeight: 600 }}>
                  {meta.label}
                </span>
              </div>
              {s.description && <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 8px' }}>{s.description}</p>}
              <span style={{ color: '#475569', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
                <Calendar size={10} /> {date}
              </span>

              {s.status === 'pending' && (
                <button
                  onClick={() => handleTakeCharge(s.id)}
                  style={btn({ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' })}
                >
                  <ArrowRight size={12} /> Prendre en charge
                </button>
              )}
              {s.status === 'in_progress' && (
                <button
                  onClick={() => setClosingId(s.id)}
                  style={btn({ background: 'rgba(16,185,129,0.12)', color: '#10b981' })}
                >
                  <CheckCircle size={12} /> Clôturer
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      {closingId && (
        <CloseModal
          sigId={closingId}
          submitting={submitting}
          onConfirm={handleCloseConfirm}
          onCancel={() => setClosingId(null)}
        />
      )}
    </>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function MesTourneesPage() {
  const { user }               = useAuthStore();
  const [tournees, setTournees] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState(null);
  const [filter, setFilter]    = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getTourneesByAgent(user.id);
      setTournees(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Impossible de charger les tournées');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? tournees : tournees.filter((t) => t.status === filter);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateTourneeStatus(id, status);
      await load();
    } catch {
      setError('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Route size={22} color="#3b82f6" />
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Mes tournées</h1>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'in_progress', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 500,
              background: filter === f ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: filter === f ? '#fff' : '#94a3b8',
            }}
          >
            {f === 'all' ? 'Toutes' : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      {!loading && filtered.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', marginTop: 48 }}>Aucune tournée trouvée.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((t) => {
          const meta     = STATUS_META[t.status] || STATUS_META.pending;
          const Icon     = meta.Icon;
          const expanded = expandedId === t.id;
          const isUpdating = updating === t.id;
          const date = t.date_prevue
            ? new Date(t.date_prevue).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
            : '—';

          return (
            <div
              key={t.id}
              style={{ background: '#1e2433', border: `1px solid ${expanded ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s' }}
            >
              {/* En-tête de la carte */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: `${meta.color}18`, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 3px', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.titre || t.code || `Tournée #${t.id?.slice(0, 8)}`}
                  </p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Calendar size={10} /> {date}
                    </span>
                    {t.zone_nom && (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>· {t.zone_nom}</span>
                    )}
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: `${meta.color}18`, color: meta.color, fontSize: '0.72rem', fontWeight: 600 }}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Actions de statut */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  {t.status === 'pending' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'in_progress'); }}
                      style={btn({ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', opacity: isUpdating ? 0.6 : 1 })}
                    >
                      <AlertCircle size={12} /> Démarrer
                    </button>
                  )}
                  {t.status === 'in_progress' && (
                    <button
                      disabled={isUpdating}
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(t.id, 'done'); }}
                      style={btn({ background: 'rgba(16,185,129,0.15)', color: '#10b981', opacity: isUpdating ? 0.6 : 1 })}
                    >
                      <CheckCircle size={12} /> Terminer
                    </button>
                  )}
                  <button
                    onClick={() => toggleExpand(t.id)}
                    title={expanded ? 'Réduire' : 'Voir les signalements'}
                    style={{ padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Section signalements (expandable) */}
              {expanded && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <AlertTriangle size={13} color="#f59e0b" />
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Signalements à traiter</span>
                  </div>
                  <TourneeSignalements tourneeId={t.id} onUpdate={load} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
