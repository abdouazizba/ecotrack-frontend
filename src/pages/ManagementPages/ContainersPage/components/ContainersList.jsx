import React, { useState, useEffect } from 'react';
import { Box, Plus } from 'lucide-react';
import Pagination from '../../../../components/common/Pagination';

const PAGE_SIZE = 20;

const TYPE_META = {
  standard:  { label: 'Standard',   color: '#0d9488', bg: 'rgba(13,148,136,0.12)' },
  selective: { label: 'Sélectif',   color: '#2563eb', bg: 'rgba(37,99,235,0.12)' },
  organic:   { label: 'Organique',  color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  hazardous: { label: 'Dangereux',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
};

const STATUS_META = {
  actif:       { label: 'Actif',       color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  maintenance: { label: 'Maintenance', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  retire:      { label: 'Retiré',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  inactif:     { label: 'Inactif',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const STATUS_FILTERS = [
  ['all', 'Tous'],
  ['actif', 'Actif'],
  ['maintenance', 'Maintenance'],
  ['retire', 'Retiré'],
];

function FillBarMini({ value }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

export default function ContainersList({
  containers, zones, selectedId, filter, search, loading,
  onSelect, onFilterChange, onSearchChange, onCreateClick,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [containers]);

  const totalPages = Math.ceil(containers.length / PAGE_SIZE);
  const paged = containers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.nom || z.name]));

  return (
    <div className="cnt-left">
      <div className="cnt-left-header">
        <h2>Conteneurs</h2>
        <button className="cnt-btn-new" onClick={onCreateClick}>
          <Plus size={15} /> Nouveau
        </button>
      </div>

      {/* search */}
      <div className="cnt-search">
        <input
          type="text"
          placeholder="Rechercher un conteneur…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* status tabs */}
      <div className="cnt-tabs">
        {STATUS_FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`cnt-tab ${filter === key ? 'active' : ''}`}
            onClick={() => onFilterChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="cnt-list">
        {loading && <p className="cnt-empty">Chargement…</p>}
        {!loading && containers.length === 0 && (
          <p className="cnt-empty">Aucun conteneur trouvé</p>
        )}
        {paged.map((c) => {
          const type = TYPE_META[c.type] || TYPE_META.standard;
          const status = STATUS_META[c.status] || STATUS_META.actif;
          return (
            <button
              key={c.id}
              className={`cnt-card ${selectedId === c.id ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
              style={{ borderLeft: `3px solid ${status.color}` }}
            >
              <div className="cntc-top">
                <div className="cntc-icon" style={{ background: type.bg, color: type.color }}>
                  <Box size={16} />
                </div>
                <div className="cntc-info">
                  <span className="cntc-name">{c.name || c.code_conteneur || `#${c.id?.toString().slice(0, 6)}`}</span>
                  <span className="cntc-zone">{zoneMap[c.zoneId] || '—'}</span>
                </div>
                <span className="cnt-badge" style={{ color: status.color, background: status.bg }}>
                  {status.label}
                </span>
              </div>
              <FillBarMini value={c.fillLevel} />
            </button>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={containers.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
