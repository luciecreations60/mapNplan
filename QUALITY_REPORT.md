# Rapport qualité — V0.1.28 RC7

## Résultats

- suite Node : **78/78 tests réussis** ;
- audit Release Candidate source : **41/41 contrôles réussis** ;
- cohérence des traductions : **1653 clés par langue** lors du dernier contrôle ;
- identité mapNplan et namespace propre contrôlés automatiquement ;
- nouveaux contrats dédiés à la partie 29 : itinéraire inline, hébergement, carte, recherche globale, lieux enregistrés, documents, calculs de montants et budget du voyage ;
- audit de taille corrigé : 750 Ko par chunk JavaScript générique, 1,1 Mo pour le vendor MapLibre.

## Build

Le build Vite complet doit être exécuté par GitHub Actions avec les dépendances installées. L’environnement de génération de l’archive ne contient pas le dossier `node_modules`; la syntaxe des sources est contrôlée séparément et la CI reste l’autorité pour le bundle de production.
