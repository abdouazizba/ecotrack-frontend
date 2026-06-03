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
      const loginResult = await loginUser(email, password);

      if (!loginResult.user || !loginResult.accessToken) {
        throw new Error('Données invalides reçues du serveur');
      }

      login(loginResult.user, loginResult.accessToken);

      try {
        const fullProfile = await getCurrentUserProfile();
        if (fullProfile) {
          updateUserProfile(fullProfile);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err.message);
      }

      setTimeout(() => navigate('/dashboard'), 300);

    } catch (err) {
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
