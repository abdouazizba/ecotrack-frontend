import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import MapPickerModal from '../../../../components/common/MapPickerModal';

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div style={{ background: '#1e2433', borderRadius: 14, padding: 24, width: 480, maxWidth: '92vw', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ color: '#e2e8f0', margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
            {editingContainer ? 'Modifier le conteneur' : 'Nouveau conteneur'}
          </h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <label style={labelStyle}>Type *</label>
            <select style={inputStyle} value={form.type} onChange={set('type')}>
              <option value="standard">Standard</option>
              <option value="selective">Selectif</option>
              <option value="organic">Organique</option>
              <option value="hazardous">Dangereux</option>
              <option value="poubelle">Poubelle</option>
              <option value="benne">Benne</option>
              <option value="conteneur_enterre">Enterre</option>
              <option value="composteur">Composteur</option>
            </select>
          </div>

          {/* Capacity + Zone */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <label style={labelStyle}>Capacite (L) *</label>
              <input
                type="number" style={inputStyle} value={form.capacity} min="1" required
                onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 100 }))}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <label style={labelStyle}>Zone {form.zoneId ? '' : '*'}</label>
              {form.zoneId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.84rem', color: '#6ee7b7' }}>
                  <MapPin size={14} />
                  <span style={{ flex: 1 }}>{selectedZoneName || 'Zone selectionnee'}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, zoneId: '' }))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>x</button>
                </div>
              ) : (
                <select style={inputStyle} value={form.zoneId} onChange={set('zoneId')}>
                  <option value="">-- Choisir une zone --</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.nom || z.name}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            <label style={labelStyle}>Statut *</label>
            <select style={inputStyle} value={form.status} onChange={set('status')}>
              <option value="actif">Actif</option>
              <option value="maintenance">Maintenance</option>
              <option value="retire">Retire</option>
            </select>
          </div>

          {/* Coordinates */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <label style={labelStyle}>Latitude</label>
              <input type="number" step="any" style={inputStyle} value={form.latitude} onChange={set('latitude')} placeholder="14.6937" />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
              <label style={labelStyle}>Longitude</label>
              <input type="number" step="any" style={inputStyle} value={form.longitude} onChange={set('longitude')} placeholder="-17.4441" />
            </div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              title="Choisir sur la carte"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, flexShrink: 0, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', cursor: 'pointer', marginBottom: 12 }}
            >
              <MapPin size={16} />
            </button>
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
              Annuler
            </button>
            <button type="submit"
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit' }}>
              {editingContainer ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </form>
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
