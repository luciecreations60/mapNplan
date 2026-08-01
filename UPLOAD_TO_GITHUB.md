# Installation GitHub — V0.1.23 rc.2

1. Télécharger puis décompresser `travel-planner-v0.1-part24.zip`.
2. Dans le dépôt `travel-planner`, ouvrir **Add file → Upload files**.
3. Déposer le contenu du dossier extrait, et non le dossier parent.
4. Autoriser le remplacement des fichiers existants.
5. Utiliser le message de commit :

```text
fix: update Vite 8 code splitting configuration
```

6. Ouvrir **Actions** et attendre la fin de toutes les étapes.
7. Vérifier `release-status.json` sur le site déployé : `version` doit valoir `0.1.23`, `candidate` doit valoir `rc.2`, `buildChecked` et `passed` doivent être vrais.
8. Recharger Chrome, Edge ou Firefox avec `Ctrl + F5`, ou Safari avec `Cmd + Option + R`.
9. Exécuter le plan `RELEASE_CANDIDATE_TEST_PLAN.md`.


## Correctif build

Cette archive remplace la syntaxe `manualChunks` incompatible avec Vite 8 par `rolldownOptions.output.codeSplitting`. Après le commit, relancer ou attendre le nouveau workflow GitHub Actions.
