# Correctif de build — V0.1.23 rc.2

## Cause

GitHub Actions installait correctement les dépendances, puis Vite 8.1.5 refusait la configuration `manualChunks` sous forme d’objet.

## Correction

- remplacement de `build.rollupOptions.output.manualChunks` ;
- utilisation de `build.rolldownOptions.output.codeSplitting.groups` ;
- conservation des groupes React, Leaflet et Lucide ;
- ajout d’un test empêchant le retour de l’ancienne syntaxe.

Aucune fonctionnalité, donnée utilisateur, migration ou configuration SEO n’a été modifiée.
