import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import './FilterPanel.css';

export default function FilterPanel({ 
  filters = {}, 
  onFilterChange = () => {}, 
  onClose = () => {},
  title = 'Filtres'
}) {
  const [activeFilters, setActiveFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <div className="filter-title">
          <Filter size={20} />
          <h3>{title}</h3>
        </div>
        <button 
          className="filter-close"
          onClick={onClose}
          aria-label="Fermer les filtres"
        >
          <X size={20} />
        </button>
      </div>

      <div className="filter-body">
        {/* Date Range */}
        <div className="filter-group">
          <label className="filter-label">Période</label>
          <div className="filter-date-range">
            <input 
              type="date"
              className="form-input"
              value={activeFilters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="De"
            />
            <span className="date-separator">→</span>
            <input 
              type="date"
              className="form-input"
              value={activeFilters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="À"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">Statut</label>
          <select 
            className="form-input"
            value={activeFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="pending">En attente</option>
            <option value="completed">Complété</option>
          </select>
        </div>

        {/* Zone Filter */}
        <div className="filter-group">
          <label className="filter-label">Zone</label>
          <select 
            className="form-input"
            value={activeFilters.zone || ''}
            onChange={(e) => handleFilterChange('zone', e.target.value)}
          >
            <option value="">Toutes les zones</option>
            <option value="zone-a">Zone A - Paris</option>
            <option value="zone-b">Zone B - Saint-Denis</option>
            <option value="zone-c">Zone C - Essonne</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-group">
          <label className="filter-label">Priorité</label>
          <select 
            className="form-input"
            value={activeFilters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">Toutes les priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Normale</option>
            <option value="high">Haute</option>
            <option value="critical">Critique</option>
          </select>
        </div>

        {/* Search */}
        <div className="filter-group">
          <label className="filter-label">Recherche</label>
          <input 
            type="text"
            className="form-input"
            placeholder="Rechercher..."
            value={activeFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-footer">
        <button 
          className="btn btn-secondary"
          onClick={handleReset}
        >
          Réinitialiser
        </button>
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          Appliquer filtres
        </button>
      </div>
    </div>
  );
}
