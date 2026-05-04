import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import {
  getSignalements,
  createSignalement,
  updateSignalement,
  deleteSignalement,
  getZones,
  getContainers,
} from '../../../services/api';
import '../styles/CRUDSection.css';

export default function SignalementsSection() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [zones, setZones] = useState([]);
  const [containers, setContainers] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    type: 'overflowing',
    id_conteneur: '',
    id_zone: '',
    priority: 'medium',
    status: 'pending',
  });

  // Charger les signalements, zones, et conteneurs
  useEffect(() => {
    fetchSignalements();
    fetchZones();
    fetchContainers();
  }, []);

  const fetchSignalements = async () => {
    setLoading(true);
    try {
      const data = await getSignalements();
      setSignalements(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des signalements');
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

  const fetchContainers = async () => {
    try {
      const data = await getContainers();
      setContainers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des conteneurs:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSignalement(editingId, formData);
      } else {
        await createSignalement(formData);
      }
      await fetchSignalements();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        editingId
          ? 'Erreur lors de la modification'
          : 'Erreur lors de la création'
      );
      console.error(err);
    }
  };

  const handleEdit = (signalement) => {
    setEditingId(signalement.id);
    setFormData(signalement);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await deleteSignalement(id);
        await fetchSignalements();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      type: 'overflowing',
      id_conteneur: '',
      id_zone: '',
      priority: 'medium',
      status: 'pending',
    });
    setEditingId(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="crud-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2>Gestion des Signalements</h2>
          <p>Gérez les signalements de déchets et problèmes environnementaux</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-add"
        >
          <Plus size={20} />
          Créer un signalement
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
            <h3>
              {editingId
                ? 'Modifier un signalement'
                : 'Créer un signalement'}
            </h3>
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
              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Décrivez le problème..."
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                >
                  <option value="overflowing">Débordement</option>
                  <option value="full">Conteneur Plein</option>
                  <option value="damaged">Endommagé</option>
                  <option value="smell">Mauvaise Odeur</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Conteneur *</label>
                <select
                  value={formData.id_conteneur}
                  onChange={(e) =>
                    setFormData({ ...formData, id_conteneur: e.target.value })
                  }
                  required
                >
                  <option value="">-- Sélectionnez un conteneur --</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name} (Zone: {container.zone?.name || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Zone</label>
                <select
                  value={formData.id_zone}
                  onChange={(e) =>
                    setFormData({ ...formData, id_zone: e.target.value })
                  }
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
                <label>Priorité *</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
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
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Fermé</option>
                  <option value="rejected">Rejeté</option>
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
      ) : signalements.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={32} />
          <p>Aucun signalement trouvé</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Localisation</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Signalé par</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {signalements.map((signalement) => (
                <tr key={signalement.id}>
                  <td className="font-medium">
                    {signalement.description.substring(0, 30)}...
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {signalement.type}
                    </span>
                  </td>
                  <td>{signalement.location}</td>
                  <td>
                    <span
                      className={`badge badge-${getPriorityColor(
                        signalement.priority
                      )}`}
                    >
                      {signalement.priority === 'high'
                        ? '🔴 Haute'
                        : signalement.priority === 'medium'
                        ? '🟡 Moyenne'
                        : '🟢 Basse'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${getStatusColor(
                        signalement.status
                      )}`}
                    >
                      {signalement.status === 'resolved'
                        ? '✓ Résolu'
                        : signalement.status === 'in_progress'
                        ? '⏳ En cours'
                        : '⏸ En attente'}
                    </span>
                  </td>
                  <td>{signalement.reportedBy || '-'}</td>
                  <td className="table-actions">
                    <button
                      onClick={() => handleEdit(signalement)}
                      className="btn-icon btn-edit"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(signalement.id)}
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
