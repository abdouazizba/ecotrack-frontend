/**
 * Data Transformers - Convert between Frontend and Backend formats
 */

// ============================================
// USER TRANSFORMER
// ============================================

export const transformUserToFrontend = (backendData) => {
  if (!backendData) return null;
  return {
    id: backendData.id,
    email: backendData.email,
    firstName: backendData.prenom || backendData.firstName || backendData.first_name || '',
    lastName: backendData.nom || backendData.lastName || backendData.last_name || '',
    role: backendData.role,
    phone: backendData.phone || backendData.telephone || '',
    status: backendData.status || backendData.statut || 'active',
    is_active: backendData.is_active,
    created_at: backendData.created_at || backendData.createdAt,
    score_reputation: backendData.score_reputation ?? backendData.citoyen?.score_reputation ?? null,
    nombre_signalements: backendData.nombre_signalements ?? backendData.citoyen?.nombre_signalements ?? null,
  };
};

export const transformUserToBackend = (frontendData) => {
  const payload = {
    email: frontendData.email,
    prenom: frontendData.firstName,
    nom: frontendData.lastName,
    role: frontendData.role,
    telephone: frontendData.phone || undefined,
    statut: frontendData.status,
  };
  if (frontendData.password) payload.password = frontendData.password;
  return payload;
};

export const transformUsersArrayToFrontend = (backendArray) => {
  return (Array.isArray(backendArray) ? backendArray : []).map(transformUserToFrontend);
};

// ============================================
// ZONES TRANSFORMERS
// ============================================

export const transformZoneToBackend = (frontendData) => {
  const nom = frontendData.nom || frontendData.name || '';
  const letterMatch = nom.match(/^Zone\s+([A-Z0-9]+)/i);
  const autoCode = letterMatch ? `ZONE-${letterMatch[1].toUpperCase()}` : `ZONE-${Date.now()}`;
  const result = {
    nom,
    code_zone: frontendData.code_zone || autoCode,
    description: frontendData.description,
    population_estimee: frontendData.population_estimee || 0,
    latitude: parseFloat(frontendData.latitude) || 0,
    longitude: parseFloat(frontendData.longitude) || 0,
    is_active: frontendData.is_active !== false,
  };
  if (frontendData.geometrie) result.geometrie = frontendData.geometrie;
  return result;
};

export const transformZoneToFrontend = (backendData) => {
  if (!backendData) return null;

  return {
    id: backendData.id,
    nom: backendData.nom || backendData.name,
    code_zone: backendData.code_zone,
    description: backendData.description,
    population_estimee: backendData.population_estimee || 0,
    latitude: parseFloat(backendData.latitude) || 0,
    longitude: parseFloat(backendData.longitude) || 0,
    is_active: backendData.is_active ?? true,
    geometrie: backendData.geometrie,
    created_at: backendData.createdAt || backendData.created_at,
  };
};

// ============================================
// CONTENEURS TRANSFORMERS
// ============================================

export const transformConteneurToBackend = (frontendData) => {
  return {
    code_conteneur: frontendData.code_conteneur || `CONT-${Date.now()}`,
    type_conteneur: frontendData.type || 'standard',
    capacite: frontendData.capacity || 100,
    latitude: frontendData.latitude || 0,
    longitude: frontendData.longitude || 0,
    statut: frontendData.status || 'actif',
    id_zone: frontendData.zoneId,
    date_installation: frontendData.date_installation || new Date(),
    notes: frontendData.notes,
  };
};

export const transformConteneurToFrontend = (backendData) => {
  if (!backendData) return {};

  const containerId = backendData.id || backendData._id || 'unknown';

  // Le back peut renvoyer latitude/longitude à plat OU imbriqué dans localisation{}
  const lat = parseFloat(backendData.latitude ?? backendData.localisation?.latitude) || 0;
  const lng = parseFloat(backendData.longitude ?? backendData.localisation?.longitude) || 0;

  return {
    id: containerId,
    code_conteneur: backendData.code_conteneur,
    name: backendData.code_conteneur || `Conteneur ${typeof containerId === 'string' ? containerId.slice(0, 8) : 'N/A'}`,
    // Back peut renvoyer type_conteneur (create) OU type (schema)
    type: backendData.type_conteneur || backendData.type,
    // Back peut renvoyer capacite (create) OU capacite_litres (schema)
    capacity: backendData.capacite ?? backendData.capacite_litres,
    latitude: lat,
    longitude: lng,
    // Back peut renvoyer statut (actif/maintenance/retire) OU status (active/maintenance/full)
    status: backendData.statut || backendData.status,
    // Back peut renvoyer id_zone (create) OU zone_id (schema)
    zoneId: backendData.id_zone || backendData.zone_id,
    fillLevel: backendData.taux_remplissage ?? null,
    date_installation: backendData.date_installation || backendData.date_creation,
    notes: backendData.notes,
    zone: backendData.zone ? transformZoneToFrontend(backendData.zone) : null,
    mesures: backendData.mesures ? backendData.mesures.map(transformMesureToFrontend) : [],
    created_at: backendData.createdAt || backendData.created_at || backendData.date_creation,
  };
};

// ============================================
// MESURES TRANSFORMERS
// ============================================

export const transformMesureToBackend = (frontendData) => {
  return {
    date_mesure: frontendData.date_mesure || new Date(),
    taux_remplissage: frontendData.fillLevel || frontendData.taux_remplissage || 0,
    temperature: frontendData.temperature,
    batterie: frontendData.batterie,
    signal_force: frontendData.signal_force,
    id_conteneur: frontendData.id_conteneur || frontendData.containerId,
  };
};

export const transformMesureToFrontend = (backendData) => {
  return {
    id: backendData.id,
    date_mesure: backendData.date_mesure,
    fillLevel: backendData.taux_remplissage,
    temperature: backendData.temperature,
    batterie: backendData.batterie,
    signal_force: backendData.signal_force,
    id_conteneur: backendData.id_conteneur,
    id_capteur: backendData.id_capteur || null,
  };
};

// ============================================
// SIGNALEMENTS TRANSFORMERS
// ============================================

const SIGNALEMENT_TYPE_TO_BACKEND = {
  'overflowing': 'DÉBORDEMENT',
  'full': 'CONTENEUR_PLEIN',
  'damaged': 'CONTENEUR_ENDOMMAGÉ',
  'smell': 'MAUVAISE_ODEUR',
  'other': 'AUTRE',
};

const SIGNALEMENT_TYPE_TO_FRONTEND = {
  'DÉBORDEMENT': 'overflowing',
  'CONTENEUR_PLEIN': 'full',
  'CONTENEUR_ENDOMMAGÉ': 'damaged',
  'MAUVAISE_ODEUR': 'smell',
  'AUTRE': 'other',
};

const SIGNALEMENT_STATUS_TO_BACKEND = {
  'pending': 'OUVERT',
  'in_progress': 'EN_COURS_DE_TRAITEMENT',
  'closed': 'FERMÉ',
  'rejected': 'REJETÉ',
};

// Gère les deux formats possibles : français majuscule (réel) et anglais minuscule (schema swagger)
const SIGNALEMENT_STATUS_TO_FRONTEND = {
  'OUVERT': 'pending',
  'EN_COURS_DE_TRAITEMENT': 'in_progress',
  'FERMÉ': 'closed',
  'REJETÉ': 'rejected',
  // Valeurs du schema swagger (anglais minuscule) — défense si le back les retourne
  'open': 'pending',
  'in_progress': 'in_progress',
  'closed': 'closed',
  'rejected': 'rejected',
};

const SIGNALEMENT_PRIORITY_TO_BACKEND = {
  'low': 'BASSE',
  'medium': 'NORMALE',
  'high': 'HAUTE',
  'critical': 'CRITIQUE',
};

const SIGNALEMENT_PRIORITY_TO_FRONTEND = {
  'BASSE': 'low',
  'NORMALE': 'medium',
  'HAUTE': 'high',
  'CRITIQUE': 'critical',
};

export const transformSignalementToBackend = (frontendData) => {
  const payload = {
    type: SIGNALEMENT_TYPE_TO_BACKEND[frontendData.type] || 'AUTRE',
    description: frontendData.description,
    statut: SIGNALEMENT_STATUS_TO_BACKEND[frontendData.status] || 'OUVERT',
    priorite: SIGNALEMENT_PRIORITY_TO_BACKEND[frontendData.priority] || 'NORMALE',
    id_conteneur: frontendData.id_conteneur || frontendData.containerId,
    // id_utilisateur injecté automatiquement par le back depuis le JWT
    latitude: frontendData.latitude,
    longitude: frontendData.longitude,
    photo_url: frontendData.photo_url,
  };
  if (frontendData.motif_rejet) payload.motif_rejet = frontendData.motif_rejet;
  if (frontendData.agent_id)    payload.agent_id    = frontendData.agent_id;
  return payload;
};

export const transformSignalementToFrontend = (backendData) => {
  return {
    id:            backendData.id,
    titre:         backendData.titre || null,
    type:          SIGNALEMENT_TYPE_TO_FRONTEND[backendData.type] || 'other',
    description:   backendData.description || null,
    adresse:       backendData.adresse || null,
    source:        backendData.source || backendData.type_signalement || null,
    status:        SIGNALEMENT_STATUS_TO_FRONTEND[backendData.statut || backendData.status] || 'pending',
    priority:      SIGNALEMENT_PRIORITY_TO_FRONTEND[backendData.priorite] || 'medium',
    id_conteneur:  backendData.id_conteneur,
    id_utilisateur: backendData.id_utilisateur,
    id_zone:       backendData.id_zone || null,
    citoyen_id:    backendData.citoyen_id,
    agent_id:      backendData.agent_id || backendData.id_agent || null,
    latitude:      backendData.latitude  ?? backendData.localisation?.latitude  ?? null,
    longitude:     backendData.longitude ?? backendData.localisation?.longitude ?? null,
    photo_url:              backendData.photo_url || backendData.photo || null,
    photo_resolution_url:   backendData.photo_resolution_url || null,
    motif_rejet:            backendData.motif_rejet || null,
    date_resolution:        backendData.date_resolution || null,
    notes_resolution:       backendData.notes_resolution || null,
    id_tournee:    backendData.id_tournee || null,
    created_at:    backendData.date_creation || backendData.date_signalement
                   || backendData.createdAt  || backendData.created_at || null,
    updated_at:    backendData.updatedAt || backendData.updated_at || null,
  };
};

// ============================================
// TOURNÉES TRANSFORMERS
// ============================================

const TOURNEE_STATUS_TO_FRONTEND = {
  'PLANIFIÉE':            'pending',
  'EN_ATTENTE':           'pending',   // fallback seeds
  'EN_COURS':             'in_progress',
  'TERMINÉE':             'done',
  'TERMINEE':             'done',
  'ANNULÉE':              'cancelled',
  // valeurs déjà en anglais (seed JS)
  'pending':              'pending',
  'in_progress':          'in_progress',
  'done':                 'done',
  'cancelled':            'cancelled',
};


const TOURNEE_STATUS_TO_BACKEND = {
  'pending':     'PLANIFIÉE',
  'in_progress': 'EN_COURS',
  'done':        'TERMINÉE',
  'cancelled':   'ANNULÉE',
};

export const transformTourneeToFrontend = (raw) => {
  if (!raw) return null;
  const agent      = raw.agent || {};
  const zone       = raw.zone  || {};
  const agentsArr  = Array.isArray(raw.agents) ? raw.agents : [];
  const conducteur = agentsArr.find((a) => a.role === 'CONDUCTEUR') || agentsArr[0] || {};

  return {
    id:           raw.id,
    code:         raw.code || null,
    titre:        raw.titre || raw.nom || raw.code || `Tournée ${raw.id?.slice(0, 8)}`,
    zone_id:      raw.zone_id  || raw.id_zone  || raw.zoneId  || zone.id  || null,
    zone_nom:     raw.zone_nom || zone.nom || zone.name || null,
    agent_id:     raw.agent_id || raw.id_agent || raw.agentId
                  || agent.id || conducteur.id_agent || null,
    agent_nom:    raw.agent_nom
                  || (agent.prenom || agent.firstName
                      ? `${agent.prenom || agent.firstName} ${agent.nom || agent.lastName}`
                      : null)
                  || null,
    agents:       agentsArr.map((a) => ({
      id: a.id_agent || a.id,
      role: a.role || 'COLLECTEUR',
      nom: a.nom || a.lastName || '',
      prenom: a.prenom || a.firstName || '',
    })),
    date_prevue:  raw.date_prevue || raw.date || raw.datePrevue || null,
    status:       TOURNEE_STATUS_TO_FRONTEND[raw.statut || raw.status] || 'pending',
    heure_debut:          raw.heure_debut || null,
    heure_fin:            raw.heure_fin   || null,
    distance_km:          raw.distance_km ?? null,
    conteneurs_collectes: raw.conteneurs_collectes ?? 0,
    notes:                raw.notes || null,
    signalements: Array.isArray(raw.signalements)
                    ? raw.signalements.map(transformSignalementToFrontend)
                    : [],
    created_at:   raw.created_at || raw.createdAt || null,
    updated_at:   raw.updated_at || raw.updatedAt || null,
  };
};


export const transformTourneesArrayToFrontend = (arr) =>
  (Array.isArray(arr) ? arr : []).map(transformTourneeToFrontend);

export const transformTourneeToBackend = (data) => {
  if (!data) return {};
  const out = {};
  if (data.zone_id   !== undefined) out.id_zone    = data.zone_id;
  if (data.date_prevue !== undefined) out.date     = data.date_prevue;
  if (data.status    !== undefined) out.statut      = TOURNEE_STATUS_TO_BACKEND[data.status] || data.status;
  if (data.heure_debut !== undefined) out.heure_debut = data.heure_debut;
  if (data.heure_fin   !== undefined) out.heure_fin   = data.heure_fin;
  if (data.distance_km !== undefined) out.distance_km = data.distance_km;
  if (data.conteneurs_collectes !== undefined) out.conteneurs_collectes = data.conteneurs_collectes;
  if (data.notes     !== undefined) out.notes       = data.notes;
  if (data.agents    !== undefined) out.agents      = data.agents;
  if (data.agent_id  !== undefined && !data.agents) {
    out.agents = [{ id_agent: data.agent_id, role: 'CONDUCTEUR' }];
  }
  return out;
};

// ============================================
// CAPTEURS TRANSFORMERS
// ============================================

export const transformCapteurToFrontend = (d) => {
  if (!d) return null;
  return {
    id:              d.id,
    code_capteur:    d.code_capteur,
    type:            d.type,
    statut:          d.statut || 'ACTIF',
    batterie:        d.batterie ?? null,
    id_conteneur:    d.id_conteneur,
    conteneur:       d.conteneur ? transformConteneurToFrontend(d.conteneur) : null,
    valeur_actuelle: d.valeur_actuelle ?? null,
    derniere_mesure: d.derniere_mesure ?? null,
    created_at:      d.createdAt || d.created_at,
  };
};

export const transformCapteurToBackend = (d) => {
  const payload = {
    code_capteur: d.code_capteur,
    type:         d.type,
    id_conteneur: d.id_conteneur,
    statut:       d.statut || 'ACTIF',
  };
  if (d.batterie !== undefined && d.batterie !== '') {
    payload.batterie = Number(d.batterie);
  }
  return payload;
};

export const transformCapteursArrayToFrontend = (arr) =>
  (Array.isArray(arr) ? arr : []).map(transformCapteurToFrontend);

// ============================================
// SENSOR ENRICHMENT
// ============================================

/**
 * Enriches each container's fillLevel from sensor data.
 *
 * Priority:
 *   1. REMPLISSAGE capteur → valeur_actuelle  (most accurate)
 *   2. Any capteur        → derniere_mesure.taux_remplissage
 *      (every measurement row stores taux_remplissage regardless of sensor type)
 *   3. Static taux_remplissage from the container row (fallback)
 */
export function enrichContainersWithSensors(containers, capteurs) {
  // Pass 1: REMPLISSAGE sensor fill level (authoritative)
  const fillFromRemplissage = {};
  // Pass 2: taux_remplissage from any sensor's last measurement (fallback)
  const fillFromMesure = {};

  capteurs.forEach((cap) => {
    const containerId = cap.conteneur?.id || cap.id_conteneur;
    if (!containerId) return;

    if (cap.type === 'REMPLISSAGE' && cap.valeur_actuelle != null) {
      fillFromRemplissage[containerId] = cap.valeur_actuelle;
    }

    if (cap.derniere_mesure?.taux_remplissage != null && fillFromMesure[containerId] == null) {
      fillFromMesure[containerId] = cap.derniere_mesure.taux_remplissage;
    }
  });

  return containers.map((c) => ({
    ...c,
    fillLevel:
      fillFromRemplissage[c.id] != null ? fillFromRemplissage[c.id] :
      fillFromMesure[c.id]      != null ? fillFromMesure[c.id]      :
      c.fillLevel,
  }));
}

// ============================================
// BATCH TRANSFORMERS
// ============================================

export const transformZonesArrayToFrontend = (backendArray) => {
  return (Array.isArray(backendArray) ? backendArray : []).map(transformZoneToFrontend);
};

export const transformConteneurArrayToFrontend = (backendArray) => {
  return (Array.isArray(backendArray) ? backendArray : []).map(transformConteneurToFrontend);
};

export const transformSignalementsArrayToFrontend = (backendArray) => {
  return (Array.isArray(backendArray) ? backendArray : []).map(transformSignalementToFrontend);
};
