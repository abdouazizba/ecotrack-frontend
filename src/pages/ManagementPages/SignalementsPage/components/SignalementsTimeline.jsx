import React, { useState, useEffect, useMemo } from 'react';
import { getSignalements, getZones, getContainers } from '../../../../services/api';
import { Filter, Download, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import './SignalementsTimeline.css';

export default function SignalementsTimeline() {
  const [signalements, setSignalements] = useState([]);
  const [zones, setZones] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    priority: [],
    zone: [],
    type: [],
    status: [],
    dateFrom: '',
    dateTo: '',
    searchText: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [signalementsRes, zonesRes, containersRes] = await Promise.all([
        getSignalements(),
        getZones(),
        getContainers(),
      ]);

      setSignalements(Array.isArray(signalementsRes) ? signalementsRes : signalementsRes.data || []);
      setZones(Array.isArray(zonesRes) ? zonesRes : zonesRes.data || []);
      setContainers(Array.isArray(containersRes) ? containersRes : containersRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignalements = useMemo(() => {
    return signalements.filter((sig) => {
      if (filters.priority.length > 0 && !filters.priority.includes(sig.priority)) return false;
      if (filters.zone.length > 0 && !filters.zone.includes(sig.id_zone)) return false;
      if (filters.type.length > 0 && !filters.type.includes(sig.type)) return false;
      if (filters.status.length > 0 && !filters.status.includes(sig.status)) return false;
      if (filters.dateFrom && new Date(sig.date_creation) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(sig.date_creation) > new Date(filters.dateTo)) return false;
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchDescription = sig.description?.toLowerCase().includes(searchLower);
        const zone = zones.find((z) => z.id === sig.id_zone);
        const matchZone = zone?.name?.toLowerCase().includes(searchLower);
        if (!matchDescription && !matchZone) return false;
      }
      return true;
    });
  }, [signalements, filters, zones]);

  const sortedSignalements = [...filteredSignalements].sort(
    (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
  );

  const handleFilterChange = (key, value, isMulti = false) => {
    if (isMulti) {
      setFilters((prev) => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const resetFilters = () => {
    setFilters({
      priority: [],
      zone: [],
      type: [],
      status: [],
      dateFrom: '',
      dateTo: '',
      searchText: '',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={20} className="status-icon resolved" />;
      case 'pending':
        return <Clock size={20} className="status-icon pending" />;
      case 'in_progress':
        return <AlertCircle size={20} className="status-icon in-progress" />;
      default:
        return <AlertCircle size={20} className="status-icon" />;
    }
  };

  return (
    <div className="signalements-timeline-container">
      <div className="timeline-header">
        <div>
          <h2>Signalements</h2>
          <p className="subtitle">{sortedSignalements.length} signalement(s) trouvé(s)</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-filter ${showFilters ? 'active' : ''}`}
        >
          <Filter size={20} />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-actions">
            <button onClick={resetFilters} className="btn-reset">
              <X size={18} />
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      <div className="timeline-content">
        {loading ? (
          <div className="timeline-loading">
            <p>Chargement...</p>
          </div>
        ) : sortedSignalements.length === 0 ? (
          <div className="timeline-empty">
            <p>Aucun signalement</p>
          </div>
        ) : (
          <div className="timeline-list">
            {sortedSignalements.map((sig) => (
              <div key={sig.id} className="timeline-item">
                <div className="timeline-marker">
                  {getStatusIcon(sig.status)}
                </div>
                <div className="timeline-content-card">
                  <div className="card-header">
                    <h3>{sig.id_zone}</h3>
                    <span className="date">
                      {new Date(sig.date_creation).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p>{sig.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
