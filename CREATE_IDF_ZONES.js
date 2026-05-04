/**
 * 🗺️ Script - Ajouter 6 zones Île-de-France
 * 
 * À exécuter dans DevTools Console (F12)
 * Ces zones couvrent tous les départements d'Île-de-France
 */

const zones = [
  {
    name: 'Zone A - Île de la Cité (Paris 1er)',
    code_zone: 'ZONE-A-PARIS',
    description: 'Central Paris - Historic district',
    population_estimee: 15001,
    latitude: 48.8566,
    longitude: 2.3522,
    status: 'active'
  },
  {
    name: 'Zone B - Saint-Denis (Seine-Saint-Denis)',
    code_zone: 'ZONE-B-93',
    description: 'Northern Île-de-France - industrial area',
    population_estimee: 120000,
    latitude: 48.9366,
    longitude: 2.3522,
    status: 'active'
  },
  {
    name: 'Zone C - Essonne',
    code_zone: 'ZONE-C-91',
    description: 'Southern Île-de-France - suburban region',
    population_estimee: 89000,
    latitude: 48.5867,
    longitude: 2.4432,
    status: 'active'
  },
  {
    name: 'Zone D - Créteil (Val-de-Marne)',
    code_zone: 'ZONE-D-94',
    description: 'Eastern Île-de-France - administrative center',
    population_estimee: 85000,
    latitude: 48.7829,
    longitude: 2.5391,
    status: 'active'
  },
  {
    name: 'Zone E - Versailles (Yvelines)',
    code_zone: 'ZONE-E-78',
    description: 'Western Île-de-France - royal heritage',
    population_estimee: 88000,
    latitude: 48.8117,
    longitude: 1.9188,
    status: 'active'
  },
  {
    name: 'Zone F - Cergy (Val-d\'Oise)',
    code_zone: 'ZONE-F-95',
    description: 'Northwestern Île-de-France - new town',
    population_estimee: 110000,
    latitude: 49.0197,
    longitude: 2.2137,
    status: 'active'
  }
];

/**
 * Fonction pour créer les zones
 */
async function createZones() {
  console.log('%c🚀 Création de 6 zones Île-de-France...', 'color: blue; font-size: 14px; font-weight: bold;');
  
  let success = 0;
  let failed = 0;
  
  for (const zone of zones) {
    try {
      const response = await fetch('http://localhost:3000/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie
            .split('; ')
            .find(row => row.startsWith('authToken='))
            ?.split('=')[1]}`
        },
        body: JSON.stringify(zone)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${zone.name} créée`, data);
        success++;
      } else {
        const error = await response.json();
        console.error(`❌ ${zone.name} erreur:`, error);
        failed++;
      }
    } catch (err) {
      console.error(`❌ ${zone.name} exception:`, err);
      failed++;
    }
  }
  
  console.log(`\n%c📊 Résumé: ${success}/${zones.length} zones créées, ${failed} erreurs`, 
    success === zones.length ? 'color: green; font-weight: bold;' : 'color: orange; font-weight: bold;');
  
  // Recharger les zones
  if (success > 0) {
    console.log('⏳ Rechargement de la page dans 2 secondes...');
    setTimeout(() => window.location.reload(), 2000);
  }
}

// Exécuter
createZones();
