import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  getContainers,
  createContainer,
  updateContainer,
  deleteContainer,
  getZones,
} from '../../../services/api';
import '../styles/CRUDSection.css';

export default function ContainersSection() {
  const [containers, setContainers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    capacity: 100,
    zoneId: '',
    status: 'actif',
  });

  // Charger les conteneurs et les zones
  useEffect(() => {
    fetchContainers();
    fetchZones();
  }, []);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const data = await getContainers();
      setContainers(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des conteneurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const data = await getZones();
      setZones(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des zones:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateContainer(editingId, formData);
      } else {
        await createContainer(formData);
      }
      await fetchContainers();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(editingId ? 'Erreur lors de la modification' : 'Erreur lors de la création');
      console.error(err);
    }
  };

  const handleEdit = (container) => {
    setEditingId(container.id);
    setFormData(container);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce conteneur ?')) {
      try {
        await deleteContainer(id);
        await fetchContainers();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'standard',
      capacity: 100,
      zoneId: '',
      status: 'actif',
    });
    setEditingId(null);
  };

  return (
    <div className="crud-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2>Gestion des Conteneurs</h2>
          <p>Créez, modifiez et supprimez les conteneurs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-add"
        >
          <Plus size={20} />
          Ajouter un conteneur
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
            <h3>{editingId ? 'Modifier un conteneur' : 'Créer un conteneur'}</h3>
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
                  placeholder="Ex: CT-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="standard">Standard</option>
                  <option value="selective">Sélectif</option>
                  <option value="organic">Organique</option>
                  <option value="hazardous">Dangereux</option>
                </select>
              </div>

              <div className="form-group">
                <label>Capacité (L) *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: parseInt(e.target.value) })
                  }
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Zone *</label>
                <select
                  value={formData.zoneId}
                  onChange={(e) =>
                    setFormData({ ...formData, zoneId: e.target.value })
                  }
                  required
                >
                  <option value="">-- Sélectionnez une zone --</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.code_zone || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Statut *</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
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
      ) : containers.length === 0 ? (
        <div className="empty-state">
          <p>Aucun conteneur trouvé</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Capacité</th>
                <th>Zone</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((container) => (
                <tr key={container.id}>
                  <td className="font-medium">{container.name}</td>
                  <td>
                    <span className="badge badge-info">{container.type}</span>
                  </td>
                  <td>{container.capacity} L</td>
                  <td>{container.zoneId}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        container.status === 'active' ? 'success' : 'warning'
                      }`}
                    >
                      {container.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      onClick={() => handleEdit(container)}
                      className="btn-icon btn-edit"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(container.id)}
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
