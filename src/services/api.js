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
} from './transformers';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for better error handling
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

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;

    console.log('✓ Login response received');

    // Structure correcte: tokens.accessToken
    if (!data.data || !data.tokens?.accessToken) {
      throw new Error('Invalid response structure');
    }

    return {
      user: data.data,  // { id, email }
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

// ✅ Récupère le profil complet avec le rôle
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data.user || response.data.data;
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
    
    // Essayer toutes les structures possibles
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.conteneurs && Array.isArray(response.data.conteneurs)) {
      data = response.data.conteneurs;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    } else if (response.data?.success && Array.isArray(response.data.data)) {
      data = response.data.data;
    }
    
    const transformed = transformConteneurArrayToFrontend(data);
    return transformed;
  } catch (err) {
    console.error('Error fetching containers:', err.message);
    throw err;
  }
};

export const getContainer = async (id) => {
  try {
    const response = await api.get(`/conteneurs/${id}`);
    
    // Gérer différentes structures possibles de réponse
    let containerData = response.data;
    
    // Si response.data a une propriété 'data' ou 'conteneur'
    if (response.data?.data) {
      containerData = response.data.data;
    } else if (response.data?.conteneur) {
      containerData = response.data.conteneur;
    }
    
    const transformed = transformConteneurToFrontend(containerData);
    return transformed;
  } catch (err) {
    console.error('Error fetching container:', err.message);
    throw err;
  }
};

export const createContainer = async (data) => {
  const backendData = transformConteneurToBackend(data);
  const response = await api.post('/conteneurs', backendData);
  return transformConteneurToFrontend(response.data);
};

export const updateContainer = async (id, data) => {
  const backendData = transformConteneurToBackend(data);
  const response = await api.put(`/conteneurs/${id}`, backendData);
  return transformConteneurToFrontend(response.data);
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
    
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.zones && Array.isArray(response.data.zones)) {
      data = response.data.zones;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    }
    
    const transformed = transformZonesArrayToFrontend(data);
    return transformed;
  } catch (err) {
    console.error('Error fetching zones:', err.message);
    throw err;
  }
};

export const getZone = async (id) => {
  try {
    const response = await api.get(`/zones/${id}`);
    
    // Gérer différentes structures possibles
    let zoneData = response.data;
    if (response.data?.data) {
      zoneData = response.data.data;
    } else if (response.data?.zone) {
      zoneData = response.data.zone;
    }
    
    const transformed = transformZoneToFrontend(zoneData);
    return transformed;
  } catch (err) {
    console.error('Error fetching zone:', err.message);
    throw err;
  }
};

export const createZone = async (data) => {
  try {
    console.log('➕ Creating zone with data:', data);
    const backendData = transformZoneToBackend(data);
    console.log('   Backend format:', backendData);
    const response = await api.post('/zones', backendData);
    console.log('   Response:', response.data);
    const transformed = transformZoneToFrontend(response.data);
    console.log('✅ Zone created:', transformed);
    return transformed;
  } catch (err) {
    console.error('❌ Error creating zone:', err.message);
    throw err;
  }
};

export const updateZone = async (id, data) => {
  try {
    console.log('✏️ Updating zone:', id, data);
    const backendData = transformZoneToBackend(data);
    console.log('   Backend format:', backendData);
    const response = await api.put(`/zones/${id}`, backendData);
    console.log('   Response:', response.data);
    const transformed = transformZoneToFrontend(response.data);
    console.log('✅ Zone updated:', transformed);
    return transformed;
  } catch (err) {
    console.error('❌ Error updating zone:', err.message);
    throw err;
  }
};

export const deleteZone = async (id) => {
  try {
    console.log('🗑️ Deleting zone:', id);
    await api.delete(`/zones/${id}`);
    console.log('✅ Zone deleted');
  } catch (err) {
    console.error('❌ Error deleting zone:', err.message);
    throw err;
  }
};

// ============================================
// SIGNALEMENTS - CRUD Operations
// ============================================

export const getSignalements = async (filters = {}) => {
  try {
    const response = await api.get('/signalements', { params: filters });
    
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.signalements && Array.isArray(response.data.signalements)) {
      data = response.data.signalements;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    } else if (response.data?.success && Array.isArray(response.data.data)) {
      data = response.data.data;
    }
    
    const transformed = transformSignalementsArrayToFrontend(data);
    return transformed;
  } catch (err) {
    console.error('Error fetching signalements:', err.message);
    throw err;
  }
};

export const getSignalement = async (id) => {
  const response = await api.get(`/signalements/${id}`);
  return transformSignalementToFrontend(response.data);
};

export const createSignalement = async (data) => {
  const backendData = transformSignalementToBackend(data);
  const response = await api.post('/signalements', backendData);
  return transformSignalementToFrontend(response.data);
};

export const updateSignalement = async (id, data) => {
  const backendData = transformSignalementToBackend(data);
  const response = await api.put(`/signalements/${id}`, backendData);
  return transformSignalementToFrontend(response.data);
};

export const deleteSignalement = async (id) => {
  await api.delete(`/signalements/${id}`);
};

// ============================================
// USERS & AGENTS - CRUD Operations & Role Management
// ============================================

export const getUsers = async (filters = {}) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post('/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};

// Change user role (Admin/Agent)
export const changeUserRole = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data;
};

// Get agents only
export const getAgents = async () => {
  const response = await api.get('/users', { params: { role: 'agent' } });
  return response.data;
};

// Get admins only
export const getAdmins = async () => {
  const response = await api.get('/users', { params: { role: 'admin' } });
  return response.data;
};

export default api;
