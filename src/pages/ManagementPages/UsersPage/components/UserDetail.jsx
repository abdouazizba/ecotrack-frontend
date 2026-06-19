import React from 'react';
import { Edit2, Trash2, Mail, Calendar, Shield, Lock } from 'lucide-react';
import { UserAvatar } from './UsersList';

const ROLE_META = {
  super_admin: { label: 'Super Admin', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
  admin:       { label: 'Admin',       color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  agent:       { label: 'Agent',       color: '#0284c7', bg: 'rgba(2,132,199,0.12)'  },
  citoyen:     { label: 'Citoyen',     color: '#65a30d', bg: 'rgba(101,163,13,0.12)' },
};

const STATUS_META = {
  active:   { label: 'Actif',   color: '#16a34a', bg: 'rgba(22,163,74,0.12)'   },
  inactive: { label: 'Inactif', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const canManage = (actorRole, targetRole) => {
  if (actorRole === 'super_admin') return true;
  if (actorRole === 'admin') return targetRole === 'agent' || targetRole === 'citoyen';
  return false;
};

export default function UserDetail({ user, currentUserRole, onEdit, onDelete }) {
  if (!user) {
    return (
      <div className="usr-detail-empty">
        <Shield size={48} strokeWidth={1.2} />
        <p>Sélectionnez un utilisateur pour voir ses détails</p>
      </div>
    );
  }

  const role   = ROLE_META[user.role]    || ROLE_META.agent;
  const status = STATUS_META[user.status] || STATUS_META.active;
  const name = (user.firstName || user.lastName)
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : user.email?.split('@')[0];

  const managed = canManage(currentUserRole, user.role);

  return (
    <div className="usr-detail">
      {/* header */}
      <div className="usr-detail-header">
        <UserAvatar user={user} size={56} />
        <div className="usrd-title">
          <h2>{name}</h2>
          <div className="usrd-badges">
            <span className="usr-badge" style={{ color: role.color, background: role.bg }}>
              {role.label}
            </span>
            <span className="usr-badge" style={{ color: status.color, background: status.bg }}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="usrd-actions">
          {managed ? (
            <>
              <button className="usrd-btn-edit" onClick={() => onEdit(user)}>
                <Edit2 size={14} /> Modifier
              </button>
              <button
                className="usrd-btn-delete"
                onClick={() => window.confirm('Supprimer cet utilisateur ?') && onDelete(user.id)}
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <span className="usrd-readonly-badge" title="Accès lecture seule">
              <Lock size={13} /> Lecture seule
            </span>
          )}
        </div>
      </div>

      {/* info */}
      <div className="usr-detail-section">
        <h3><Mail size={13} /> Coordonnées</h3>
        <div className="usr-info-grid">
          <div className="usr-info-item">
            <span className="usr-info-label">Email</span>
            <span className="usr-info-value">{user.email || '—'}</span>
          </div>
          <div className="usr-info-item">
            <span className="usr-info-label">Téléphone</span>
            <span className="usr-info-value">{user.phone || '—'}</span>
          </div>
        </div>
      </div>

      <div className="usr-detail-section">
        <h3><Shield size={13} /> Accès</h3>
        <div className="usr-info-grid">
          <div className="usr-info-item">
            <span className="usr-info-label">Rôle</span>
            <span className="usr-info-value" style={{ color: role.color, fontWeight: 700 }}>
              {role.label}
            </span>
          </div>
          <div className="usr-info-item">
            <span className="usr-info-label">Statut</span>
            <span className="usr-info-value" style={{ color: status.color, fontWeight: 700 }}>
              {status.label}
            </span>
          </div>
          {user.created_at && (
            <div className="usr-info-item">
              <span className="usr-info-label">Créé le</span>
              <span className="usr-info-value">
                <Calendar size={12} />
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
