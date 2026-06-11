import React, { useState, useRef } from 'react';
import { createSignalement, uploadSignalementPhoto } from '../../../services/api';
import { AlertCircle, Camera, X, CheckCircle, Loader } from 'lucide-react';

const TYPES = [
  { value: 'full',       label: 'Conteneur plein',    emoji: '🗑️' },
  { value: 'overflowing', label: 'Débordement',        emoji: '⚠️' },
  { value: 'damaged',    label: 'Conteneur endommagé', emoji: '🔧' },
  { value: 'smell',      label: 'Mauvaise odeur',      emoji: '👃' },
  { value: 'other',      label: 'Autre',               emoji: '📝' },
];

const PRIORITIES = [
  { value: 'low',      label: 'Basse',    color: '#6b7280' },
  { value: 'medium',   label: 'Normale',  color: '#3b82f6' },
  { value: 'high',     label: 'Haute',    color: '#f59e0b' },
  { value: 'critical', label: 'Critique', color: '#ef4444' },
];

const EMPTY_FORM = {
  type: '',
  description: '',
  priority: 'medium',
  containerId: '',
};

export default function CreateSignalementForm({ preselectedContainer, onSuccess }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    containerId: preselectedContainer?.id || '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) { setError('Choisissez un type de signalement.'); return; }
    if (!form.containerId) { setError('L\'identifiant du conteneur est requis.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createSignalement({
        type: form.type,
        description: form.description,
        id_conteneur: form.containerId,
        priorite: form.priority,
      });
      if (photoFile && created?.id) {
        try { await uploadSignalementPhoto(created.id, photoFile); } catch {}
      }
      setSuccess(true);
      setForm({ ...EMPTY_FORM, containerId: preselectedContainer?.id || '' });
      removePhoto();
      setTimeout(() => { setSuccess(false); onSuccess && onSuccess(created); }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du signalement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="signal-form-success">
        <CheckCircle size={40} color="#10b981" />
        <p>Signalement envoyé avec succès !</p>
      </div>
    );
  }

  return (
    <form className="signal-form" onSubmit={handleSubmit}>
      <div className="signal-form-title">
        <AlertCircle size={18} />
        <span>Nouveau signalement</span>
      </div>

      {preselectedContainer && (
        <div className="signal-form-preselect">
          <span>🗑️</span>
          <span>{preselectedContainer.code_conteneur || preselectedContainer.name}</span>
        </div>
      )}

      {!preselectedContainer && (
        <div className="signal-form-field">
          <label>ID du conteneur *</label>
          <input
            type="text"
            placeholder="ex: uuid du conteneur"
            value={form.containerId}
            onChange={(e) => setForm({ ...form, containerId: e.target.value })}
          />
        </div>
      )}

      <div className="signal-form-field">
        <label>Type de problème *</label>
        <div className="signal-type-grid">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`signal-type-btn ${form.type === t.value ? 'selected' : ''}`}
              onClick={() => setForm({ ...form, type: t.value })}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="signal-form-field">
        <label>Priorité</label>
        <div className="signal-priority-row">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`signal-priority-btn ${form.priority === p.value ? 'selected' : ''}`}
              style={form.priority === p.value ? { borderColor: p.color, color: p.color } : {}}
              onClick={() => setForm({ ...form, priority: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="signal-form-field">
        <label>Description (optionnel)</label>
        <textarea
          rows={3}
          placeholder="Décrivez le problème..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="signal-form-field">
        <label>Photo (optionnel)</label>
        {photoPreview ? (
          <div className="signal-photo-preview">
            <img src={photoPreview} alt="preview" />
            <button type="button" className="signal-photo-remove" onClick={removePhoto}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button type="button" className="signal-photo-add" onClick={() => fileRef.current?.click()}>
            <Camera size={18} />
            <span>Ajouter une photo</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />
      </div>

      {error && <div className="signal-form-error">{error}</div>}

      <button type="submit" className="signal-form-submit" disabled={submitting}>
        {submitting ? <Loader size={16} className="spin" /> : <AlertCircle size={16} />}
        {submitting ? 'Envoi...' : 'Envoyer le signalement'}
      </button>
    </form>
  );
}
