# mapNplan — V0.1.28 RC7 / partie 29

Application React/Vite de planification de voyages, locale et testable sur GitHub Pages.

## Démarrage

```bash
npm install
npm run dev
```

## Contrôles

```bash
npm run quality
npm test
npm run build
npm run performance:audit
npm run release:audit:ci
```

La partie 29 améliore les parcours de saisie en contexte : itinéraire sans scroll inutile, hébergements multi-jours avec arrivée/départ, repères cartographiques numérotés et colorés, recherche de lieux non forcée vers la destination, documents consultables, calculs directement dans les montants et budget propre à chaque voyage.

Les données restent enregistrées localement dans le navigateur pendant cette phase de test.
