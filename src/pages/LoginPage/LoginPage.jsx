import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { loginUser, getCurrentUserProfile } from '../../services/api';
import LoginForm from './components/LoginForm';
import WelcomeSection from './components/WelcomeSection';
import BackgroundDecoration from './components/BackgroundDecoration';
import FloatingIcons from './components/FloatingIcons';
import './LoginPage.css';

const CITIZEN_ROLE = 'citoyen';

export default function LoginPage() {
  const [step, setStep] = useState('choose'); // 'choose' | 'login'
  const [selectedRole, setSelectedRole] = useState(null); // 'citoyen' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login, updateUserProfile } = useAuthStore();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('login');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        if (fullProfile) updateUserProfile(fullProfile);
      } catch {}

      const role = loginResult.user.role;
      setTimeout(() => navigate(role === CITIZEN_ROLE ? '/citoyen' : '/dashboard'), 300);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 1 : choisir son espace ───────────────────────────
  if (step === 'choose') {
    return (
      <div className="lp-choose-page">
        <div className="lp-choose-bg" />
        <div className="lp-choose-orbs">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
        </div>
        <div className="lp-choose-card">
          <img src="/Logo-Ecotrack.png" alt="EcoTrack" className="lp-choose-logo" />
          <h1 className="lp-choose-title">Bienvenue sur EcoTrack</h1>
          <p className="lp-choose-subtitle">Qui êtes-vous ?</p>
          <div className="lp-role-cards">
            <button className="lp-role-card lp-role-citizen" onClick={() => handleRoleSelect('citoyen')}>
              <span className="lp-role-icon">🌿</span>
              <span className="lp-role-label">Citoyen</span>
              <span className="lp-role-desc">Signalez, participez, suivez</span>
            </button>
            <button className="lp-role-card lp-role-admin" onClick={() => handleRoleSelect('admin')}>
              <span className="lp-role-icon">⚙️</span>
              <span className="lp-role-label">Administration</span>
              <span className="lp-role-desc">Gérez les opérations</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2 citoyen : formulaire glassmorphism ────────────────
  if (selectedRole === 'citoyen') {
    return (
      <div className="lp-login-page lp-citizen-mode">
        <div className="lp-choose-bg" />
        <div className="lp-choose-orbs">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
        </div>
        <div className="lp-login-card">
          <button className="lp-back-btn" onClick={() => setStep('choose')}>← Retour</button>
          <img src="/Logo-Ecotrack.png" alt="EcoTrack" className="lp-login-logo" />
          <div className="lp-login-role-badge">🌿 Espace Citoyen</div>
          <h2 className="lp-login-title">Connexion</h2>
          {error && <div className="lp-login-error">{error}</div>}
          <form onSubmit={handleSubmit} className="lp-login-form">
            <div className="lp-field">
              <label>Adresse email</label>
              <input type="email" placeholder="votre@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="lp-field">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading ? <span className="lp-spinner" /> : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── STEP 2 admin : ancien formulaire split-screen ─────────────
  return (
    <div className="login-container">
      <BackgroundDecoration />
      <FloatingIcons />
      <button className="login-back-btn" onClick={() => setStep('choose')}>← Retour</button>
      <WelcomeSection />
      <LoginForm
        onSubmit={async (emailVal, passwordVal) => {
          setEmail(emailVal);
          setPassword(passwordVal);
          setLoading(true);
          setError('');
          try {
            const loginResult = await loginUser(emailVal, passwordVal);
            if (!loginResult.user || !loginResult.accessToken) {
              throw new Error('Données invalides reçues du serveur');
            }
            login(loginResult.user, loginResult.accessToken);
            try {
              const fullProfile = await getCurrentUserProfile();
              if (fullProfile) updateUserProfile(fullProfile);
            } catch {}
            const role = loginResult.user.role;
            setTimeout(() => navigate(role === CITIZEN_ROLE ? '/citoyen' : '/dashboard'), 300);
          } catch (err) {
            setError(err.response?.data?.message || err.message || 'Échec de la connexion');
          } finally {
            setLoading(false);
          }
        }}
        loading={loading}
        error={error}
      />
    </div>
  );
}
