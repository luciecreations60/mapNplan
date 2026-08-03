# Architecture — V0.1.24 RC3

L’application reste une SPA React/Vite hébergée sur GitHub Pages et fonctionne localement avec LocalStorage et IndexedDB.

## Évolutions structurelles RC3

- `src/utils/date.js` centralise les formats de dates visibles.
- `BudgetHubPanel` réunit budget classique et dépenses de groupe sans dupliquer les données.
- `TripsMap` présente les voyages géolocalisés et utilise la même configuration Leaflet que les cartes de voyage.
- `AppLayout` remet les nouvelles routes en haut de page.
- `Brand` est un lien React Router vers le tableau de bord.
- Les lieux enregistrés utilisent une modale d’édition afin d’isoler le formulaire de la grille.
- Les réservations utilisent un éditeur contextuel sous la carte sélectionnée.
- Le schéma 18 ajoute `checklist[].listTitle`.

Aucun backend, compte, domaine commercial ou mécanisme d’indexation publique n’est ajouté.
