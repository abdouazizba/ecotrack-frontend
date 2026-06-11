import React, { useState } from 'react';
import useAuthStore from '../../store/authStore';
import NearbyContainersMap from './components/NearbyContainersMap';
import CreateSignalementForm from './components/CreateSignalementForm';
import MySignalements from './components/MySignalements';
import './CitoyenPage.css';

export default function CitoyenPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [signalKey, setSignalKey] = useState(0);

  const handleSelectContainer = (container) => {
    setSelectedContainer(container);
    document.getElementById('citoyen-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSignalSuccess = () => {
    setSelectedContainer(null);
    setSignalKey((k) => k + 1);
  };

  const firstName = user?.firstName || user?.prenom || 'Citoyen';

  return (
    <div className="citoyen-page">
      {/* ── Header ── */}
      <div className="citoyen-header">
        <div className="citoyen-welcome">
          <span className="citoyen-avatar">👤</span>
          <div>
            <h1 className="citoyen-greeting">Bonjour, {firstName} 👋</h1>
            <p className="citoyen-subtitle">Signalez un problème ou trouvez un conteneur proche de vous.</p>
          </div>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div className="citoyen-body">
        {/* Colonne gauche : carte */}
        <section className="citoyen-map-section">
          <NearbyContainersMap onSelectContainer={handleSelectContainer} />
        </section>

        {/* Colonne droite : formulaire */}
        <section className="citoyen-form-section" id="citoyen-form-anchor">
          {selectedContainer && (
            <div className="citoyen-selected-banner">
              <span>Conteneur sélectionné :</span>
              <strong>{selectedContainer.code_conteneur || selectedContainer.name}</strong>
              <button onClick={() => setSelectedContainer(null)}>✕</button>
            </div>
          )}
          <CreateSignalementForm
            key={selectedContainer?.id || 'empty'}
            preselectedContainer={selectedContainer}
            onSuccess={handleSignalSuccess}
          />
        </section>
      </div>

      {/* ── Historique ── */}
      <section className="citoyen-history">
        <MySignalements key={signalKey} userId={user?.id} />
      </section>
    </div>
  );
}
