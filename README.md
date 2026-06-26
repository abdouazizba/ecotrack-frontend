# EcoTrack Frontend

Application React pour la plateforme EcoTrack — gestion intelligente des dechets urbains.

## Stack technique

| Technologie | Version | Role |
|-------------|---------|------|
| React | 19 | Framework UI |
| React Router | 7 | Routing SPA |
| Axios | 1.x | Appels API |
| Zustand | 5.x | State management (auth store) |
| Leaflet | 1.9 | Cartes interactives |
| ECharts | 5.x | Graphes et KPIs dashboard |
| Lucide React | 0.4x | Icones |
| js-cookie | 3.x | Gestion cookies JWT |

## Demarrage

```bash
npm install
npm start
```

Application disponible sur `http://localhost:3000`

## Build production

```bash
npm run build
```

## Structure du projet

```
src/
  components/
    common/          PageShell, ModalBrandPanel, MapPickerModal, SearchableSelect, Pagination
    navigation/      Navbar, Sidebar
    charts/          EchartsStatCard, ChartCard
    auth/            ProtectedRoute, RoleGuard
  pages/
    LoginPage/       Connexion + inscription citoyen
    DashboardPage/   KPIs, graphes, auto-refresh 30s
    ManagementPages/
      ContainersPage/    Conteneurs (monitoring/gestion)
      CapteurPage/       Capteurs IoT (monitoring/gestion)
      TourneesPage/      Tournees (monitoring/gestion)
      SignalementsPage/  Signalements (monitoring/gestion)
      CollecteursPage/   Vehicules (monitoring/gestion)
      UsersPage/         Utilisateurs (agents/admins)
      CitoyensPage/      Citoyens (gamification, classement)
    HistoriquePage/      Timeline chronologique des actions
    CitoyenPortal/       Portail citoyen (signaler, profil, badges)
    AgentPortal/         Portail agent (tournees, carte, cloture)
  services/
    api.js           Appels API (axios + intercepteurs refresh token)
    transformers.js  Conversion backend <-> frontend (statuts, types, champs)
  store/
    authStore.js     Zustand store (user, token, login/logout)
  hooks/
    useDashboardData.js  Hook auto-refresh 30s pour le dashboard
  styles/
    theme.css        Variables CSS, theme emeraude
    echarts-cards.css  Stat cards styling
    layout.css       Grilles et layouts
```

## Portails par role

| Role | URL | Fonctionnalites |
|------|-----|-----------------|
| Admin | `/dashboard` | Dashboard KPIs, gestion conteneurs/tournees/signalements/users/citoyens, historique |
| Agent | `/agent` | Mes tournees, carte live, cloture signalements avec photo |
| Citoyen | `/citoyen` | Signaler un probleme, mes rapports, profil gamification, classement |

## Composant PageShell

Toutes les pages admin utilisent `PageShell` pour un layout unifie :

- Header : icone + titre + toggle Monitoring/Gestion
- Stats : 4 boxes KPI
- Filtres : recherche + boutons statut + dropdown type
- Bouton creer : visible en mode Gestion
- Auto-refresh : countdown 30s en mode Monitoring

## Authentification

- JWT access token (15 min) + refresh token (2 jours)
- Auto-refresh silencieux via intercepteur axios
- Rate limit 429 → deconnexion forcee + message "Session expiree"
- Cookies `authToken` et `refreshToken`

## API Gateway

Le frontend communique uniquement avec le gateway (`http://localhost:3000/api`).
Le gateway route vers 6 microservices backend.

## Transformers (backend <-> frontend)

Les donnees backend (francais : `statut`, `priorite`, `id_conteneur`) sont converties
en format frontend (anglais : `status`, `priority`, `containerId`) via `services/transformers.js`.

Mapping des statuts signalements :
- `OUVERT` <-> `pending`
- `EN_COURS_DE_TRAITEMENT` <-> `in_progress`
- `FERME` <-> `closed`
- `REJETE` <-> `rejected`

## Variables d'environnement

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Docker

```bash
# Via docker-compose (depuis backend/)
docker compose up -d frontend
```

Le Dockerfile build l'app React et la sert via un serveur Node.
