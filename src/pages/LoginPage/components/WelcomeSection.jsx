import React from 'react';
import { Leaf, Trash2 } from 'lucide-react';

export default function WelcomeSection() {
  return (
    <div className="login-left">
      <div className="logo-section">
        <img 
          src="/Logo-Ecotrack.png" 
          alt="EcoTrack Logo" 
          className="login-logo"
        />
      </div>
      <div className="welcome-text">
        <h2>Bienvenue sur EcoTrack</h2>
        <p>Gestion des déchets de manière intelligente et durable</p>
        <div className="features-list">
          <div className="feature-item">
            <Trash2 size={20} className="feature-icon" />
            <span>Suivi en temps réel</span>
          </div>
          <div className="feature-item">
            <Leaf size={20} className="feature-icon" />
            <span>Gestion optimisée</span>
          </div>
        </div>
      </div>
    </div>
  );
}
