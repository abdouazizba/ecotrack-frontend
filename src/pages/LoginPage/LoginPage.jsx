import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { loginUser, registerPublic, getCurrentUserProfile } from '../../services/api';
import LoginForm from './components/LoginForm';
import WelcomeSection from './components/WelcomeSection';
import BackgroundDecoration from './components/BackgroundDecoration';
import FloatingIcons from './components/FloatingIcons';
import './LoginPage.css';

const CITIZEN_ROLE = 'citoyen';

const EMPTY_REG = { email: '', password: '', firstName: '', lastName: '', phone: '' };

function validatePassword(pwd) {
  if (!pwd)                       return 'Le mot de passe est requis';
  if (pwd.length < 8)             return 'Au moins 8 caractères';
  if (!/[A-Z]/.test(pwd))        return 'Au moins une majuscule';
  if (!/[a-z]/.test(pwd))        return 'Au moins une minuscule';
  if (!/[0-9]/.test(pwd))        return 'Au moins un chiffre';
  if (!/[!@#$%^&*]/.test(pwd))   return 'Au moins un caractère spécial (!@#$%^&*)';
  return '';
}

export default function LoginPage() {
  const [step, setStep]               = useState('choose');
  const [selectedRole, setSelectedRole] = useState(null);

  // login state
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // register state
  const [reg, setReg]           = useState(EMPTY_REG);
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [regPwdError, setRegPwdError] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens, login, updateUserProfile } = useAuthStore();

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      setError('Votre session a expiré. Veuillez vous reconnecter.');
      setStep('login');
    }
  }, [searchParams]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('login');
    setError('');
  };

  const doLogin = async (emailVal, passwordVal) => {
    setLoading(true);
    setError('');
    try {
      const result = await loginUser(emailVal, passwordVal);
      if (!result.user || !result.accessToken) throw new Error('Données invalides reçues');
      loginWithTokens(result.user, result.accessToken, result.refreshToken);
      try {
        const profile = await getCurrentUserProfile();
        if (profile) updateUserProfile(profile);
      } catch {}
      const role = result.user.role;
      setTimeout(() => navigate(role === CITIZEN_ROLE ? '/citoyen' : '/dashboard'), 300);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const pwdErr = validatePassword(reg.password);
    if (pwdErr) { setRegPwdError(pwdErr); return; }
    setRegPwdError('');
    setLoading(true);
    setError('');
    try {
      const result = await registerPublic(reg);
      if (result.user && result.accessToken) {
        loginWithTokens(result.user, result.accessToken, result.refreshToken);
        setTimeout(() => navigate('/citoyen'), 300);
      } else {
        // Registration succeeded but no auto-login — redirect to login
        setStep('login');
        setError('');
        setEmail(reg.email);
        setReg(EMPTY_REG);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const setR = (field) => (e) => setReg((r) => ({ ...r, [field]: e.target.value }));

  // ── STEP 1 : choisir son espace ─────────────────────────
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

  // ── STEP citoyen — REGISTER ────────────────────────────
  if (selectedRole === 'citoyen' && step === 'register') {
    return (
      <div className="lp-login-page lp-citizen-mode">
        <div className="lp-choose-bg" />
        <div className="lp-choose-orbs">
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />
        </div>
        <div className="lp-login-card">
          <button className="lp-back-btn" onClick={() => setStep('login')}>← Retour</button>
          <img src="/Logo-Ecotrack.png" alt="EcoTrack" className="lp-login-logo" />
          <div className="lp-login-role-badge">🌿 Créer un compte citoyen</div>
          <h2 className="lp-login-title">Inscription</h2>
          {error && <div className="lp-login-error">{error}</div>}
          <form onSubmit={handleRegisterSubmit} className="lp-login-form">
            <div className="lp-row">
              <div className="lp-field">
                <label>Prénom *</label>
                <input type="text" value={reg.firstName} onChange={setR('firstName')}
                  placeholder="Jean" required autoFocus />
              </div>
              <div className="lp-field">
                <label>Nom *</label>
                <input type="text" value={reg.lastName} onChange={setR('lastName')}
                  placeholder="Dupont" required />
              </div>
            </div>
            <div className="lp-field">
              <label>Adresse email *</label>
              <input type="email" value={reg.email} onChange={setR('email')}
                placeholder="votre@email.com" required />
            </div>
            <div className="lp-field">
              <label>Téléphone</label>
              <input type="tel" value={reg.phone} onChange={setR('phone')}
                placeholder="+33 6 00 00 00 00" />
            </div>
            <div className="lp-field">
              <label>Mot de passe *</label>
              <div className="lp-pwd-wrap">
                <input
                  type={showRegPwd ? 'text' : 'password'}
                  value={reg.password}
                  onChange={(e) => { setR('password')(e); setRegPwdError(''); }}
                  placeholder="Min 8 car. avec majuscule, chiffre, spécial"
                  required
                />
                <button
                  type="button"
                  className="lp-pwd-toggle"
                  onClick={() => setShowRegPwd((v) => !v)}
                  tabIndex={-1}
                >
                  {showRegPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="lp-pwd-hint">8 car. · majuscule · minuscule · chiffre · spécial (!@#$%^&*)</p>
              {regPwdError && <p className="lp-pwd-error">{regPwdError}</p>}
            </div>
            <button type="submit" className="lp-submit-btn" disabled={loading}>
              {loading ? <span className="lp-spinner" /> : null}
              {loading ? 'Inscription...' : "Créer mon compte"}
            </button>
          </form>
          <p className="lp-link">
            Déjà un compte ?{' '}
            <button type="button" onClick={() => { setStep('login'); setError(''); }}>
              Se connecter
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── STEP citoyen — LOGIN ───────────────────────────────
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
          <form onSubmit={handleLoginSubmit} className="lp-login-form">
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
          <p className="lp-link">
            Pas encore de compte ?{' '}
            <button type="button" onClick={() => { setStep('register'); setError(''); }}>
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── STEP admin — LOGIN ─────────────────────────────────
  return (
    <div className="login-container">
      <BackgroundDecoration />
      <FloatingIcons />
      <button className="login-back-btn" onClick={() => setStep('choose')}>← Retour</button>
      <WelcomeSection />
      <LoginForm
        onSubmit={async (emailVal, passwordVal) => {
          await doLogin(emailVal, passwordVal);
        }}
        loading={loading}
        error={error}
      />
    </div>
  );
}
