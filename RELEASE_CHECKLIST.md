# Checklist de validation — V0.1.23 rc.2

## Automatique

- [ ] GitHub Actions entièrement vert.
- [ ] Qualité du projet réussie.
- [ ] 38 tests réussis.
- [ ] Build Vite réussi.
- [ ] Budget de taille respecté.
- [ ] Audit Release Candidate réussi avec `buildChecked: true`.

## Données

- [ ] Les anciens voyages sont toujours lisibles après migration vers le schéma 17.
- [ ] Une sauvegarde peut être exportée, supprimée localement puis restaurée.
- [ ] Les fichiers ajoutés à une réservation sont visibles dans Documents.
- [ ] La duplication ne conserve pas les associations privées.

## Ergonomie

- [ ] Toutes les dates du séjour sont visibles.
- [ ] Chaque bouton de journée préremplit la bonne date.
- [ ] Le bouton inférieur reprend le dernier jour utilisé.
- [ ] Les champs Lieu ne chevauchent plus leur icône.
- [ ] Les textes restent lisibles à 150 % de zoom.
- [ ] Les tris de dépenses fonctionnent.
- [ ] Les dates apparaissent dans l’aperçu général.
