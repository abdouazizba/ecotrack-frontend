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

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('authToken');
  console.log('🔐 REQUEST INTERCEPTOR:', {
    token_exists: !!token,
    token_length: token ? token.length : 0,
    token_preview: token ? token.slice(0, 30) + '...' : 'NONE',
    url: config.url,
    headers_auth: config.headers.Authorization,
  });
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token added to Authorization header');
  } else {
    console.warn('⚠️ NO TOKEN FOUND IN COOKIES!');
  }
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(`❌ HTTP ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('❌ Network error - no response from server:', error.request);
    } else {
      console.error('❌ Error:', error.message);
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
      throw new Error('Structure invalide: user ou token manquant');
    }

    return {
      user: data.data,  // { id, email }
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };
  } catch (error) {
    console.error('✗ Login error:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ Récupère le profil complet avec le rôle
export const getCurrentUserProfile = async () => {
  try {
    const response = await api.get('/users/me');
    console.log('✓ User profile fetched:', response.data);
    return response.data.user || response.data.data;
  } catch (error) {
    console.error('✗ Error fetching user profile:', error.response?.data || error.message);
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
    console.log('🔄 GET /conteneurs - Cheking auth...');
    const token = Cookies.get('authToken');
    console.log('🔐 Token in getContainers:', {
      exists: !!token,
      preview: token ? token.slice(0, 30) + '...' : 'NONE',
    });
    
    const response = await api.get('/conteneurs', { params: filters });
    console.log('🔍 RAW API Response /conteneurs:', response);
    console.log('   response.data:', response.data);
    console.log('   response.status:', response.status);
    
    // Essayer toutes les structures possibles
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
      console.log('✅ response.data IS array');
    } else if (response.data?.conteneurs && Array.isArray(response.data.conteneurs)) {
      data = response.data.conteneurs;
      console.log('✅ Found at response.data.conteneurs');
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
      console.log('✅ response.data.data IS array');
    } else if (response.data?.success && Array.isArray(response.data.data)) {
      data = response.data.data;
      console.log('✅ response.data.success exists, extracting .data');
    } else {
      console.warn('⚠️ Cannot find array in response:', response.data);
      data = [];
    }
    
    console.log('📦 Extracted data:', data, `(${data.length} items)`);
    const transformed = transformConteneurArrayToFrontend(data);
    console.log('✨ Transformed:', transformed);
    return transformed;
  } catch (err) {
    console.error('❌ Error in getContainers:', err.message);
    console.error('   Status:', err.response?.status);
    console.error('   Data:', err.response?.data);
    throw err;
  }
};

export const getContainer = async (id) => {
  const response = await api.get(`/conteneurs/${id}`);
  return transformConteneurToFrontend(response.data);
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
    console.log('🔍 RAW API Response /zones:', response);
    
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.zones && Array.isArray(response.data.zones)) {
      data = response.data.zones;
      console.log('✅ Found at response.data.zones');
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    } else if (response.data?.success && Array.isArray(response.data.data)) {
      data = response.data.data;
    }
    
    console.log('📦 Extracted zones:', data);
    const transformed = transformZonesArrayToFrontend(data);
    console.log('🗺️ Transformed zones:', transformed);
    return transformed;
  } catch (err) {
    console.error('❌ Error in getZones:', err);
    throw err;
  }
};

export const getZone = async (id) => {
  const response = await api.get(`/zones/${id}`);
  return transformZoneToFrontend(response.data);
};

export const createZone = async (data) => {
  const backendData = transformZoneToBackend(data);
  const response = await api.post('/zones', backendData);
  return transformZoneToFrontend(response.data);
};

export const updateZone = async (id, data) => {
  const backendData = transformZoneToBackend(data);
  const response = await api.put(`/zones/${id}`, backendData);
  return transformZoneToFrontend(response.data);
};

export const deleteZone = async (id) => {
  await api.delete(`/zones/${id}`);
};

// ============================================
// SIGNALEMENTS - CRUD Operations
// ============================================

export const getSignalements = async (filters = {}) => {
  try {
    const response = await api.get('/signalements', { params: filters });
    console.log('🔍 RAW API Response /signalements:', response);
    
    let data = [];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.signalements && Array.isArray(response.data.signalements)) {
      data = response.data.signalements;
      console.log('✅ Found at response.data.signalements');
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data;
    } else if (response.data?.success && Array.isArray(response.data.data)) {
      data = response.data.data;
    }
    
    console.log('📦 Extracted signalements:', data);
    const transformed = transformSignalementsArrayToFrontend(data);
    console.log('📋 Transformed signalements:', transformed);
    return transformed;
  } catch (err) {
    console.error('❌ Error in getSignalements:', err);
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
