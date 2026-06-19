import axios from 'axios';
import Cookies from 'js-cookie';
import useAuthStore from '../store/authStore';
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint =
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/login');

    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        useAuthStore.getState().logout();
        window.location.href = '/';
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        api
          .post('/auth/refresh-token', { refreshToken })
          .then((res) => {
            const newToken =
              res.data.accessToken ||
              res.data.tokens?.accessToken ||
              res.data.access_token;
            useAuthStore.getState().updateAccessToken(newToken);
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            original.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            resolve(api(original));
          })
          .catch((err) => {
            processQueue(err, null);
            useAuthStore.getState().logout();
            window.location.href = '/';
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

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

export const registerPublic = async ({ email, password, firstName, lastName, phone }) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    prenom: firstName,
    nom: lastName,
    telephone: phone || undefined,
    role: 'citoyen',
  });
  const data = response.data;
  return {
    user: data.user || data.data?.user || data.data,
    accessToken: data.accessToken || data.tokens?.accessToken || data.access_token || data.token,
    refreshToken: data.refreshToken || data.tokens?.refreshToken || data.refresh_token,
  };
};

export const verifyToken = async () => {
  const response = await api.post('/auth/verify');
  return response.data;
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data?.data || {};
  } catch (err) {
    console.error('Error fetching dashboard stats:', err.message);
    return {};
  }
};

// ============================================
// CONTAINERS - CRUD Operations
// ============================================

export const getContainers = async (filters = {}) => {
  try {
    const response = await api.get('/conteneurs', { params: { limit: 5000, ...filters } });
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
  const { status, motif_rejet, agent_id, photoFile, notes } = partialData;
  let response;

  if (status === 'in_progress') {
    response = await api.post(`/signalements/${id}/in-progress`);
  } else if (status === 'closed') {
    const formData = new FormData();
    formData.append('photo', photoFile);
    if (notes) formData.append('notes', notes);
    response = await api.post(`/signalements/${id}/close`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
  const response = await api.get('/users', { params: { role: 'agent', limit: 500 } });
  return transformUsersArrayToFrontend(extractArray(response.data, 'users'));
};

export const getAdmins = async () => {
  const response = await api.get('/users', { params: { role: 'admin', limit: 500 } });
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

export const getSignalementsByTournee = async (tourneeId) => {
  try {
    const response = await api.get(`/tournees/${tourneeId}/signalements`);
    return transformSignalementsArrayToFrontend(extractArray(response.data, 'signalements'));
  } catch (err) {
    console.error('Error fetching tournee signalements:', err.message);
    return [];
  }
};

export const addSignalementToTournee = async (tourneeId, signalementIds) => {
  try {
    await Promise.all(
      signalementIds.map((sigId) =>
        api.patch(`/signalements/${sigId}/tournee`, { id_tournee: tourneeId })
      )
    );
  } catch (err) {
    console.error('Error adding signalements to tournee:', err.message);
    throw err;
  }
};

export const removeSignalementFromTournee = async (_tourneeId, sigId) => {
  try {
    await api.patch(`/signalements/${sigId}/tournee`, { id_tournee: null });
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
    const response = await api.get('/capteurs', { params: { limit: 10000, ...filters } });
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

// ============================================
// CONTAINERS - Extras
// ============================================

export const getNearbyContainers = async ({ lat, lng, radius = 5 }) => {
  try {
    const response = await api.get('/conteneurs/nearby', { params: { lat, lng, radius } });
    const conteneurs = extractArray(response.data, 'conteneurs');
    return transformConteneurArrayToFrontend(conteneurs).map((c, i) => ({
      ...c,
      distanceKm: conteneurs[i]?.distance_km ?? null,
    }));
  } catch (err) {
    console.error('Error fetching nearby containers:', err.message);
    throw err;
  }
};

export const getContainersNeedingService = async () => {
  try {
    const response = await api.get('/conteneurs/needs-service');
    return transformConteneurArrayToFrontend(extractArray(response.data, 'conteneurs'));
  } catch (err) {
    console.error('Error fetching containers needing service:', err.message);
    throw err;
  }
};

// ============================================
// MESURES
// ============================================

export const getMesuresConteneur = async (conteneurId) => {
  try {
    const response = await api.get(`/mesures/conteneur/${conteneurId}`);
    return extractArray(response.data, 'mesures');
  } catch (err) {
    console.error('Error fetching mesures:', err.message);
    throw err;
  }
};

export const getLatestMesureConteneur = async (conteneurId) => {
  try {
    const response = await api.get(`/mesures/conteneur/${conteneurId}/latest`);
    return extractSingle(response.data, 'mesure');
  } catch (err) {
    console.error('Error fetching latest mesure:', err.message);
    throw err;
  }
};

export const getStatsMesuresConteneur = async (conteneurId) => {
  try {
    const response = await api.get(`/mesures/conteneur/${conteneurId}/stats`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching mesure stats:', err.message);
    throw err;
  }
};

// ============================================
// CONTAINER STATS
// ============================================

export const getContainerStatsDashboard = async () => {
  try {
    const response = await api.get('/container-stats/dashboard');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching container stats dashboard:', err.message);
    return {};
  }
};

export const getContainerBreakdownByStatus = async () => {
  try {
    const response = await api.get('/container-stats/breakdown/status');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching container breakdown by status:', err.message);
    return [];
  }
};

export const getContainerBreakdownByType = async () => {
  try {
    const response = await api.get('/container-stats/breakdown/type');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching container breakdown by type:', err.message);
    return [];
  }
};

// ============================================
// SIGNALEMENTS - Extras
// ============================================

export const getSignalementsOuverts = async () => {
  try {
    const response = await api.get('/signalements/open');
    return transformSignalementsArrayToFrontend(extractArray(response.data, 'signalements'));
  } catch (err) {
    console.error('Error fetching open signalements:', err.message);
    throw err;
  }
};

export const getSignalementsCitoyen = async (citoyenId) => {
  try {
    const response = await api.get(`/signalements/citoyen/${citoyenId}`);
    return transformSignalementsArrayToFrontend(extractArray(response.data, 'signalements'));
  } catch (err) {
    console.error('Error fetching citoyen signalements:', err.message);
    throw err;
  }
};

export const getSignalementsContainer = async (containerId) => {
  try {
    const response = await api.get(`/signalements/container/${containerId}`);
    return transformSignalementsArrayToFrontend(extractArray(response.data, 'signalements'));
  } catch (err) {
    console.error('Error fetching container signalements:', err.message);
    throw err;
  }
};

export const uploadSignalementPhoto = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(`/signalements/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (err) {
    console.error('Error uploading signalement photo:', err.message);
    throw err;
  }
};

// ============================================
// SIGNAL STATS
// ============================================

export const getSignalStatsDashboard = async () => {
  try {
    const response = await api.get('/signal-stats/dashboard');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching signal stats dashboard:', err.message);
    return {};
  }
};

export const getSignalBreakdownByStatus = async () => {
  try {
    const response = await api.get('/signal-stats/breakdown/status');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching signal breakdown by status:', err.message);
    return [];
  }
};

export const getSignalBreakdownByPriority = async () => {
  try {
    const response = await api.get('/signal-stats/breakdown/priority');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching signal breakdown by priority:', err.message);
    return [];
  }
};

// ============================================
// USERS - Extras
// ============================================

export const getUserProfile = async (id) => {
  try {
    const response = await api.get(`/users/${id}/profile`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    throw err;
  }
};

// ============================================
// TOURNÉES - Extras
// ============================================

// ============================================
// AGENT - Zone & Containers
// ============================================

export const getAgentZone = async (agentId) => {
  try {
    const response = await api.get(`/agents/${agentId}/zone`);
    return response.data?.zone || null;
  } catch (err) {
    console.error('Error fetching agent zone:', err.message);
    return null;
  }
};

export const getAgentZoneContainers = async (agentId, filters = {}) => {
  try {
    const response = await api.get(`/agents/${agentId}/zone/containers`, { params: filters });
    return transformConteneurArrayToFrontend(extractArray(response.data, 'conteneurs'));
  } catch (err) {
    console.error('Error fetching agent zone containers:', err.message);
    return [];
  }
};

export const getTourneesByAgent = async (agentId) => {
  try {
    const response = await api.get(`/tournees/agent/${agentId}`);
    return transformTourneesArrayToFrontend(extractArray(response.data, 'tournees'));
  } catch (err) {
    console.error('Error fetching agent tournees:', err.message);
    throw err;
  }
};

export const getTourneeStats = async (id) => {
  try {
    const response = await api.get(`/tournees/${id}/stats`);
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching tournee stats:', err.message);
    throw err;
  }
};

export const assignAgentToTournee = async (tourneeId, agentId, role) => {
  try {
    const response = await api.post(`/tournees/${tourneeId}/agents`, { idAgent: agentId, role });
    return response.data;
  } catch (err) {
    console.error('Error assigning agent to tournee:', err.message);
    throw err;
  }
};

export const removeAgentFromTournee = async (tourneeId, agentId) => {
  try {
    await api.delete(`/tournees/${tourneeId}/agents/${agentId}`);
  } catch (err) {
    console.error('Error removing agent from tournee:', err.message);
    throw err;
  }
};

// ============================================
// TOUR STATS
// ============================================

export const getTourStatsDashboard = async () => {
  try {
    const response = await api.get('/tour-stats/dashboard');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching tour stats dashboard:', err.message);
    return {};
  }
};

export const getTourBreakdownByStatus = async () => {
  try {
    const response = await api.get('/tour-stats/breakdown/status');
    return response.data?.data || response.data;
  } catch (err) {
    console.error('Error fetching tour breakdown by status:', err.message);
    return [];
  }
};

// ============================================
// COLLECTEURS
// ============================================

export const getCollecteurs = async () => {
  try {
    const response = await api.get('/collecteurs');
    return extractArray(response.data, 'collecteurs');
  } catch (err) {
    console.error('Error fetching collecteurs:', err.message);
    throw err;
  }
};

export const getCollecteur = async (id) => {
  try {
    const response = await api.get(`/collecteurs/${id}`);
    return extractSingle(response.data, 'collecteur');
  } catch (err) {
    console.error('Error fetching collecteur:', err.message);
    throw err;
  }
};

export const createCollecteur = async (data) => {
  try {
    const response = await api.post('/collecteurs', data);
    return extractSingle(response.data, 'collecteur');
  } catch (err) {
    console.error('Error creating collecteur:', err.message);
    throw err;
  }
};

export const updateCollecteur = async (id, data) => {
  try {
    const response = await api.put(`/collecteurs/${id}`, data);
    return extractSingle(response.data, 'collecteur');
  } catch (err) {
    console.error('Error updating collecteur:', err.message);
    throw err;
  }
};

export const deleteCollecteur = async (id) => {
  try {
    await api.delete(`/collecteurs/${id}`);
  } catch (err) {
    console.error('Error deleting collecteur:', err.message);
    throw err;
  }
};

export const getCollecteursByAgent = async (agentId) => {
  try {
    const response = await api.get(`/collecteurs/agent/${agentId}`);
    return extractArray(response.data, 'collecteurs');
  } catch (err) {
    console.error('Error fetching agent collecteurs:', err.message);
    throw err;
  }
};

export const getLowBatteryCollecteurs = async () => {
  try {
    const response = await api.get('/collecteurs/low-battery');
    return extractArray(response.data, 'collecteurs');
  } catch (err) {
    console.error('Error fetching low battery collecteurs:', err.message);
    throw err;
  }
};

export const addCollecteurMaintenance = async (id, notes = '') => {
  try {
    const response = await api.post(`/collecteurs/${id}/maintenance`, notes ? { notes } : {});
    return response.data;
  } catch (err) {
    console.error('Error adding collecteur maintenance:', err.message);
    throw err;
  }
};

// ============================================
// IOT
// ============================================

export const sendIotMeasure = async (data) => {
  try {
    const response = await api.post('/iot/measure', data);
    return response.data;
  } catch (err) {
    console.error('Error sending IoT measure:', err.message);
    throw err;
  }
};

export const registerIotDevice = async (data) => {
  try {
    const response = await api.post('/iot/device/register', data);
    return response.data;
  } catch (err) {
    console.error('Error registering IoT device:', err.message);
    throw err;
  }
};

export const getIotDevice = async (capteurId) => {
  try {
    const response = await api.get(`/iot/device/${capteurId}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching IoT device:', err.message);
    throw err;
  }
};

export const getIotStatus = async () => {
  try {
    const response = await api.get('/iot/status');
    return response.data;
  } catch (err) {
    console.error('Error fetching IoT status:', err.message);
    return null;
  }
};

export default api;
