# Architecture — V0.1.25 RC4

## Identité

La configuration publique se trouve dans `project.config.js`. Les ressources de marque sont réparties entre :

- `src/components/common/MapNPlanMark.jsx` ;
- `src/components/common/Brand.jsx` ;
- `src/styles/brand-mapnplan.css` ;
- `public/mapnplan-mark.svg` ;
- `public/mapnplan-logo.svg` ;
- `public/mapnplan-app-icon.svg`.

## Styles

Les tokens de couleur, typographie, rayons et ombres sont centralisés dans `src/styles/tokens.css`. Le fichier `brand-mapnplan.css`, chargé en dernier, contient la déclinaison visuelle de la RC4 et limite les modifications risquées dans les composants stabilisés.

## Compatibilité

Le schéma de voyage reste en version 18. Les namespaces historiques LocalStorage et IndexedDB sont conservés. Le nom de marque affiché et les noms de fichiers exportés peuvent évoluer sans déplacer les données locales.

## Publication

Vite utilise le chemin GitHub Pages du dépôt `travel-planner`. Le référencement reste verrouillé avec `publicIndexingEnabled: false` et des métadonnées `noindex`.
