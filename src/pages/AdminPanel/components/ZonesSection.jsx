import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
} from '../../../services/api';
import '../styles/CRUDSection.css';

export default function ZonesSection() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code_zone: '',
    description: '',
    population_estimee: 0,
    latitude: 0,
    longitude: 0,
    status: 'active',
  });

  // Charger les zones
  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await getZones();
      setZones(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des zones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Submitting zone data:', {
      editingId,
      formData,
      latitude: formData.latitude,
      longitude: formData.longitude,
    });
    try {
      if (editingId) {
        await updateZone(editingId, formData);
      } else {
        await createZone(formData);
      }
      await fetchZones();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(editingId ? 'Erreur lors de la modification' : 'Erreur lors de la création');
      console.error(err);
    }
  };

  const handleEdit = (zone) => {
    console.log('🔍 Editing zone:', zone);
    setEditingId(zone.id);
    setFormData({
      name: zone.name || '',
      code_zone: zone.code_zone || '',
      description: zone.description || '',
      population_estimee: zone.population_estimee || 0,
      latitude: zone.latitude || 0,
      longitude: zone.longitude || 0,
      status: zone.status || 'active',
    });
    console.log('📝 Form data set to:', zone);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) {
      try {
        await deleteZone(id);
        await fetchZones();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code_zone: '',
      description: '',
      population_estimee: 0,
      latitude: 0,
      longitude: 0,
      status: 'active',
    });
    setEditingId(null);
  };

  return (
    <div className="crud-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2>Gestion des Zones</h2>
          <p>Créez, modifiez et supprimez les zones de collecte</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-add"
        >
          <Plus size={20} />
          Ajouter une zone
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn-close-alert">
            ×
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h3>{editingId ? 'Modifier une zone' : 'Créer une zone'}</h3>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="btn-close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="crud-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Zone Centre-Ville"
                  required
                />
              </div>

              <div className="form-group">
                <label>Code Zone</label>
                <input
                  type="text"
                  value={formData.code_zone}
                  onChange={(e) =>
                    setFormData({ ...formData, code_zone: e.target.value })
                  }
                  placeholder="Ex: ZONE-001"
                />
              </div>

              <div className="form-group">
                <label>Population estimée</label>
                <input
                  type="number"
                  value={formData.population_estimee}
                  onChange={(e) =>
                    setFormData({ ...formData, population_estimee: parseInt(e.target.value) })
                  }
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, latitude: val });
                  }}
                  placeholder="48.8566"
                  title="Latitude en degrés décimaux (ex: 48.8566)"
                />
                <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                  Ex: 48.8566 (Paris)
                </small>
              </div>

              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, longitude: val });
                  }}
                  placeholder="2.3522"
                  title="Longitude en degrés décimaux (ex: 2.3522)"
                />
                <small style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                  Ex: 2.3522 (Paris)
                </small>
              </div>

              <div className="form-group">
                <label>Statut *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez la zone..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit">
                {editingId ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn-cancel"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : zones.length === 0 ? (
        <div className="empty-state">
          <p>Aucune zone trouvée</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code Zone</th>
                <th>Population</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td className="font-medium">{zone.name}</td>
                  <td>{zone.code_zone || '-'}</td>
                  <td>{zone.population_estimee || 0}</td>
                  <td>{zone.latitude || '-'}</td>
                  <td>{zone.longitude || '-'}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        zone.status === 'active' ? 'success' : 'warning'
                      }`}
                    >
                      {zone.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="btn-icon btn-edit"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="btn-icon btn-delete"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
