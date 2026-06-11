# 📁 Architecture du Projet EcoTrack Frontend

## Structure Modularisée et Scalable

### 🎯 Principes

1. **Isolation par Feature** : Chaque page a son propre dossier avec tous ses fichiers
2. **Composants Réutilisables** : Dans `src/components/` (globaux)
3. **Export via index.js** : Facilite les imports et permet la refactorisation interne
4. **Scalabilité** : Facile d'ajouter hooks, utils, constants spécifiques à une page

---

## 📂 Structure Complète

```
src/
├── pages/
│   ├── LoginPage/
│   │   ├── LoginPage.jsx          # Composant principal
│   │   ├── LoginPage.css          # Styles de la page
│   │   ├── index.js               # Export centralisé
│   │   └── components/
│   │       ├── LoginForm.jsx      # Formulaire isolé
│   │       ├── WelcomeSection.jsx # Section de bienvenue
│   │       ├── FloatingIcons.jsx  # Icônes flottantes
│   │       └── BackgroundDecoration.jsx # Décoration
│   │
│   └── DashboardPage/
│       ├── DashboardPage.jsx      # Composant principal
│       ├── DashboardPage.css      # Styles de la page
│       ├── index.js               # Export centralisé
│       └── components/
│           ├── DashboardHeader.jsx    # En-tête
│           ├── StatsSection.jsx       # Section des stats
│           └── ChartsSection.jsx      # Section des graphiques
│
├── components/                    # Composants réutilisables globaux
│   ├── Navbar/
│   │   ├── Navbar.jsx
│   │   └── Navbar.css
│   ├── Sidebar/
│   │   ├── Sidebar.jsx
│   │   └── Sidebar.css
│   ├── StatCard.jsx
│   ├── ChartComponent.jsx
│   ├── ProtectedRoute.jsx
│   └── ...
│
├── services/                      # API & services
│   └── api.js
│
├── store/                         # États globaux (Zustand, etc)
│   └── authStore.js
│
├── hooks/                         # Custom hooks (à créer)
├── utils/                         # Utilitaires globaux (à créer)
├── constants/                     # Constantes globales (à créer)
├── App.js
├── App.css
└── index.js
```

---

## 📌 Avantages de cette Architecture

### ✅ **Organisation Claire**
- Chaque page est self-contained
- Facile de naviguer et trouver les fichiers
- Structure lisible et cohérente

### ✅ **Scalabilité**
```javascript
// Avant : ajouter une page était compliqué
// Maintenant : simple copier/coller de la structure

// Ajouter une nouvelle page "ReportsPage" :
src/pages/ReportsPage/
├── ReportsPage.jsx
├── ReportsPage.css
├── index.js
└── components/
    ├── ReportFilters.jsx
    ├── ReportTable.jsx
    └── ReportExport.jsx
```

### ✅ **Maintenance Facile**
```javascript
// Modifier la LoginForm ? C'est isolé !
// => src/pages/LoginPage/components/LoginForm.jsx

// Changer le style de LoginPage ? C'est séparé !
// => src/pages/LoginPage/LoginPage.css
```

### ✅ **Imports Simples**
```javascript
// Grâce à index.js
import LoginPage from './pages/LoginPage';
// au lieu de
import LoginPage from './pages/LoginPage/LoginPage.jsx';
```

### ✅ **Extensibilité Future**
```javascript
// Chaque page peut ajouter :
src/pages/LoginPage/
├── hooks/useLoginForm.js      // Logique du formulaire
├── utils/validation.js        // Validation d'email
├── constants/messages.js      // Messages d'erreur
└── types/index.d.ts           // Types TypeScript (futur)
```

---

## 🔄 Imports et Exports

### ✅ **index.js dans chaque page**
```javascript
// src/pages/LoginPage/index.js
export { default } from './LoginPage';
export { default as LoginForm } from './components/LoginForm';
export { default as WelcomeSection } from './components/WelcomeSection';

// Permet les imports :
import LoginPage from './pages/LoginPage';
import { LoginForm, WelcomeSection } from './pages/LoginPage';
```

---

## 🚀 Guide d'Expansion

### Ajouter une nouvelle page

```bash
# 1. Créer la structure
src/pages/NewPage/
├── NewPage.jsx
├── NewPage.css
├── index.js
└── components/
    └── [composants spécifiques]

# 2. Exemple: NewPage.jsx
import React from 'react';
import ComponentName from './components/ComponentName';
import './NewPage.css';

export default function NewPage() {
  return (
    <div>
      <ComponentName />
    </div>
  );
}

# 3. Exporter dans index.js
export { default } from './NewPage';

# 4. Utiliser dans App.js
import NewPage from './pages/NewPage';
```

### Ajouter un composant réutilisable

```bash
# 1. Créer dans src/components/
src/components/Button/
├── Button.jsx
├── Button.css
└── index.js

# 2. Exporter depuis index.js
# 3. Utiliser partout !
import Button from './components/Button';
```

---

## 📝 Bonnes Pratiques

✅ **DO**
- Garder les composants de page isolés dans `components/`
- Utiliser `index.js` pour les exports
- Créer des composants réutilisables de taille appropriée
- Suivre la structure pour chaque nouvelle page

❌ **DON'T**
- Mélanger les fichiers CSS avec les JSX sans organisation
- Importer en chemin absolu quand relatif est possible
- Créer des composants trop volumineux (> 300 lignes)
- Ignorer la structure établie

---

## 🔗 Exemple Complet : Ajouter un composant

```javascript
// src/pages/LoginPage/components/LoginForm.jsx
import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

export default function LoginForm({ onSubmit, loading, error }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData.email, formData.password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire */}
    </form>
  );
}
```

---

## ✅ Checklist pour une nouvelle page

- [ ] Créer dossier `src/pages/PageName/`
- [ ] Créer `PageName.jsx` (composant principal)
- [ ] Créer `PageName.css` (styles)
- [ ] Créer `index.js` (exports)
- [ ] Créer `components/` pour sous-composants
- [ ] Créer chaque sous-composant `.jsx`
- [ ] Importer dans `App.js` si route publique
- [ ] Tester l'import et le rendu

---

Cette architecture vous permet de **scaler facilement** tout en gardant un **code clean et maintenable** ! 🚀
