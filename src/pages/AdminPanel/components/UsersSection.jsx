import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Shield } from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
} from '../../../services/api';
import '../styles/CRUDSection.css';

export default function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [newRole, setNewRole] = useState('agent');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'agent',
    phone: '',
    status: 'active',
  });

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : data.data || []);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateUser(editingId, formData);
      } else {
        await createUser(formData);
      }
      await fetchUsers();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(editingId ? 'Erreur lors de la modification' : 'Erreur lors de la création');
      console.error(err);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData(user);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(id);
        await fetchUsers();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await changeUserRole(userId, role);
      await fetchUsers();
      setShowRoleModal(null);
    } catch (err) {
      setError('Erreur lors du changement de rôle');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'agent',
      phone: '',
      status: 'active',
    });
    setEditingId(null);
    setNewRole('agent');
  };

  return (
    <div className="crud-section">
      {/* Header */}
      <div className="section-header">
        <div>
          <h2>Gestion des Utilisateurs</h2>
          <p>Gérez les agents et les rôles d'accès</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-add"
        >
          <Plus size={20} />
          Ajouter un utilisateur
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
            <h3>{editingId ? 'Modifier un utilisateur' : 'Créer un utilisateur'}</h3>
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
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="exemple@ecotrack.com"
                  required
                  disabled={!!editingId}
                />
              </div>

              <div className="form-group">
                <label>Prénom *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Jean"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Dupont"
                  required
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className="form-group">
                <label>Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
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
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
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

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="role-modal-overlay">
          <div className="role-modal">
            <h3>Changer le rôle</h3>
            <p>Changez le rôle de {showRoleModal.firstName} {showRoleModal.lastName}</p>
            
            <div className="role-options">
              <button
                onClick={() => handleChangeRole(showRoleModal.id, 'agent')}
                className={`role-option ${newRole === 'agent' ? 'selected' : ''}`}
              >
                <span className="role-icon">👤</span>
                <strong>Agent</strong>
                <small>Accès limité aux opérations</small>
              </button>
              
              <button
                onClick={() => handleChangeRole(showRoleModal.id, 'admin')}
                className={`role-option ${newRole === 'admin' ? 'selected' : ''}`}
              >
                <span className="role-icon">👑</span>
                <strong>Admin</strong>
                <small>Accès complet aux paramètres</small>
              </button>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowRoleModal(null)}
                className="btn-cancel"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-state">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        user.role === 'admin' ? 'danger' : 'secondary'
                      }`}
                    >
                      {user.role === 'admin' ? '👑 Admin' : '👤 Agent'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${
                        user.status === 'active' ? 'success' : 'warning'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      onClick={() => {
                        setShowRoleModal(user);
                        setNewRole(user.role);
                      }}
                      className="btn-icon btn-role"
                      title="Changer le rôle"
                    >
                      <Shield size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="btn-icon btn-edit"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

      <style>{`
        .role-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
        }

        .role-modal {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slide-down 0.3s ease-out;
        }

        .role-modal h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #1a1a1a;
        }

        .role-modal p {
          color: #666;
          margin: 0 0 25px 0;
        }

        .role-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .role-option {
          padding: 15px;
          border: 2px solid #e8ecf1;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .role-option:hover {
          border-color: #16a34a;
          background: rgba(22, 163, 74, 0.05);
        }

        .role-option.selected {
          border-color: #16a34a;
          background: rgba(22, 163, 74, 0.1);
        }

        .role-icon {
          font-size: 1.5rem;
          margin-right: 10px;
        }

        .role-option strong {
          display: block;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .role-option small {
          color: #999;
          font-size: 0.8rem;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-role {
          color: #9333ea;
          border-color: #9333ea;
        }

        .btn-role:hover {
          background: rgba(147, 51, 234, 0.05);
        }

        @keyframes slide-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
