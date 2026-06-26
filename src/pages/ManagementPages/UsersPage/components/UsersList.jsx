import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Pagination from '../../../../components/common/Pagination';

const PAGE_SIZE = 20;

const ROLE_META = {
  admin: { label: 'Admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  agent: { label: 'Agent', color: '#0284c7', bg: 'rgba(2,132,199,0.12)' },
};

const STATUS_META = {
  active:   { label: 'Actif',   color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  inactive: { label: 'Inactif', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const ROLE_FILTERS = [
  ['all', 'Tous'],
  ['admin', 'Admin'],
  ['agent', 'Agent'],
];

function UserAvatar({ user, size = 36 }) {
  const initials = (
    (user.firstName?.[0] || '') + (user.lastName?.[0] || '')
  ).toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  const color = user.role === 'admin' ? '#7c3aed' : '#0284c7';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export { UserAvatar };

export default function UsersList({
  users, selectedId, filter, search, loading,
  onSelect, onFilterChange, onSearchChange, onCreateClick,
  hideFilters = false,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [users]);

  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="usr-left">
      {!hideFilters && (
        <>
          <div className="usr-left-header">
            <h2>Utilisateurs</h2>
            <button className="usr-btn-new" onClick={onCreateClick}>
              <Plus size={15} /> Nouveau
            </button>
          </div>

          <div className="usr-search">
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="usr-tabs">
            {ROLE_FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={`usr-tab ${filter === key ? 'active' : ''}`}
                onClick={() => onFilterChange(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="usr-list">
        {loading && <p className="usr-empty">Chargement…</p>}
        {!loading && users.length === 0 && (
          <p className="usr-empty">Aucun utilisateur trouvé</p>
        )}
        {paged.map((u) => {
          const role   = ROLE_META[u.role]   || ROLE_META.agent;
          const status = STATUS_META[u.status] || STATUS_META.active;
          const name = (u.firstName || u.lastName)
            ? `${u.firstName || ''} ${u.lastName || ''}`.trim()
            : u.email?.split('@')[0] || '—';
          return (
            <button
              key={u.id}
              className={`usr-card ${selectedId === u.id ? 'active' : ''}`}
              onClick={() => onSelect(u.id)}
            >
              <UserAvatar user={u} size={36} />
              <div className="usrc-info">
                <span className="usrc-name">{name}</span>
                <span className="usrc-email">{u.email}</span>
              </div>
              <div className="usrc-badges">
                <span className="usr-badge" style={{ color: role.color, background: role.bg }}>
                  {role.label}
                </span>
                <span className="usr-status-dot" style={{ background: status.color }} title={status.label} />
              </div>
            </button>
          );
        })}
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={users.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
