import React, { useState } from 'react';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check,
} from 'lucide-react';
import './RegisterStepper.css';

const STEPS = [
  { label: 'Identité', icon: User },
  { label: 'Contact', icon: Mail },
  { label: 'Sécurité', icon: Lock },
];

function getPwdScore(pwd) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[!@#$%^&*]/.test(pwd)) s++;
  return s;
}

const PWD_META = [
  { label: '', color: '#e5e7eb' },
  { label: 'Faible', color: '#ef4444' },
  { label: 'Moyen', color: '#f59e0b' },
  { label: 'Bon', color: '#eab308' },
  { label: 'Fort', color: '#10b981' },
];

export default function RegisterStepper({
  reg, setR, onSubmit, onBack, loading, error,
  regPwdError, showRegPwd, setShowRegPwd, setRegPwdError,
}) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');

  const validateStep = () => {
    if (step === 0) {
      if (!reg.firstName.trim() || !reg.lastName.trim()) {
        setStepError('Veuillez remplir votre prénom et nom.');
        return false;
      }
    }
    if (step === 1) {
      if (!reg.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) {
        setStepError('Veuillez saisir une adresse email valide.');
        return false;
      }
    }
    setStepError('');
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, 2));
  };

  const back = () => {
    setStepError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const score = getPwdScore(reg.password);
  const meta = PWD_META[score];

  return (
    <div className="rs-page">
      <div className="rs-card">
        <button type="button" className="rs-back-btn" onClick={step === 0 ? onBack : back}>
          <ArrowLeft size={14} /> {step === 0 ? 'Retour' : 'Précédent'}
        </button>

        <img src="/Logo-Ecotrack.png" alt="EcoTrack" className="rs-logo" />
        <h1 className="rs-title">Créer un compte</h1>
        <p className="rs-subtitle">Rejoignez la communauté EcoTrack</p>

        {/* Progress */}
        <div className="rs-progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={`rs-step-line${i <= step ? ' done' : ''}`} />}
              <div className="rs-step-item">
                <div className={`rs-step-circle${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={`rs-step-label${i <= step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {(error || stepError) && (
          <div className="rs-error">{stepError || error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Identity */}
          {step === 0 && (
            <div className="rs-step-content">
              <h3 className="rs-step-heading"><User size={18} /> Comment vous appelez-vous ?</h3>
              <div className="rs-row">
                <div className="rs-field">
                  <label>Prénom *</label>
                  <div className="rs-input-wrap">
                    <User size={16} className="rs-input-icon" />
                    <input
                      type="text"
                      value={reg.firstName}
                      onChange={setR('firstName')}
                      placeholder="Jean"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="rs-field">
                  <label>Nom *</label>
                  <div className="rs-input-wrap">
                    <User size={16} className="rs-input-icon" />
                    <input
                      type="text"
                      value={reg.lastName}
                      onChange={setR('lastName')}
                      placeholder="Dupont"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 1 && (
            <div className="rs-step-content">
              <h3 className="rs-step-heading"><Mail size={18} /> Vos coordonnées</h3>
              <div className="rs-field">
                <label>Adresse email *</label>
                <div className="rs-input-wrap">
                  <Mail size={16} className="rs-input-icon" />
                  <input
                    type="email"
                    value={reg.email}
                    onChange={setR('email')}
                    placeholder="votre@email.com"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="rs-field">
                <label>Téléphone <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none' }}>(optionnel)</span></label>
                <div className="rs-input-wrap">
                  <Phone size={16} className="rs-input-icon" />
                  <input
                    type="tel"
                    value={reg.phone}
                    onChange={setR('phone')}
                    placeholder="+33 6 00 00 00 00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {step === 2 && (
            <div className="rs-step-content">
              <h3 className="rs-step-heading"><Lock size={18} /> Sécurisez votre compte</h3>
              <div className="rs-field">
                <label>Mot de passe *</label>
                <div className="rs-input-wrap">
                  <Lock size={16} className="rs-input-icon" />
                  <input
                    type={showRegPwd ? 'text' : 'password'}
                    value={reg.password}
                    onChange={(e) => { setR('password')(e); setRegPwdError(''); setStepError(''); }}
                    placeholder="Min 8 caractères"
                    required
                    autoFocus
                  />
                  <button type="button" className="rs-pwd-toggle" onClick={() => setShowRegPwd((v) => !v)} tabIndex={-1}>
                    {showRegPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {reg.password && (
                  <div className="rs-pwd-strength">
                    <div className="rs-pwd-bars">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="rs-pwd-bar"
                          style={{ background: score >= n ? meta.color : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                    <span className="rs-pwd-label" style={{ color: meta.color }}>{meta.label}</span>
                  </div>
                )}

                <p className="rs-pwd-hint">8 car. · majuscule · minuscule · chiffre · spécial (!@#$%^&*)</p>
                {regPwdError && <p className="rs-pwd-error">{regPwdError}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rs-actions">
            {step > 0 && (
              <button type="button" className="rs-btn-back" onClick={back}>
                <ArrowLeft size={15} />
              </button>
            )}
            {step < 2 ? (
              <button type="button" className="rs-btn-next" onClick={next}>
                Continuer <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="rs-btn-next" disabled={loading}>
                {loading && <span className="rs-spinner" />}
                {loading ? 'Inscription...' : 'Créer mon compte'}
              </button>
            )}
          </div>
        </form>

        <p className="rs-link">
          Déjà un compte ?{' '}
          <button type="button" onClick={onBack}>Se connecter</button>
        </p>
      </div>
    </div>
  );
}
