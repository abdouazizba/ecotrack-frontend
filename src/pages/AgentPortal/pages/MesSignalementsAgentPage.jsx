import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle, Clock, CheckCircle, ArrowRight,
  Image, Calendar, MapPin, Package, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getTourneesByAgent, getSignalementsByTournee, patchSignalement } from '../../../services/api';
import useAuthStore from '../../../store/authStore';

const PAGE_SIZE = 15;

const STATUS_META = {
  pending:     { label: 'En attente', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  in_progress: { label: 'En cours',   color: '#3b82f6', bg: 'rgba(59,130,246,0.14)' },
  closed:      { label: 'Clôturé',    color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
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
  medium:   { label: 'Normale',  color: '#f59e0b' },
  low:      { label: 'Basse',    color: '#10b981' },
};

export default function MesSignalementsAgentPage() {
  const { user } = useAuthStore();
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filter, setFilter]             = useState('active');
  const [page, setPage]                 = useState(1);

  // Close modal state
  const [closingId, setClosingId]       = useState(null);
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [closeNotes, setCloseNotes]     = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const tournees = await getTourneesByAgent(user.id);
      const sigResults = await Promise.allSettled(
        tournees.map((t) => getSignalementsByTournee(t.id))
      );
      const allSigs = sigResults
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value);
      const unique = [...new Map(allSigs.map((s) => [s.id, s])).values()];
      setSignalements(unique);
      setError(null);
    } catch {
      setError('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'active') return signalements.filter((s) => s.status === 'pending' || s.status === 'in_progress');
    return signalements.filter((s) => s.status === filter);
  }, [signalements, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (f) => { setFilter(f); setPage(1); };

  const handleTakeCharge = async (id) => {
    try {
      await patchSignalement(id, { status: 'in_progress' });
      await load();
    } catch {
      setError('Erreur lors de la mise à jour');
    }
  };

  const openCloseModal = (id) => {
    setClosingId(id);
    setPhotoFile(null);
    setPhotoPreview(null);
    setCloseNotes('');
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCloseConfirm = async () => {
    if (!photoFile) return;
    setSubmitting(true);
    try {
      await patchSignalement(closingId, { status: 'closed', photoFile, notes: closeNotes });
      setClosingId(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      await load();
    } catch {
      setError('Erreur lors de la clôture');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelClose = () => {
    setClosingId(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setCloseNotes('');
    setPhotoFile(null);
  };

  const FILTERS = [
    { key: 'active', label: 'À traiter', count: signalements.filter((s) => s.status === 'pending' || s.status === 'in_progress').length },
    { key: 'closed', label: 'Clôturés',  count: signalements.filter((s) => s.status === 'closed').length },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <AlertCircle size={20} color="#f59e0b" />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          Mes signalements
        </h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 20 }}>
          {filtered.length} signalement{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
              background: filter === key ? '#f59e0b' : 'rgba(255,255,255,0.06)',
              color: filter === key ? '#1e2433' : '#94a3b8',
            }}
          >
            {label}
            <span style={{
              marginLeft: 6,
              background: filter === key ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '0 7px', fontSize: '0.72rem',
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {error   && <p style={{ color: '#ef4444', marginBottom: 12, fontSize: '0.85rem' }}>{error}</p>}
      {loading && <p style={{ color: '#64748b' }}>Chargement…</p>}

      {!loading && paged.length === 0 && (
        <div style={{ textAlign: 'center', color: '#475569', padding: '48px 0' }}>
          <AlertCircle size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Aucun signalement dans cette catégorie</p>
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paged.map((s) => {
          const meta     = STATUS_META[s.status] || STATUS_META.pending;
          const priority = PRIORITY_META[s.priority] || PRIORITY_META.medium;
          const date = s.created_at
            ? new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })
            : '—';

          return (
            <div
              key={s.id}
              style={{
                background: '#1e2433',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.92rem', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {TYPE_LABELS[s.type] || s.type || 'Signalement'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, color: '#64748b', fontSize: '0.74rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
                      <Calendar size={11} /> {date}
                    </span>
                    {s.id_conteneur && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#7dd3fc' }}>
                        <Package size={11} /> #{s.id_conteneur.slice(0, 8)}
                      </span>
                    )}
                    {(s.latitude && s.longitude) && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8' }}>
                        <MapPin size={11} /> {parseFloat(s.latitude).toFixed(3)}, {parseFloat(s.longitude).toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: '0.72rem', fontWeight: 700 }}>
                    {meta.label}
                  </span>
                  <span style={{ color: priority.color, fontSize: '0.7rem', fontWeight: 600 }}>
                    {priority.label}
                  </span>
                </div>
              </div>

              {s.description && (
                <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {s.description}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {s.status === 'pending' && (
                  <button
                    onClick={() => handleTakeCharge(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(59,130,246,0.3)',
                      cursor: 'pointer', background: 'rgba(59,130,246,0.12)', color: '#93c5fd',
                      fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    <ArrowRight size={13} /> Prendre en charge
                  </button>
                )}
                {s.status === 'in_progress' && (
                  <button
                    onClick={() => openCloseModal(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 14px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)',
                      cursor: 'pointer', background: 'rgba(16,185,129,0.12)', color: '#6ee7b7',
                      fontSize: '0.8rem', fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={13} /> Clôturer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: safePage === 1 ? '#334155' : '#94a3b8', cursor: safePage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ color: '#64748b', fontSize: '0.82rem', minWidth: 90, textAlign: 'center' }}>
            Page {safePage} / {totalPages}
          </span>
          <button
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              color: safePage === totalPages ? '#334155' : '#94a3b8', cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Close modal */}
      {closingId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={cancelClose}
        >
          <div
            style={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 24, width: 340, maxWidth: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 16px', fontSize: '1rem' }}>
              Clôturer le signalement
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 10px' }}>
              Photo de preuve <span style={{ color: '#ef4444' }}>*</span>
            </p>
            <label style={{ display: 'block', cursor: 'pointer', marginBottom: 14 }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoSelect} />
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <div style={{ border: '1.5px dashed rgba(255,255,255,0.15)', borderRadius: 8, height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#475569' }}>
                  <Image size={22} />
                  <span style={{ fontSize: '0.8rem' }}>Importer depuis l'appareil</span>
                </div>
              )}
            </label>
            <textarea
              placeholder="Notes (optionnel)"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: '0.83rem', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={cancelClose}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Annuler
              </button>
              <button
                onClick={handleCloseConfirm}
                disabled={!photoFile || submitting}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  cursor: photoFile ? 'pointer' : 'not-allowed',
                  background: photoFile ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(16,185,129,0.25)',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <CheckCircle size={14} /> {submitting ? 'Envoi…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
