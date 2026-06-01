import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Box, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './ContainersSection.css';
import {
  getContainers,
  createContainer,
  updateContainer,
  deleteContainer,
  getZones,
  getContainer,
} from '../../../../services/api';

export default function ContainersSection() {
  const [containers, setContainers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Panel détails
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [selectedContainerDetails, setSelectedContainerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // Filtres
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    zone: '',
    capacityMin: '',
    capacityMax: '',
  });

  // Tri
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc',
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'standard',
    capacity: 100,
    zoneId: '',
    status: 'actif',
  });

  // Couleurs par type de conteneur
  const typeColors = {
    standard: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    selective: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
    organic: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    hazardous: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  };

  // Couleurs par statut
  const statusColors = {
    actif: 'bg-green-100 text-green-800',
    inactif: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  };

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
      setCurrentPage(1);
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

  // Filtrage et tri
  const filteredAndSortedContainers = useMemo(() => {
    let filtered = containers.filter(container => {
      const matchesSearch = container.name?.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = !filters.type || container.type === filters.type;
      const matchesStatus = !filters.status || container.status === filters.status;
      const matchesZone = !filters.zone || container.zoneId === filters.zone;
      const matchesCapacityMin = !filters.capacityMin || container.capacity >= parseInt(filters.capacityMin);
      const matchesCapacityMax = !filters.capacityMax || container.capacity <= parseInt(filters.capacityMax);

      return matchesSearch && matchesType && matchesStatus && matchesZone && matchesCapacityMin && matchesCapacityMax;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [containers, filters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedContainers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContainers = filteredAndSortedContainers.slice(startIndex, startIndex + itemsPerPage);

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
        // Fermer le panel si c'est le container sélectionné
        if (selectedContainerId === id) {
          setSelectedContainerId(null);
          setSelectedContainerDetails(null);
        }
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
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

  const resetFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      zone: '',
      capacityMin: '',
      capacityMax: '',
    });
    setCurrentPage(1);
  };

  // Récupérer les détails du container au clic
  const handleSelectContainer = async (containerId) => {
    setSelectedContainerId(containerId);
    setLoadingDetails(true);
    setDetailError(null);
    try {
      console.log(' Fetching container details for:', containerId);
      const details = await getContainer(containerId);
      console.log('📦 Container details received:', details);
      
      if (!details || !details.id) {
        throw new Error('Données invalides reçues du serveur');
      }
      
      setSelectedContainerDetails(details);
    } catch (err) {
      console.error('❌ Error fetching container details:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erreur inconnue';
      setDetailError(`Erreur: ${errorMsg}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedContainerId(null);
    setSelectedContainerDetails(null);
    setDetailError(null);
  };

  // Générer les numéros de page à afficher (mode compact)
  const getPaginationPages = () => {
    const totalPages = Math.ceil(filteredAndSortedContainers.length / itemsPerPage);
    const maxVisible = 3; // Afficher max 3 pages
    const pages = [];

    if (totalPages <= 5) {
      // Afficher toutes les pages si <= 5
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher: première, autour de la courante, dernière
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages, currentPage + 1);

      if (start > 1) pages.push(1);
      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('...');
      if (end < totalPages) pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="containers-wrapper">
      <div className="containers-main">
      {/* En-tête avec bouton ajouter */}
      <div className="containers-header">
        <div className="containers-header-text">
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

      {/* Alerte erreur */}
      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn-close-alert">
            ×
          </button>
        </div>
      )}

      {/* Formulaire */}
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

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: CT-001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Zone *</label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="actif">Actif</option>
                  <option value="retire">Retiré</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
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
              <button
                type="submit"
                className="btn-submit"
              >
                {editingId ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section Filtres */}
      <div className="filters-card">
        <div className="filters-header">
          <h3>Filtres</h3>
          <button
            onClick={resetFilters}
            className="btn-reset"
          >
            Réinitialiser
          </button>
        </div>

        <div className="filters-grid">
          {/* Recherche */}
          <div className="filter-group">
            <label>Rechercher</label>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Nom du conteneur..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Type */}
          <div className="filter-group">
            <label>Type</label>
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setCurrentPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="standard">Standard</option>
              <option value="selective">Sélectif</option>
              <option value="organic">Organique</option>
              <option value="hazardous">Dangereux</option>
            </select>
          </div>

          {/* Statut */}
          <div className="filter-group">
            <label>Statut</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(1);
              }}
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="retire">Retiré</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Zone */}
          <div className="filter-group">
            <label>Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => {
                setFilters({ ...filters, zone: e.target.value });
                setCurrentPage(1);
              }}
            >
              <option value="">Tous</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacité Min */}
          <div className="filter-group">
            <label>Capacité Min (L)</label>
            <input
              type="number"
              placeholder="Min"
              value={filters.capacityMin}
              onChange={(e) => {
                setFilters({ ...filters, capacityMin: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Capacité Max */}
          <div className="filter-group">
            <label>Capacité Max (L)</label>
            <input
              type="number"
              placeholder="Max"
              value={filters.capacityMax}
              onChange={(e) => {
                setFilters({ ...filters, capacityMax: e.target.value });
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <p>Chargement...</p>
          </div>
        ) : paginatedContainers.length === 0 ? (
          <div className="empty-state">
            <p>Aucun conteneur trouvé</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')}>
                      Conteneur <span className="sort-indicator">{sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</span>
                    </th>
                    <th onClick={() => handleSort('type')}>
                      Type <span className="sort-indicator">{sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</span>
                    </th>
                    <th onClick={() => handleSort('capacity')}>
                      Capacité <span className="sort-indicator">{sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</span>
                    </th>
                    <th onClick={() => handleSort('zoneId')}>
                      Zone <span className="sort-indicator">{sortConfig.key === 'zoneId' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</span>
                    </th>
                    <th onClick={() => handleSort('status')}>
                      Statut <span className="sort-indicator">{sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</span>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContainers.map((container) => (
                    <tr 
                      key={container.id}
                      onClick={() => handleSelectContainer(container.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="container-cell">
                          <div className={`container-icon ${container.type}`}>
                            <Box size={20} />
                          </div>
                          <div className="container-info">
                            <h4>{container.name}</h4>
                            <p>{container.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${container.type}`}>
                          {container.type}
                        </span>
                      </td>
                      <td>{container.capacity}L</td>
                      <td>{container.zoneId}</td>
                      <td>
                        <span className={`badge badge-${container.status}`}>
                          {container.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(container)}
                            className="btn-icon"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(container.id)}
                            className="btn-icon btn-danger"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <p className="pagination-info">
                  Affichage {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredAndSortedContainers.length)} sur {filteredAndSortedContainers.length} conteneurs
                </p>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {getPaginationPages().map((page, idx) => (
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="pagination-dots">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Details Panel */}
      <div className={`details-panel ${!selectedContainerId ? 'hidden' : ''}`}>
        <div className="panel-header">
          <h3>Détails du conteneur</h3>
          <button
            className="btn-close-panel"
            onClick={handleClosePanel}
          >
            <X size={20} />
          </button>
        </div>

        <div className="panel-body">
          {detailError ? (
            <div className="loading-spinner">
              <p style={{ color: '#dc2626' }}>❌ {detailError}</p>
            </div>
          ) : loadingDetails ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : selectedContainerDetails ? (
            <>
              <div className="detail-item">
                <div className={`icon-container ${selectedContainerDetails.type}`}>
                  <Box size={24} />
                </div>
                <div className="detail-label">Nom</div>
                <div className="detail-value">{selectedContainerDetails.name}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">ID</div>
                <div className="detail-value">{selectedContainerDetails.id}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Type</div>
                <div className="detail-badge">
                  <span className={`badge badge-${selectedContainerDetails.type}`}>
                    {selectedContainerDetails.type}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Capacité</div>
                <div className="detail-value">{selectedContainerDetails.capacity}L</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Zone</div>
                <div className="detail-value">
                  {zones.find(z => z.id === selectedContainerDetails.zoneId)?.name || selectedContainerDetails.zoneId}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Statut</div>
                <div className="detail-badge">
                  <span className={`badge badge-${selectedContainerDetails.status}`}>
                    {selectedContainerDetails.status}
                  </span>
                </div>
              </div>

              {selectedContainerDetails.created_at && (
                <div className="detail-item">
                  <div className="detail-label">Créé le</div>
                  <div className="detail-value">
                    {new Date(selectedContainerDetails.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              )}

              {selectedContainerDetails.date_installation && (
                <div className="detail-item">
                  <div className="detail-label">Date d'installation</div>
                  <div className="detail-value">
                    {new Date(selectedContainerDetails.date_installation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="loading-spinner">
              <p>Sélectionnez un conteneur</p>
            </div>
          )}
        </div>

        {selectedContainerDetails && (
          <div className="panel-actions">
            <button
              className="panel-btn panel-btn-edit"
              onClick={() => {
                setFormData({
                  name: selectedContainerDetails.name,
                  type: selectedContainerDetails.type,
                  capacity: selectedContainerDetails.capacity,
                  zoneId: selectedContainerDetails.zoneId,
                  status: selectedContainerDetails.status,
                });
                setEditingId(selectedContainerDetails.id);
                setShowForm(true);
                handleClosePanel();
              }}
            >
              <Edit2 size={18} />
              Modifier
            </button>
            <button
              className="panel-btn panel-btn-delete"
              onClick={() => handleDelete(selectedContainerDetails.id)}
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

