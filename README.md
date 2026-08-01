# Travel planner — V0.1.23 rc.2

Cette Release Candidate corrige les problèmes pratiques observés lors des premiers tests Chrome, sans ouvrir un nouveau cycle d’ajout de fonctionnalités.

## Changements principaux

- toutes les dates du séjour sont visibles dans l’itinéraire ;
- ajout d’une activité depuis chaque journée et depuis le bas de la page ;
- sélection automatique du dernier jour utilisé ;
- transports avec départ, arrivée, mode et estimation locale ;
- durée saisie en heures et minutes ;
- ajout d’une activité depuis un clic sur la carte ;
- météo demandée sur la fenêtre maximale de 16 jours ;
- documents ajoutables directement depuis une réservation ;
- création d’une réservation depuis certaines activités ;
- montants à deux décimales et tri des dépenses de groupe ;
- dates visibles dans l’aperçu de l’itinéraire ;
- corrections d’alignement, de densité et de lisibilité.

Le référencement reste désactivé, la marque reste provisoire et les partenaires commerciaux restent désactivés par défaut.

## Contrôles

```bash
npm run quality
npm test
npm run release:audit
npm run build
```

Le build et l’audit avec `dist` sont obligatoires dans GitHub Actions avant tout déploiement.
