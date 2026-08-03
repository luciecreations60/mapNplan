# Rapport qualité — V0.1.24 RC3

## Résultats automatiques

- 46 tests automatisés réussis.
- 0 test en échec, ignoré ou désactivé.
- 36 contrôles Release Candidate réussis sur 36.
- 1 679 clés de traduction synchronisées en français et en anglais.
- 154 fichiers JavaScript, JSX et MJS analysés par TypeScript sans erreur de syntaxe.
- Imports relatifs et fichiers JSON contrôlés.
- Référencement public toujours verrouillé.
- Partenaires commerciaux toujours désactivés par défaut.

## Scénarios couverts

Les contrôles ajoutés couvrent les raccourcis du tableau de bord, le retour par le logo, le regroupement du budget, l’ordre des onglets, la recherche des réservations et documents, la modification des lieux, l’ajout d’un lieu depuis la carte, les formats de date, la carte de tous les voyages, l’enrichissement des checklists et la conservation des titres de listes personnalisées.

## Build

La configuration Vite 8 utilise toujours `rolldownOptions.output.codeSplitting`, correctif validé lors du dernier déploiement. Le build complet ne peut pas être exécuté dans ce conteneur car son accès au registre npm est indisponible. GitHub Actions doit donc confirmer `Production build`, `Build size audit` et `Release candidate audit` avant le déploiement.
