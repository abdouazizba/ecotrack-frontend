import axios from 'axios';
import Cookies from 'js-cookie';
import {
  transformZonesArrayToFrontend,
  transformConteneurArrayToFrontend,
  transformSignalementsArrayToFrontend,
  transformConteneurToBackend,
  transformConteneurToFrontend,
  transformZoneToBackend,
  transformZoneToFrontend,
  transformSignalementToBackend,
  transformSignalementToFrontend,
  transformUserToFrontend,
  transformUserToBackend,
  transformUsersArrayToFrontend,
  transformTourneeToFrontend,
  transformTourneeToBackend,
  transformTourneesArrayToFrontend,
  transformCapteurToFrontend,
  transformCapteurToBackend,
  transformCapteursArrayToFrontend,
} from './transformers';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`HTTP Error ${error.response.status}:`, error.response.statusText);
    } else if (error.request) {
      console.error('Network error');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// HELPERS
// ============================================

const extractArray = (responseData, key) => {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.[key] && Array.isArray(responseData[key])) return responseData[key];
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  return [];
};

const extractSingle = (responseData, key) => {
  if (responseData?.data) return responseData.data;
  if (responseData?.[key]) return responseData[key];
  return responseData;
};

// ============================================
// AUTH
// ============================================

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;

    // DEBUG TEMPORAIRE — à retirer après confirmation de la structure réelle
    console.log('=== LOGIN RAW RESPONSE ===', JSON.stringify(data, null, 2));

    // Essaie toutes les structures connues
    const user = data.user || data.data?.user || data.data;
    const accessToken = data.accessToken || data.tokens?.accessToken || data.access_token || data.token;

    if (!user || !accessToken) {
      console.error('Structure reçue:', Object.keys(data));
      throw new Error('Invalid response structure');
    }

    return {
      user,
      accessToken,
      refreshToken: data.refreshToken || data.tokens?.refreshToken || data.refresh_token,
    };
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/users/me');
    const raw = response.data.user || response.data.data || response.data;
    return transformUserToFrontend(raw);
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

export const verifyToken = async () => {
  const response = await api.post('/auth/verify');
  return response.data;
};

// ============================================
// CONTAINERS - CRUD Operations
// ============================================

export const getContainers = async (filters = {}) => {
  try {
    const response = await api.get('/conteneurs', { params: filters });
    return transformConteneurArrayToFrontend(extractArray(response.data, 'conteneurs'));
  } catch (err) {
    console.error('Error fetching containers:', err.message);
    throw err;
  }
};

export const getContainer = async (id) => {
  try {
    const response = await api.get(`/conteneurs/${id}`);
    return transformConteneurToFrontend(extractSingle(response.data, 'conteneur'));
  } catch (err) {
    console.error('Error fetching container:', err.message);
    throw err;
  }
};

export const createContainer = async (data) => {
  const backendData = transformConteneurToBackend(data);
  const response = await api.post('/conteneurs', backendData);
  return transformConteneurToFrontend(extractSingle(response.data, 'conteneur'));
};

export const updateContainer = async (id, data) => {
  const backendData = transformConteneurToBackend(data);
  const response = await api.put(`/conteneurs/${id}`, backendData);
  return transformConteneurToFrontend(extractSingle(response.data, 'conteneur'));
};

export const deleteContainer = async (id) => {
  await api.delete(`/conteneurs/${id}`);
};

// ============================================
// ZONES - CRUD Operations
// ============================================

export const getZones = async (filters = {}) => {
  try {
    const response = await api.get('/zones', { params: filters });
    return transformZonesArrayToFrontend(extractArray(response.data, 'zones'));
  } catch (err) {
    console.error('Error fetching zones:', err.message);
    throw err;
  }
};

export const getZone = async (id) => {
  try {
    const response = await api.get(`/zones/${id}`);
    return transformZoneToFrontend(extractSingle(response.data, 'zone'));
  } catch (err) {
    console.error('Error fetching zone:', err.message);
    throw err;
  }
};

export const createZone = async (data) => {
  try {
    const backendData = transformZoneToBackend(data);
    const response = await api.post('/zones', backendData);
    return transformZoneToFrontend(extractSingle(response.data, 'zone'));
  } catch (err) {
    console.error('Error creating zone:', err.message);
    throw err;
  }
};

export const updateZone = async (id, data) => {
  try {
    const backendData = transformZoneToBackend(data);
    const response = await api.put(`/zones/${id}`, backendData);
    return transformZoneToFrontend(extractSingle(response.data, 'zone'));
  } catch (err) {
    console.error('Error updating zone:', err.message);
    throw err;
  }
};

export const deleteZone = async (id) => {
  try {
    await api.delete(`/zones/${id}`);
  } catch (err) {
    console.error('Error deleting zone:', err.message);
    throw err;
  }
};

// ============================================
// SIGNALEMENTS - CRUD Operations
// ============================================

export const getSignalements = async (filters = {}) => {
  try {
    const response = await api.get('/signalements', { params: filters });
    return transformSignalementsArrayToFrontend(extractArray(response.data, 'signalements'));
  } catch (err) {
    console.error('Error fetching signalements:', err.message);
    throw err;
  }
};

export const getSignalement = async (id) => {
  const response = await api.get(`/signalements/${id}`);
  return transformSignalementToFrontend(extractSingle(response.data, 'signalement'));
};

export const createSignalement = async (data) => {
  const backendData = transformSignalementToBackend(data);
  const response = await api.post('/signalements', backendData);
  return transformSignalementToFrontend(extractSingle(response.data, 'signalement'));
};

export const updateSignalement = async (id, data) => {
  const backendData = transformSignalementToBackend(data);
  const response = await api.put(`/signalements/${id}`, backendData);
  return transformSignalementToFrontend(extractSingle(response.data, 'signalement'));
};

// Changement de statut via les action endpoints dédiés du backend
// POST /signalements/{id}/in-progress → EN_COURS_DE_TRAITEMENT
// POST /signalements/{id}/close       → FERMÉ
// POST /signalements/{id}/reject      → REJETÉ
// PUT  /signalements/{id}             → OUVERT (retour en attente)
export const getSignalementAudit = async (id) => {
  try {
    const response = await api.get(`/signalements/${id}/historique`);
    const raw = extractArray(response.data, 'historique');
    return raw;
  } catch {
    return null;
  }
};

export const patchSignalement = async (id, partialData) => {
  const { status, motif_rejet, agent_id, photo_resolution_url } = partialData;
  let response;

  if (status === 'in_progress') {
    response = await api.post(`/signalements/${id}/in-progress`);
  } else if (status === 'closed') {
    response = await api.post(`/signalements/${id}/close`, photo_resolution_url ? { photo_resolution_url } : {});
  } else if (status === 'rejected') {
    response = await api.post(`/signalements/${id}/reject`, motif_rejet ? { motif_rejet } : {});
  } else if (agent_id !== undefined) {
    response = await api.put(`/signalements/${id}`, { agent_id });
  } else {
    // pending (OUVERT) — réouverture via PUT
    response = await api.put(`/signalements/${id}`, { statut: 'OUVERT' });
  }

  return transformSignalementToFrontend(extractSingle(response.data, 'signalement'));
};

export const deleteSignalement = async (id) => {
  await api.delete(`/signalements/${id}`);
};

// ============================================
// USERS & AGENTS - CRUD Operations
// ============================================

export const getUsers = async (filters = {}) => {
  try {
    const response = await api.get('/users', { params: { limit: 1000, ...filters } });
    return transformUsersArrayToFrontend(extractArray(response.data, 'users'));
  } catch (err) {
    console.error('Error fetching users:', err.message);
    throw err;
  }
};

export const getUser = async (id) => {
  try {
    const response = await api.get(`/users/${id}`);
    return transformUserToFrontend(extractSingle(response.data, 'user'));
  } catch (err) {
    console.error('Error fetching user:', err.message);
    throw err;
  }
};

export const createUser = async (data) => {
  try {
    const backendData = transformUserToBackend(data);
    const response = await api.post('/users', backendData);
    return transformUserToFrontend(extractSingle(response.data, 'user'));
  } catch (err) {
    console.error('Error creating user:', err.message);
    throw err;
  }
};

export const updateUser = async (id, data) => {
  try {
    const backendData = transformUserToBackend(data);
    const response = await api.put(`/users/${id}`, backendData);
    return transformUserToFrontend(extractSingle(response.data, 'user'));
  } catch (err) {
    console.error('Error updating user:', err.message);
    throw err;
  }
};

export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};

export const changeUserRole = async (id, role) => {
  const response = await api.put(`/users/${id}/role`, { role });
  return response.data;
};

export const getAgents = async () => {
  const response = await api.get('/users', { params: { role: 'agent' } });
  return transformUsersArrayToFrontend(extractArray(response.data, 'users'));
};

export const getAdmins = async () => {
  const response = await api.get('/users', { params: { role: 'admin' } });
  return transformUsersArrayToFrontend(extractArray(response.data, 'users'));
};

// ============================================
// TOURNÉES - CRUD Operations
// ============================================

export const getTournees = async (filters = {}) => {
  try {
    const response = await api.get('/tournees', { params: filters });
    return transformTourneesArrayToFrontend(extractArray(response.data, 'tournees'));
  } catch (err) {
    console.error('Error fetching tournees:', err.message);
    throw err;
  }
};

export const getTournee = async (id) => {
  try {
    const response = await api.get(`/tournees/${id}`);
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  } catch (err) {
    console.error('Error fetching tournee:', err.message);
    throw err;
  }
};

export const createTournee = async (data) => {
  try {
    const response = await api.post('/tournees', transformTourneeToBackend(data));
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  } catch (err) {
    console.error('Error creating tournee:', err.message);
    throw err;
  }
};

export const updateTournee = async (id, data) => {
  try {
    const response = await api.put(`/tournees/${id}`, transformTourneeToBackend(data));
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  } catch (err) {
    console.error('Error updating tournee:', err.message);
    throw err;
  }
};

export const deleteTournee = async (id) => {
  try {
    await api.delete(`/tournees/${id}`);
  } catch (err) {
    console.error('Error deleting tournee:', err.message);
    throw err;
  }
};

export const addSignalementToTournee = async (tourneeId, signalementIds) => {
  try {
    const response = await api.post(`/tournees/${tourneeId}/signalements`, {
      signalement_ids: signalementIds,
    });
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  } catch (err) {
    console.error('Error adding signalements to tournee:', err.message);
    throw err;
  }
};

export const removeSignalementFromTournee = async (tourneeId, sigId) => {
  try {
    await api.delete(`/tournees/${tourneeId}/signalements/${sigId}`);
  } catch (err) {
    console.error('Error removing signalement from tournee:', err.message);
    throw err;
  }
};

export const updateTourneeStatus = async (id, status) => {
  const STATUT = { pending: 'PLANIFIÉE', in_progress: 'EN_COURS', done: 'TERMINÉE', cancelled: 'ANNULÉE' };
  const statut = STATUT[status] || status;
  try {
    const response = await api.patch(`/tournees/${id}/statut`, { statut });
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  } catch (err) {
    // Fallback: PUT classique
    const response = await api.put(`/tournees/${id}`, { statut });
    return transformTourneeToFrontend(extractSingle(response.data, 'tournee'));
  }
};

// ============================================
// CAPTEURS - CRUD + assign
// ============================================

export const getCapteurs = async (filters = {}) => {
  try {
    const response = await api.get('/capteurs', { params: filters });
    return transformCapteursArrayToFrontend(extractArray(response.data, 'capteurs'));
  } catch (err) {
    console.error('Error fetching capteurs:', err.message);
    throw err;
  }
};

export const getCapteur = async (id) => {
  const response = await api.get(`/capteurs/${id}`);
  return transformCapteurToFrontend(extractSingle(response.data, 'capteur'));
};

export const createCapteur = async (data) => {
  const response = await api.post('/capteurs', transformCapteurToBackend(data));
  return transformCapteurToFrontend(extractSingle(response.data, 'capteur'));
};

export const updateCapteur = async (id, data) => {
  const response = await api.put(`/capteurs/${id}`, transformCapteurToBackend(data));
  return transformCapteurToFrontend(extractSingle(response.data, 'capteur'));
};

export const deleteCapteur = async (id) => {
  await api.delete(`/capteurs/${id}`);
};

export const assignCapteurToConteneur = async (id, id_conteneur) => {
  const response = await api.patch(`/capteurs/${id}/conteneur`, { id_conteneur });
  return transformCapteurToFrontend(extractSingle(response.data, 'capteur'));
};

export const updateCapteurBatterie = async (id, batterie) => {
  const response = await api.patch(`/capteurs/${id}/batterie`, { batterie });
  return transformCapteurToFrontend(extractSingle(response.data, 'capteur'));
};

export default api;
