/**
 * TEMPLATE - Copier cette structure pour créer une nouvelle page
 * 
 * Utilisation :
 * 1. Créer un dossier src/pages/NewPageName/
 * 2. Copier cette structure
 * 3. Remplacer NewPageName par votre nom de page
 * 4. Personnaliser les composants
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import useAuthStore from '../../../store/authStore';
// import SubComponent from './components/SubComponent';
import './NewPageName.css';

/**
 * NewPageName Component
 * 
 * Description: Brève description de ce que fait cette page
 * 
 * Routes: /new-page-name
 * Auth: true/false (si route protégée)
 */
export default function NewPageName() {
  const navigate = useNavigate();
  // const { user } = useAuthStore();
  
  const [state, setState] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    // Initialisation ou fetch de données
  }, []);

  return (
    <div className="newpagename-container">
      {/* En-tête */}
      <header className="newpagename-header">
        <h1>Page Title</h1>
        <p>Subtitle</p>
      </header>

      {/* Contenu principal */}
      <main className="newpagename-main">
        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}
        {state && (
          <div>
            {/* Contenu */}
          </div>
        )}
      </main>
    </div>
  );
}
