# Installer la V0.1.24 RC3 sur GitHub

1. Dans l’application actuellement déployée, télécharger une sauvegarde JSON des voyages.
2. Décompresser `travel-planner-v0.1-part25.zip`.
3. Dans le dépôt GitHub `travel-planner`, choisir **Add file → Upload files**.
4. Déposer tout le contenu du dossier extrait à la racine, pas le dossier parent lui-même.
5. Accepter le remplacement des fichiers existants.
6. Utiliser le message de commit :

```text
fix: publish v0.1.24 release candidate 3
```

7. Ouvrir l’onglet **Actions** et attendre la réussite de toutes les étapes.
8. Actualiser avec `Ctrl + F5` sous Chrome/Edge/Firefox ou `Cmd + Option + R` sous Safari.

Le schéma 18 est migré automatiquement. Ne pas utiliser « Réinitialiser les données de démonstration » sans sauvegarde préalable, car cette action remplace les données locales.
