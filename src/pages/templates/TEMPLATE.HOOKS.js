/**
 * EXEMPLE DE STRUCTURE POUR LES HOOKS PERSONNALISÉS
 * 
 * Location: src/pages/PageName/hooks/useCustomHook.js
 * 
 * Utilité: Isoler la logique métier de vos composants
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Exemple: useLoginForm
 * Gère la logique du formulaire de connexion
 */
export const useLoginForm = (onSubmit) => {
  const [formData, setFormData] = useState({
    email: 'aminata.ba@ecotrack.com',
    password: 'password123',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valider le formulaire
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.email.includes('@')) {
      newErrors.email = 'Email invalide';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Soumettre le formulaire
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData.email, formData.password);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  // Mettre à jour un champ
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
};

/**
 * Exemple: useFetch
 * Hook générique pour les appels API
 */
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Erreur réseau');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
