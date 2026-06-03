/**
 * EXEMPLE DE STRUCTURE POUR LES UTILS ET CONSTANTES
 * 
 * Location: 
 * - src/pages/PageName/utils/validation.js
 * - src/pages/PageName/constants/messages.js
 */

// ============================================
// UTILS - Fonctions réutilisables
// ============================================

/**
 * Exemple: validation.js
 * Fonctions de validation
 */
export const loginValidation = {
  // Valider un email
  validateEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Valider le mot de passe
  validatePassword: (password) => {
    return password.length >= 6;
  },

  // Valider le formulaire complet
  validateLoginForm: (email, password) => {
    const errors = {};

    if (!loginValidation.validateEmail(email)) {
      errors.email = 'Email invalide';
    }

    if (!loginValidation.validatePassword(password)) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Exemple: formatterDate.js
 * Fonctions de formatage
 */
export const formatters = {
  // Formater une date
  formatDate: (date, format = 'fr-FR') => {
    return new Date(date).toLocaleDateString(format);
  },

  // Formater une heure
  formatTime: (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Formater un nombre
  formatNumber: (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  },
};

/**
 * Exemple: helpers.js
 * Fonctions utilitaires générales
 */
export const helpers = {
  // Attendre (delay)
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Cloner un objet
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

  // Vérifier si objet est vide
  isEmpty: (obj) => Object.keys(obj).length === 0,

  // Fusionner des objets
  mergeObjects: (...objects) => Object.assign({}, ...objects),
};

// ============================================
// CONSTANTES - Valeurs fixes et messages
// ============================================

/**
 * Exemple: messages.js
 * Messages et textes de l'interface
 */
export const LOGIN_MESSAGES = {
  // Messages d'erreur
  ERRORS: {
    INVALID_EMAIL: 'L\'adresse email est invalide',
    INVALID_PASSWORD: 'Le mot de passe est incorrect',
    LOGIN_FAILED: 'La connexion a échoué. Vérifiez vos identifiants.',
    NETWORK_ERROR: 'Erreur réseau. Veuillez réessayer.',
    SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  },

  // Messages de succès
  SUCCESS: {
    LOGIN_SUCCESS: 'Vous êtes connecté !',
    LOGOUT_SUCCESS: 'Vous avez été déconnecté.',
  },

  // Messages informatifs
  INFO: {
    LOADING: 'Chargement...',
    WELCOME: 'Bienvenue sur EcoTrack',
  },

  // Labels et placeholders
  LABELS: {
    EMAIL: 'Adresse Email',
    PASSWORD: 'Mot de passe',
    REMEMBER_ME: 'Se souvenir de moi',
    FORGOT_PASSWORD: 'Mot de passe oublié ?',
    SIGN_UP: 'S\'inscrire',
  },
};

/**
 * Exemple: apiEndpoints.js
 * Endpoints API constants
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    REGISTER: '/api/auth/register',
  },

  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    CHARTS: '/api/dashboard/charts',
    ACTIVITY: '/api/dashboard/activity',
  },
};

/**
 * Exemple: colors.js
 * Palette de couleurs
 */
export const COLORS = {
  PRIMARY: '#16a34a',      // Vert EcoTrack
  PRIMARY_DARK: '#15803d',
  SECONDARY: '#000000',     // Noir
  ACCENT: '#22c55e',        // Vert clair
  
  // States
  SUCCESS: '#22c55e',
  WARNING: '#fb923c',
  ERROR: '#ef4444',
  INFO: '#3b82f6',

  // Neutrals
  BACKGROUND: '#f8f9fa',
  SURFACE: '#ffffff',
  TEXT: '#1a1a1a',
  TEXT_SECONDARY: '#666666',
  BORDER: '#e8ecf1',
};

/**
 * Exemple: roles.js
 * Rôles et permissions
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  USER: 'user',
};

export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['read', 'create', 'update', 'delete'],
  [USER_ROLES.MANAGER]: ['read', 'create', 'update'],
  [USER_ROLES.AGENT]: ['read', 'update'],
  [USER_ROLES.USER]: ['read'],
};
