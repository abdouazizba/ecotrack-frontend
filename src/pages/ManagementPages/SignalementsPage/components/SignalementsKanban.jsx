import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSignalements, patchSignalement, deleteSignalement } from '../../../../services/api';
import { Trash2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './SignalementsKanban.css';

const STATUSES = [
  { id: 'pending', label: 'En attente', color: '#ea580c', icon: AlertCircle },
  { id: 'in_progress', label: 'En cours', color: '#f59e0b', icon: Clock },
  { id: 'closed', label: 'Clôturé', color: '#10b981', icon: CheckCircle },
];

const SOURCES = {
  all: 'Tous',
  agent: 'Agents',
  citizen: 'Citoyens',
};

export default function SignalementsKanban({ initialSource = 'all', title = 'Gestion des Signalements' }) {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(initialSource);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadSignalements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSignalements();
      setSignalements(data);
    } catch (err) {
      setError('Erreur lors du chargement des signalements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les signalements
  useEffect(() => {
    loadSignalements();
  }, [loadSignalements]);

  // Filtrer par source
  const filteredSignalements = useMemo(() => {
    if (selectedSource === 'all') return signalements;
    return signalements.filter(s => {
      const source = s.source || s.type_signalement || 'agent';
      return source.toLowerCase().includes(selectedSource);
    });
  }, [signalements, selectedSource]);

  // Grouper par status
  const grouped = useMemo(() => {
    const map = {};
    STATUSES.forEach(status => {
      map[status.id] = [];
    });
    
    filteredSignalements.forEach(sig => {
      const status = sig.status || 'pending';
      if (!map[status]) map[status] = [];
      map[status].push(sig);
    });
    
    return map;
  }, [filteredSignalements]);

  const handleStatusChange = useCallback(async (signalementId, newStatus) => {
    try {
      await patchSignalement(signalementId, { status: newStatus });
      await loadSignalements();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  }, [loadSignalements]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await deleteSignalement(id);
        await loadSignalements();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  }, [loadSignalements]);

  if (loading) {
    return <div className="kanban-loading">Chargement...</div>;
  }

  return (
    <div className="kanban-container">
      {/* Filtre source */}
      <div className="kanban-header">
        <h2>{title}</h2>
        <div className="kanban-filters">
          <div className="filter-group">
            <label>Afficher :</label>
            <select 
              value={selectedSource} 
              onChange={(e) => setSelectedSource(e.target.value)}
              className="filter-select"
            >
              {Object.entries(SOURCES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="kanban-error">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="kanban-board">
        {STATUSES.map(status => {
          const StatusIcon = status.icon;
          const items = grouped[status.id] || [];
          
          return (
            <div key={status.id} className="kanban-column">
              <div className="column-header" style={{ borderTopColor: status.color }}>
                <StatusIcon size={20} style={{ color: status.color }} />
                <h3>{status.label}</h3>
                <span className="column-count">{items.length}</span>
              </div>

              <div className="cards-container">
                {items.length === 0 ? (
                  <div className="empty-column">Aucun signalement</div>
                ) : (
                  items.map(sig => (
                    <SignalementCard
                      key={sig.id}
                      signalement={sig}
                      status={status}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onViewDetails={() => {
                        setSelectedSignalement(sig);
                        setShowDetailModal(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSignalement && (
        <SignalementModal
          signalement={selectedSignalement}
          onClose={() => setShowDetailModal(false)}
          onDelete={() => {
            handleDelete(selectedSignalement.id);
            setShowDetailModal(false);
          }}
        />
      )}
    </div>
  );
}

// Composant Carte Signalement
function SignalementCard({ signalement, status, onStatusChange, onDelete, onViewDetails }) {
  const source = signalement.source || signalement.type_signalement || 'agent';
  const sourceLabel = source.toLowerCase().includes('agent') ? 'Agent' : 'Citoyen';
  const sourceColor = source.toLowerCase().includes('agent') ? '#3b82f6' : '#8b5cf6';

  return (
    <div className="signalement-card">
      <div className="card-header">
        <div className="card-title-section">
          <h4>{signalement.titre || signalement.type_dechet || 'Signalement'}</h4>
          <span className="source-badge" style={{ backgroundColor: sourceColor }}>
            {sourceLabel}
          </span>
        </div>
        <div className="card-actions">
          <button 
            title="Voir détails"
            onClick={onViewDetails}
            className="action-btn view"
          >
            <Eye size={16} />
          </button>
          <button 
            title="Supprimer"
            onClick={() => onDelete(signalement.id)}
            className="action-btn delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="card-content">
        <p className="description">
          {signalement.description || signalement.adresse || 'Pas de description'}
        </p>
        
        {signalement.localisation && (
          <div className="location-info">
            📍 {signalement.localisation}
          </div>
        )}

        {signalement.photo && (
          <div className="card-image">
            <img 
              src={signalement.photo} 
              alt="Signalement"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}

        <div className="card-meta">
          <span className="date">
            {new Date(signalement.date_signalement || signalement.createdAt).toLocaleDateString('fr-FR')}
          </span>
          {signalement.taux_urgence && (
            <span className={`urgency urgency-${signalement.taux_urgence}`}>
              Urgence: {signalement.taux_urgence}
            </span>
          )}
        </div>
      </div>

      <div className="card-footer">
        <div className="status-buttons">
          {['pending', 'in_progress', 'closed'].map(statusId => (
            <button
              key={statusId}
              className={`status-btn ${signalement.status === statusId ? 'active' : ''}`}
              onClick={() => onStatusChange(signalement.id, statusId)}
              title={`Marquer comme ${STATUSES.find(s => s.id === statusId)?.label}`}
            >
              {STATUSES.find(s => s.id === statusId)?.label.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Modal Détails
function SignalementModal({ signalement, onClose, onDelete }) {
  const source = signalement.source || signalement.type_signalement || 'agent';
  const sourceLabel = source.toLowerCase().includes('agent') ? 'Agent' : 'Citoyen';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{signalement.titre || 'Détails du Signalement'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {signalement.photo && (
            <img src={signalement.photo} alt="Signalement" className="modal-image" />
          )}

          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Titre :</span>
              <span>{signalement.titre || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Source :</span>
              <span>{sourceLabel}</span>
            </div>
            <div className="detail-item">
              <span className="label">Etat :</span>
              <span>{signalement.status || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="label">Date :</span>
              <span>{new Date(signalement.date_signalement || signalement.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="detail-item full-width">
              <span className="label">Description :</span>
              <p>{signalement.description || signalement.adresse || 'N/A'}</p>
            </div>
            {signalement.localisation && (
              <div className="detail-item full-width">
                <span className="label">Localisation :</span>
                <p>{signalement.localisation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
          <button className="btn btn-danger" onClick={() => {
            onDelete();
            onClose();
          }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
