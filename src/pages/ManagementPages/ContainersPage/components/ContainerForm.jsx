import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';
import MapPickerModal from '../../../../components/common/MapPickerModal';

const genTag = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
};

const EMPTY = { name: '', type: 'standard', capacity: 100, zoneId: '', status: 'actif', latitude: '', longitude: '' };

export default function ContainerForm({ show, editingContainer, zones, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (editingContainer) {
      setForm({
        name:      editingContainer.name || editingContainer.code_conteneur || '',
        type:      editingContainer.type || 'standard',
        capacity:  editingContainer.capacity || 100,
        zoneId:    editingContainer.zoneId || '',
        status:    editingContainer.status || 'actif',
        latitude:  editingContainer.latitude || '',
        longitude: editingContainer.longitude || '',
      });
    } else {
      setForm({ ...EMPTY, name: `CONT-${genTag()}` });
    }
  }, [editingContainer, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const findNearestZone = (lat, lng) => {
    if (!zones.length) return '';
    let best = null;
    let bestDist = Infinity;
    for (const z of zones) {
      if (!z.latitude || !z.longitude) continue;
      const d = (z.latitude - lat) ** 2 + (z.longitude - lng) ** 2;
      if (d < bestDist) { bestDist = d; best = z; }
    }
    return best?.id || '';
  };

  const selectedZoneName = zones.find(z => z.id === form.zoneId)?.nom || '';

  return (
    <div className="cnt-overlay" onClick={onClose}>
      <div className="cnt-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
        <div className="cnt-modal-header">
          <h3>{editingContainer ? 'Modifier le conteneur' : 'Nouveau conteneur'}</h3>
          <button className="cnt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cnt-modal-form">
          <div className="cnt-form-row">
            <div className="cnt-field">
              <label>Type *</label>
              <select value={form.type} onChange={set('type')}>
                <option value="standard">Standard</option>
                <option value="selective">Sélectif</option>
                <option value="organic">Organique</option>
                <option value="hazardous">Dangereux</option>
              </select>
            </div>
          </div>
          <div className="cnt-form-row">
            <div className="cnt-field">
              <label>Capacité (L) *</label>
              <input
                type="number" value={form.capacity} min="1" required
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 100 }))}
              />
            </div>
            <div className="cnt-field">
              <label>Zone {form.zoneId ? '' : '*'}</label>
              {form.zoneId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.84rem', color: '#6ee7b7' }}>
                  <MapPin size={14} />
                  <span style={{ flex: 1 }}>{selectedZoneName || 'Zone sélectionnée'}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, zoneId: '' }))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              ) : (
                <p style={{ color: '#f59e0b', fontSize: '0.78rem', margin: 0 }}>
                  <MapPin size={12} style={{ verticalAlign: 'middle' }} /> Cliquez sur 📍 pour placer le conteneur — la zone sera auto-détectée
                </p>
              )}
            </div>
          </div>
          <div className="cnt-form-row">
            <div className="cnt-field">
              <label>Statut *</label>
              <select value={form.status} onChange={set('status')}>
                <option value="actif">Actif</option>
                <option value="maintenance">Maintenance</option>
                <option value="retire">Retiré</option>
              </select>
            </div>
          </div>
          <div className="cnt-form-row cnt-coords-row">
            <div className="cnt-field">
              <label>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="14.6937" />
            </div>
            <div className="cnt-field">
              <label>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="-17.4441" />
            </div>
            <button
              type="button"
              className="cnt-map-picker-btn"
              onClick={() => setShowMap(true)}
              title="Choisir sur la carte"
            >
              <MapPin size={16} />
            </button>
          </div>
          <div className="cnt-modal-footer">
            <button type="button" className="cnt-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="cnt-btn-confirm">
              {editingContainer ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
        </div>
      </div>

      <MapPickerModal
        show={showMap}
        initialLat={form.latitude}
        initialLng={form.longitude}
        onConfirm={(lat, lng) =>
          setForm((f) => ({
            ...f,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            zoneId: findNearestZone(lat, lng),
          }))
        }
        onClose={() => setShowMap(false)}
      />
    </div>
  );
}
