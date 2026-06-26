import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { createSignalement, uploadSignalementPhoto, getNearbyContainers } from '../../../services/api';
import { AlertCircle, Camera, X, MapPin, ChevronRight } from 'lucide-react';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TYPE_OPTIONS = [
  { value: 'full',        label: 'Conteneur plein',     emoji: '🗑️' },
  { value: 'overflowing', label: 'Débordement',          emoji: '⚠️' },
  { value: 'damaged',     label: 'Conteneur endommagé',  emoji: '🔧' },
  { value: 'smell',       label: 'Mauvaise odeur',       emoji: '👃' },
  { value: 'other',       label: 'Autre problème',       emoji: '📝' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Basse',    dot: '#6b7280' },
  { value: 'medium',   label: 'Normale',  dot: '#34d399' },
  { value: 'high',     label: 'Haute',    dot: '#fbbf24' },
  { value: 'critical', label: 'Critique', dot: '#ef4444' },
];

const DEFAULT_CENTER = [14.6937, -17.4441];

const createContainerIcon = (selected) =>
  L.divIcon({
    html: `<div style="background:${selected ? '#34d399' : '#10b981'};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:${selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.7)'};box-shadow:0 2px 8px rgba(0,0,0,0.4);">🗑️</div>`,
    className: '', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34],
  });

const createUserIcon = () =>
  L.divIcon({
    html: `<div style="background:#6366f1;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.45);">📍</div>`,
    className: '', iconSize: [38, 38], iconAnchor: [19, 38],
  });

export default function SignalerPage() {
  // Map state
  const [userPos, setUserPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [nearby, setNearby] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [locating, setLocating] = useState(true);

  // Form state
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [manualId, setManualId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fileRef = useRef();
  const formRef = useRef();

  const loadNearby = useCallback(async (lat, lng) => {
    try {
      const data = await getNearbyContainers({ lat, lng, radius: 3 });
      setNearby(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserPos([coords.latitude, coords.longitude]);
        setMapCenter([coords.latitude, coords.longitude]);
        loadNearby(coords.latitude, coords.longitude);
        setLocating(false);
      },
      () => {
        loadNearby(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
        setLocating(false);
      }
    );
  }, [loadNearby]);

  const handleSelectContainer = (c) => {
    setSelectedContainer(c);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const containerId = selectedContainer?.id || manualId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type)          { setError('Choisissez un type de problème.'); return; }
    if (!containerId)   { setError('Sélectionnez un conteneur sur la carte ou saisissez son ID.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const created = await createSignalement({ type, description, id_conteneur: containerId, priorite: priority });
      if (photoFile && created?.id) {
        try {
          await uploadSignalementPhoto(created.id, photoFile);
        } catch (uploadErr) {
          console.warn('Photo upload failed:', uploadErr.message);
        }
      }
      setSuccess(true);
      // reset
      setType(''); setPriority('medium'); setDescription('');
      setSelectedContainer(null); setManualId(''); removePhoto();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="sig-success">
        <div className="sig-success-icon">✅</div>
        <h2>Signalement envoyé !</h2>
        <p>Merci pour votre contribution. Notre équipe traitera votre signalement rapidement.</p>
        <button className="cp-btn-accent" onClick={() => setSuccess(false)}>
          Faire un autre signalement
        </button>
        <style>{successStyles}</style>
      </div>
    );
  }

  return (
    <div className="sig-page">
      <div className="sig-header">
        <AlertCircle size={22} color="#34d399" />
        <div>
          <h2 className="sig-title">Signaler un problème</h2>
          <p className="sig-subtitle">Sélectionnez un conteneur sur la carte puis remplissez le formulaire</p>
        </div>
      </div>

      {/* Map */}
      <div className="sig-map-card cp-card">
        <div className="sig-map-label">
          <MapPin size={14} color="#34d399" />
          <span>Conteneurs proches</span>
          {!locating && nearby.length > 0 && <span className="sig-nearby-count">{nearby.length}</span>}
          {locating && <span className="sig-locating">Localisation…</span>}
        </div>
        <div className="sig-map-wrap">
          <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }} key={mapCenter.toString()}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {userPos && (
              <>
                <Circle center={userPos} radius={3000} pathOptions={{ color: '#6366f1', fillOpacity: 0.04, weight: 1, dashArray: '6' }} />
                <Marker position={userPos} icon={createUserIcon()}>
                  <Popup><strong>Votre position</strong></Popup>
                </Marker>
              </>
            )}
            {nearby.map((c) => (
              <Marker
                key={c.id}
                position={[c.latitude || 0, c.longitude || 0]}
                icon={createContainerIcon(selectedContainer?.id === c.id)}
                eventHandlers={{ click: () => handleSelectContainer(c) }}
              >
                <Popup>
                  <strong>{c.code_conteneur || c.name}</strong><br />
                  {c.distanceKm != null && <span>{c.distanceKm.toFixed(2)} km</span>}
                  <br />
                  <button style={{ marginTop: 6, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => handleSelectContainer(c)}>
                    Signaler ce conteneur
                  </button>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {nearby.length > 0 && (
          <div className="sig-container-list">
            {nearby.slice(0, 4).map((c) => (
              <button
                key={c.id}
                className={`sig-container-chip ${selectedContainer?.id === c.id ? 'selected' : ''}`}
                onClick={() => handleSelectContainer(c)}
              >
                🗑️ {c.code_conteneur || c.name}
                {c.distanceKm != null && <span className="chip-dist">{c.distanceKm.toFixed(2)}km</span>}
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <div ref={formRef} className="sig-form-card cp-card">
        {selectedContainer ? (
          <div className="sig-selected-container">
            <span>🗑️ Conteneur sélectionné :</span>
            <strong>{selectedContainer.code_conteneur || selectedContainer.name}</strong>
            <button onClick={() => setSelectedContainer(null)}>✕</button>
          </div>
        ) : (
          <div className="sig-manual-id">
            <label>ID du conteneur (si non visible sur la carte)</label>
            <input
              type="text"
              placeholder="UUID du conteneur"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
          </div>
        )}

        {/* Type */}
        <div className="sig-field-label">Type de problème *</div>
        <div className="sig-type-grid">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`sig-type-btn ${type === t.value ? 'selected' : ''}`}
              onClick={() => setType(t.value)}
            >
              <span className="sig-type-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Priority */}
        <div className="sig-field-label">Priorité</div>
        <div className="sig-priority-row">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`sig-prio-btn ${priority === p.value ? 'selected' : ''}`}
              style={priority === p.value ? { borderColor: p.dot, color: p.dot } : {}}
              onClick={() => setPriority(p.value)}
            >
              <span style={{ color: p.dot }}>●</span> {p.label}
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="sig-field-label">Description <span className="sig-optional">(optionnel)</span></div>
        <textarea
          className="sig-textarea"
          rows={3}
          placeholder="Décrivez le problème en détail…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Photo */}
        <div className="sig-field-label">Photo <span className="sig-optional">(optionnel, max 5 MB)</span></div>
        {photoPreview ? (
          <div className="sig-photo-preview">
            <img src={photoPreview} alt="aperçu" />
            <button type="button" className="sig-photo-remove" onClick={removePhoto}><X size={14} /></button>
          </div>
        ) : (
          <button type="button" className="sig-photo-btn" onClick={() => fileRef.current?.click()}>
            <Camera size={20} color="#34d399" />
            <span>Ajouter une photo</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhoto} />

        {error && <div className="sig-error">{error}</div>}

        <button
          type="button"
          className="cp-btn-accent sig-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <span className="cp-spin" style={{ width: 18, height: 18 }} /> : <AlertCircle size={18} />}
          {submitting ? 'Envoi en cours…' : 'Envoyer le signalement'}
        </button>
      </div>

      <style>{pageStyles}</style>
    </div>
  );
}

const successStyles = `
  .sig-success {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 1rem; padding: 4rem 2rem;
    text-align: center; color: white;
  }
  .sig-success-icon { font-size: 4rem; }
  .sig-success h2 { margin: 0; font-size: 1.5rem; font-weight: 700; }
  .sig-success p { margin: 0; color: rgba(255,255,255,0.6); max-width: 320px; font-size: 0.92rem; }
`;

const pageStyles = `
  .sig-page { padding: 1.5rem 1.5rem 2rem; max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
  .sig-header { display: flex; align-items: flex-start; gap: 0.75rem; }
  .sig-title  { margin: 0; font-size: 1.3rem; font-weight: 700; color: white; }
  .sig-subtitle { margin: 0.2rem 0 0; font-size: 0.82rem; color: rgba(255,255,255,0.5); }

  /* Map */
  .sig-map-card { overflow: hidden; }
  .sig-map-label { display: flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1.1rem; font-size: 0.82rem; font-weight: 600; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.1); }
  .sig-nearby-count { background: rgba(52,211,153,0.2); color: #34d399; border-radius: 999px; font-size: 0.72rem; padding: 0.1rem 0.45rem; }
  .sig-locating { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-style: italic; }
  .sig-map-wrap { height: 260px; }
  .sig-container-list { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid rgba(255,255,255,0.08); }
  .sig-container-chip { display: flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 999px; color: rgba(255,255,255,0.7); font-size: 0.78rem; padding: 0.3rem 0.75rem; cursor: pointer; transition: all 0.15s; }
  .sig-container-chip:hover { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.4); color: white; }
  .sig-container-chip.selected { background: rgba(52,211,153,0.2); border-color: #34d399; color: #34d399; }
  .chip-dist { color: rgba(255,255,255,0.35); font-size: 0.7rem; }

  /* Form */
  .sig-form-card { padding: 1.25rem 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .sig-selected-container { display: flex; align-items: center; gap: 0.5rem; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); border-radius: 10px; padding: 0.6rem 0.9rem; font-size: 0.84rem; color: #6ee7b7; flex-wrap: wrap; }
  .sig-selected-container button { margin-left: auto; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.4); font-size: 1rem; }
  .sig-manual-id { display: flex; flex-direction: column; gap: 0.35rem; }
  .sig-manual-id label { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
  .sig-manual-id input { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: white; padding: 0.6rem 0.9rem; font-size: 0.88rem; outline: none; transition: border-color 0.15s; }
  .sig-manual-id input:focus { border-color: rgba(52,211,153,0.5); }
  .sig-manual-id input::placeholder { color: rgba(255,255,255,0.25); }
  .sig-field-label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.55); letter-spacing: 0.04em; text-transform: uppercase; }
  .sig-optional { text-transform: none; font-weight: 400; color: rgba(255,255,255,0.3); }
  .sig-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .sig-type-btn { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; padding: 0.75rem 0.5rem; background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 14px; cursor: pointer; color: rgba(255,255,255,0.6); font-size: 0.75rem; transition: all 0.2s; }
  .sig-type-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(52,211,153,0.4); color: white; }
  .sig-type-btn.selected { background: rgba(52,211,153,0.15); border-color: #34d399; color: #6ee7b7; }
  .sig-type-emoji { font-size: 1.6rem; line-height: 1; }
  .sig-priority-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .sig-prio-btn { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.12); border-radius: 999px; color: rgba(255,255,255,0.5); font-size: 0.8rem; padding: 0.3rem 0.85rem; cursor: pointer; transition: all 0.15s; }
  .sig-prio-btn.selected { background: rgba(255,255,255,0.1); font-weight: 700; }
  .sig-textarea { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; color: white; padding: 0.75rem 1rem; font-size: 0.88rem; outline: none; resize: vertical; transition: border-color 0.15s; font-family: inherit; width: 100%; box-sizing: border-box; }
  .sig-textarea:focus { border-color: rgba(52,211,153,0.5); }
  .sig-textarea::placeholder { color: rgba(255,255,255,0.25); }
  .sig-photo-btn { display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: rgba(255,255,255,0.06); border: 1.5px dashed rgba(52,211,153,0.3); border-radius: 12px; color: rgba(255,255,255,0.5); font-size: 0.88rem; padding: 0.9rem; cursor: pointer; transition: all 0.2s; width: 100%; }
  .sig-photo-btn:hover { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.5); color: rgba(255,255,255,0.8); }
  .sig-photo-preview { position: relative; display: inline-block; width: 100%; }
  .sig-photo-preview img { width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
  .sig-photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; }
  .sig-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; color: #fca5a5; font-size: 0.83rem; padding: 0.6rem 0.9rem; }
  .sig-submit { width: 100%; padding: 0.9rem; font-size: 0.95rem; }
`;
