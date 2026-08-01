# Travel planner — V0.1.22 rc.1

Application locale de planification de voyage, responsive et bilingue, construite avec React/Vite et déployée sur GitHub Pages.

## État du projet

Le périmètre fonctionnel est gelé. Cette livraison est la première **Release Candidate** avant la décision V1.0. Elle ajoute uniquement des contrôles de régression, un audit de livraison et la documentation d’acceptation.

Le site reste volontairement non indexable. TripFlow reste un nom de code et aucun partenaire commercial n’est activé par défaut.

## Commandes

```bash
npm install
npm run dev
npm run quality
npm run test
npm run build
npm run performance:audit
npm run release:audit
npm run check
```

`npm run release:audit:ci` exige la présence du build `dist` et est exécuté par GitHub Actions avant le déploiement.

## Décision V1.0

La Release Candidate est prête pour un test contrôlé, mais ne sera déclarée stable qu’après :

- un workflow GitHub entièrement vert ;
- le parcours utilisateur complet ;
- une restauration de sauvegarde réussie ;
- une validation Chrome et Safari ;
- l’absence de bug bloquant ou de perte de données.

Consulte `RELEASE_CANDIDATE_TEST_PLAN.md` et `V1_READINESS_REPORT.md`.
