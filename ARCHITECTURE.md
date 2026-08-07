# Architecture — V0.1.27 RC6

- `src/components` : interface React par domaine.
- `src/contexts` : état local de l’application.
- `src/services` : persistance, HTTP, géocodage, fichiers et diagnostics.
- `src/utils` : calculs purs, normalisation et helpers.
- `src/styles` : tokens, composants, pages et identité mapNplan.
- `tests` : contrats Node sans navigateur.

La carte repose sur MapLibre GL et OpenFreeMap. Les voyages sont stockés sous le namespace `mapnplan` avec une bibliothèque propre à cette version de test.
