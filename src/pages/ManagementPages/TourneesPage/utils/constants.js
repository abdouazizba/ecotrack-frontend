export const TOURNEE_STATUS = {
  pending:     { label: 'Planifiée',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  in_progress: { label: 'En cours',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  done:        { label: 'Terminée',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelled:   { label: 'Annulée',    color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

export const TYPE_LABELS = {
  overflowing: 'Débordement',
  full:        'Conteneur plein',
  damaged:     'Conteneur endommagé',
  smell:       'Mauvaise odeur',
  other:       'Autre',
};

export const PRIORITY_META = {
  critical: { label: 'Critique', color: '#ef4444' },
  high:     { label: 'Haute',    color: '#f97316' },
  medium:   { label: 'Normale',  color: '#3b82f6' },
  low:      { label: 'Basse',    color: '#22c55e' },
};

export const STORAGE_KEY = 'ecotrack_tournees';

export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);
