import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { loginUser, getCurrentUserProfile } from '../../services/api';
import WelcomeSection from './components/WelcomeSection';
import LoginForm from './components/LoginForm';
import FloatingIcons from './components/FloatingIcons';
import BackgroundDecoration from './components/BackgroundDecoration';
import './LoginPage.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, updateUserProfile } = useAuthStore();

  const handleSubmit = async (email, password) => {
    setLoading(true);
    setError('');

    try {
      console.log('Step 1️⃣: Logging in with email/password...');
      
      // Étape 1: Login pour obtenir les tokens
      const loginResult = await loginUser(email, password);
      
      if (!loginResult.user || !loginResult.accessToken) {
        throw new Error('Données invalides reçues du serveur');
      }

      console.log('Step 2️⃣: Saving token to auth store...');
      
      // Sauvegarder le token d'abord
      login(loginResult.user, loginResult.accessToken);

      console.log('Step 3️⃣: FETCHING COMPLETE USER PROFILE (WITH ROLE)...');
      
      // Étape 3: C'EST OBLIGATOIRE de récupérer le profil pour avoir le rôle
      let fullProfile = null;
      try {
        fullProfile = await getCurrentUserProfile();
        console.log('✅ Step 4️⃣: User profile received:', fullProfile);
        
        if (fullProfile) {
          console.log('👤 User info:', {
            id: fullProfile.id,
            email: fullProfile.email,
            firstName: fullProfile.firstName,
            lastName: fullProfile.lastName,
            role: fullProfile.role,
          });
          
          // Mettre à jour le store avec les infos complètes
          updateUserProfile(fullProfile);
        }
      } catch (err) {
        console.error('FAILED TO FETCH PROFILE:', err.message);
        console.log('Make sure:');
        console.log('   1. Backend is running');
        console.log('   2. GET /users/me endpoint exists');
        console.log('   3. Token is valid');
        
        // Pour maintenant, on continue avec le rôle par défaut
        console.warn('⚠️ Using default role (agent) - Update manually');
      }

      console.log('Step 5️⃣: Redirecting to dashboard...');
      
      // Étape 4: Redirection
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
      
    } catch (err) {
      console.error(' Login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Échec de la connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <BackgroundDecoration />
      <FloatingIcons />
      
      <div className="login-container">
        <WelcomeSection />
        <LoginForm 
          onSubmit={handleSubmit} 
          loading={loading} 
          error={error}
        />
      </div>
    </div>
  );
}
