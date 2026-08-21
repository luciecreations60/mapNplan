# Architecture — V0.1.28 RC7

- `src/components` : interface React par domaine.
- `src/contexts` : état local de l’application.
- `src/services` : persistance, HTTP, géocodage, fichiers et diagnostics.
- `src/utils` : calculs purs, normalisation, itinéraire et évaluation sécurisée des montants.
- `src/styles` : tokens, composants, pages et identité mapNplan.
- `tests` : contrats Node sans navigateur, dont les exigences dédiées à chaque release.

La carte repose sur MapLibre GL et OpenFreeMap. Les recherches de lieu au sein d’un voyage sont volontairement globales : le pays/destination du voyage ne force plus un résultat géographique incorrect.

Les voyages sont stockés sous le namespace `mapnplan`. Le schéma courant est la version 21.
