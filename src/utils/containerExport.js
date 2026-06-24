import { exportToCsv } from './exportCsv';

const CONTAINER_HEADERS = [
  { key: 'code',        label: 'Code' },
  { key: 'type',        label: 'Type' },
  { key: 'zone',        label: 'Zone' },
  { key: 'statut',      label: 'Statut' },
  { key: 'remplissage', label: 'Remplissage %' },
  { key: 'adresse',     label: 'Adresse' },
  { key: 'latitude',    label: 'Latitude' },
  { key: 'longitude',   label: 'Longitude' },
];

/**
 * Export a list of containers to CSV.
 *
 * @param {Array<Object>} containers - Raw container objects from the API
 */
export function exportContainersCsv(containers) {
  const rows = containers.map((c) => ({
    code:        c.code || c.id || '',
    type:        c.type || '',
    zone:        c.zone_nom || c.zoneId || '',
    statut:      c.status || c.statut || '',
    remplissage: c.fill_level != null ? c.fill_level : (c.remplissage != null ? c.remplissage : ''),
    adresse:     c.adresse || c.address || '',
    latitude:    c.latitude ?? c.lat ?? '',
    longitude:   c.longitude ?? c.lng ?? '',
  }));

  const today = new Date().toISOString().slice(0, 10);
  exportToCsv(`conteneurs_${today}.csv`, CONTAINER_HEADERS, rows);
}
