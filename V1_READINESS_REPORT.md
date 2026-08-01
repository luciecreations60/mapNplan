# Rapport de préparation V1 — V0.1.23 rc.2

## Évaluation actuelle

La candidate est techniquement prête pour une nouvelle phase de tests d’acceptation. Les retours pratiques de Chrome ont été intégrés sans réouvrir le périmètre commercial. Les contrôles source, traductions, tests de données et audit Release Candidate sont réussis.

## Conditions avant promotion en V1.0

1. GitHub Actions doit produire un build vert avec `buildChecked: true`.
2. Les parcours du plan RC2 doivent réussir sous Chrome et Safari.
3. Une sauvegarde complète doit être restaurée avec succès.
4. Aucun bug bloquant ou perte de données ne doit être observé pendant plusieurs sessions de test.
5. Les éventuels défauts restants doivent être classés en bloquants, majeurs ou mineurs.

## Décision

Cette RC2 ne doit pas encore être renommée V1.0 avant le retour de test utilisateur. Si aucun défaut bloquant ou majeur n’est découvert, la prochaine livraison pourra être une V1.0 de gel et documentation, sans ajout fonctionnel. Dans le cas contraire, une RC3 limitée aux corrections sera produite.
