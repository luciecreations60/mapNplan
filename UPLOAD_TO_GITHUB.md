# Mise en ligne de la partie 29 avec GitHub Desktop

1. Décompresser `travel-planner-v0.1-part29.zip`.
2. Dans GitHub Desktop, sélectionner le dépôt `travel-planner`, puis **Repository → Show in Explorer**.
3. Remplacer le contenu du projet local par le contenu décompressé sans supprimer le dossier caché `.git`.
4. Revenir dans GitHub Desktop et vérifier les fichiers ajoutés/modifiés/supprimés.
5. Commit conseillé : `mapNplan V0.1.28 RC7 - partie 29`.
6. Cliquer **Push origin**.
7. Dans GitHub → Actions, vérifier que `quality`, `tests`, `Production build`, `Build size audit`, `Release candidate audit` et le déploiement deviennent verts.
8. Faire un rechargement forcé du navigateur afin de récupérer le service worker de la partie 29.

Le correctif de budget de taille MapLibre est déjà inclus dans cette archive : aucun fichier `.mjs` séparé n’est à remplacer.
