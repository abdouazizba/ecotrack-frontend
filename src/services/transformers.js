/**
 * Data Transformers - Convert between Frontend and Backend formats
 */

// ============================================
// ZONES TRANSFORMERS
// ============================================

export const transformZoneToBackend = (frontendData) => {
  const backendData = {
    nom: frontendData.name,
    code_zone: frontendData.code_zone || `ZONE-${Date.now()}`,
    description: frontendData.description,
    population_estimee: frontendData.population_estimee || 0,
    latitude: parseFloat(frontendData.latitude) || 0,
    longitude: parseFloat(frontendData.longitude) || 0,
    is_active: frontendData.status !== 'inactive',
  };
  console.log('🔄 transformZoneToBackend:', {
    input: frontendData,
    output: backendData,
    latType: typeof backendData.latitude,
    lngType: typeof backendData.longitude,
  });
  return backendData;
};

export const transformZoneToFrontend = (backendData) => {
  return {
    id: backendData.id,
    name: backendData.nom,
    code_zone: backendData.code_zone,
    description: backendData.description,
    population_estimee: backendData.population_estimee || 0,
    latitude: backendData.latitude || 0,
    longitude: backendData.longitude || 0,
    status: backendData.is_active ? 'active' : 'inactive',
    created_at: backendData.createdAt,
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
  return {
    id: backendData.id,
    code_conteneur: backendData.code_conteneur,
    name: backendData.code_conteneur || `Conteneur ${backendData.id.slice(0, 8)}`,
    type: backendData.type_conteneur,
    capacity: backendData.capacite,
    latitude: backendData.latitude,
    longitude: backendData.longitude,
    status: backendData.statut,
    zoneId: backendData.id_zone,
    fillLevel: backendData.taux_remplissage || 0,
    date_installation: backendData.date_installation,
    notes: backendData.notes,
    zone: backendData.zone ? transformZoneToFrontend(backendData.zone) : null,
    mesures: backendData.mesures ? backendData.mesures.map(transformMesureToFrontend) : [],
    created_at: backendData.createdAt,
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
  };
};

// ============================================
// SIGNALEMENTS TRANSFORMERS
// ============================================

export const transformSignalementToBackend = (frontendData) => {
  const typeMap = {
    'overflowing': 'DÉBORDEMENT',
    'full': 'CONTENEUR_PLEIN',
    'damaged': 'CONTENEUR_ENDOMMAGÉ',
    'smell': 'MAUVAISE_ODEUR',
    'other': 'AUTRE',
  };

  const statusMap = {
    'pending': 'OUVERT',
    'in_progress': 'EN_COURS_DE_TRAITEMENT',
    'closed': 'FERMÉ',
    'rejected': 'REJETÉ',
  };

  const priorityMap = {
    'low': 'BASSE',
    'medium': 'NORMALE',
    'high': 'HAUTE',
    'critical': 'CRITIQUE',
  };

  return {
    type: typeMap[frontendData.type] || 'AUTRE',
    description: frontendData.description,
    statut: statusMap[frontendData.status] || 'OUVERT',
    priorite: priorityMap[frontendData.priority] || 'NORMALE',
    id_conteneur: frontendData.id_conteneur || frontendData.containerId,
    id_utilisateur: frontendData.id_utilisateur || frontendData.userId,
    latitude: frontendData.latitude,
    longitude: frontendData.longitude,
    photo_url: frontendData.photo_url,
  };
};

export const transformSignalementToFrontend = (backendData) => {
  const typeMap = {
    'DÉBORDEMENT': 'overflowing',
    'CONTENEUR_PLEIN': 'full',
    'CONTENEUR_ENDOMMAGÉ': 'damaged',
    'MAUVAISE_ODEUR': 'smell',
    'AUTRE': 'other',
  };

  const statusMap = {
    'OUVERT': 'pending',
    'EN_COURS_DE_TRAITEMENT': 'in_progress',
    'FERMÉ': 'closed',
    'REJETÉ': 'rejected',
  };

  const priorityMap = {
    'BASSE': 'low',
    'NORMALE': 'medium',
    'HAUTE': 'high',
    'CRITIQUE': 'critical',
  };

  return {
    id: backendData.id,
    type: typeMap[backendData.type] || 'other',
    description: backendData.description,
    status: statusMap[backendData.statut] || 'pending',
    priority: priorityMap[backendData.priorite] || 'medium',
    id_conteneur: backendData.id_conteneur,
    id_utilisateur: backendData.id_utilisateur,
    latitude: backendData.latitude,
    longitude: backendData.longitude,
    photo_url: backendData.photo_url,
    created_at: backendData.createdAt,
  };
};

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
