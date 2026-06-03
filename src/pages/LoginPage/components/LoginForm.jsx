import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export default function LoginForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <div className="login-right">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-header">
          <h1>Connexion</h1>
          <p>Accédez à votre tableau de bord</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Adresse Email</label>
          <div className={`input-wrapper ${emailFocus ? 'focused' : ''}`}>
            <Mail size={20} className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="exemple@ecotrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <div className={`input-wrapper ${passwordFocus ? 'focused' : ''}`}>
            <Lock size={20} className="input-icon" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`submit-button ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="loader"></span>
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>

      </form>
    </div>
  );
}
