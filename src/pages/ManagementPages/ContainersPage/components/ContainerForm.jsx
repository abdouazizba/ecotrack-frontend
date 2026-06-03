import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const EMPTY = { name: '', type: 'standard', capacity: 100, zoneId: '', status: 'actif', latitude: '', longitude: '' };

export default function ContainerForm({ show, editingContainer, zones, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);

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
      setForm(EMPTY);
    }
  }, [editingContainer, show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="cnt-overlay" onClick={onClose}>
      <div className="cnt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cnt-modal-header">
          <h3>{editingContainer ? 'Modifier le conteneur' : 'Nouveau conteneur'}</h3>
          <button className="cnt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cnt-modal-form">
          <div className="cnt-form-row">
            <div className="cnt-field">
              <label>Code / Nom *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="Ex: CT-001" required />
            </div>
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
              <label>Zone *</label>
              <select value={form.zoneId} onChange={set('zoneId')} required>
                <option value="">— Choisir une zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.nom || z.name} ({z.code_zone || ''})</option>
                ))}
              </select>
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
          <div className="cnt-form-row">
            <div className="cnt-field">
              <label>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="14.6937" />
            </div>
            <div className="cnt-field">
              <label>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="-17.4441" />
            </div>
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
  );
}
