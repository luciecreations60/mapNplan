# Rapport qualité — V0.1.23 rc.2

## Résultats automatiques

- 39 tests réussis ;
- 0 test en échec ;
- 1 606 clés de traduction françaises et anglaises synchronisées ;
- audit Release Candidate : 35 contrôles sur 35 ;
- fichiers JavaScript, JSX, MJS, JSON et imports relatifs vérifiés par `npm run quality` ;
- référencement public toujours verrouillé.

## Couverture ajoutée

Les tests vérifient la génération de toutes les dates du séjour, le choix du dernier jour utilisé, l’insertion dans une journée vide, la conversion heures/minutes, une estimation plausible Blaincourt–Mâcon, le clic sur la carte, les pièces jointes de réservation, la météo seize jours et la correction CSS du champ Lieu.

## Point restant à confirmer

Le dossier `dist` ne peut être contrôlé qu’après le build Vite. GitHub Actions doit réussir les étapes qualité, tests, build, budget de taille et audit Release Candidate avant le déploiement.


## Correctif GitHub Actions

La configuration de découpage du build utilise désormais l’API Rolldown de Vite 8. Un test contractuel bloque le retour de la forme objet `manualChunks`.
