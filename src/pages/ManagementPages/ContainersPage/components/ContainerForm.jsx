import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import MapPickerModal from '../../../../components/common/MapPickerModal';
import ModalBrandPanel from '../../../../components/common/ModalBrandPanel';
import SearchableSelect from '../../../../components/common/SearchableSelect';
import { getZones } from '../../../../services/api';

const genTag = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
};

const EMPTY = { name: '', type: 'standard', capacity: 100, zoneId: '', status: 'actif', latitude: '', longitude: '' };

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const labelStyle = { fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 };

export default function ContainerForm({ show, editingContainer, zones: zonesProp, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [showMap, setShowMap] = useState(false);
  const [zones, setZones] = useState(zonesProp || []);

  useEffect(() => {
    if (show) {
      getZones().then((z) => setZones(Array.isArray(z) ? z : [])).catch(() => {});
    }
  }, [show]);

  useEffect(() => {
    if (zonesProp?.length) setZones(zonesProp);
  }, [zonesProp]);

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

  const zoneOptions = zones.map((z) => ({ value: z.id, label: z.nom || z.name || z.code_zone }));

  return (
    <div className="t-overlay" onClick={onClose}>
      <div className="t-modal modal-split" onClick={(e) => e.stopPropagation()}>
        <ModalBrandPanel />
        <div className="modal-right">
          <div className="t-modal-header">
            <h3>{editingContainer ? 'Modifier le conteneur' : 'Nouveau conteneur'}</h3>
            <button className="t-modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="t-modal-form">
            {/* Type */}
            <div className="t-field">
              <label>Type *</label>
              <select value={form.type} onChange={set('type')}>
                <option value="standard">Standard</option>
                <option value="selective">Sélectif</option>
                <option value="organic">Organique</option>
                <option value="hazardous">Dangereux</option>
                <option value="poubelle">Poubelle</option>
                <option value="benne">Benne</option>
                <option value="conteneur_enterre">Enterré</option>
                <option value="composteur">Composteur</option>
              </select>
            </div>

            {/* Capacity + Zone */}
            <div className="t-field" style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label>Capacité (L) *</label>
                <input
                  type="number" value={form.capacity} min="1" required
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 100 }))}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>Zone *</label>
                <SearchableSelect
                  value={form.zoneId}
                  options={zoneOptions}
                  onChange={(val) => setForm((f) => ({ ...f, zoneId: val }))}
                  placeholder="-- Choisir une zone --"
                />
              </div>
            </div>

            {/* Status */}
            <div className="t-field">
              <label>Statut *</label>
              <select value={form.status} onChange={set('status')}>
                <option value="actif">Actif</option>
                <option value="maintenance">Maintenance</option>
                <option value="retire">Retiré</option>
              </select>
            </div>

            {/* Coordinates */}
            <div className="t-field" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label>Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="14.6937" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="-17.4441" />
              </div>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                title="Choisir sur la carte"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, flexShrink: 0, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', cursor: 'pointer' }}
              >
                <MapPin size={16} />
              </button>
            </div>

            <div className="t-modal-footer">
              <button type="button" className="t-btn-cancel" onClick={onClose}>Annuler</button>
              <button type="submit" className="t-btn-confirm">
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
