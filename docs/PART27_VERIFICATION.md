# Vérification de la partie 27

Ce document relie chaque demande au code effectivement modifié.

| Demande | Implémentation principale | Contrôle |
|---|---|---|
| Ancienne identité totalement supprimée | namespace `mapnplan`, stockage propre, composants éditoriaux publics retirés | `branding-contract.test.mjs` |
| Vue générale en un clic | onglet dérivé uniquement du paramètre `tab` dans `TripWorkspacePage.jsx` | `part27-requirements.test.mjs` |
| Date non tronquée | format numérique et largeur automatique dans `OverviewPanel.jsx` et `pages.css` | contrat partie 27 |
| Carte dans la langue choisie | MapLibre/OpenFreeMap et `mapLanguage.js` | contrat partie 27 |
| Zoom au clic | `flyTo` dans `TripMap.jsx` et `TripsMap.jsx` | contrat partie 27 |
| Recherche et ajout depuis Carte | `LocationAutocomplete` et fenêtre `Modal` dans `MapPanel.jsx` | contrat partie 27 |
| Une seule page Dépenses | `BudgetHubPanel.jsx` rend uniquement `SharedExpensesPanel` | contrat partie 27 |
| Répartition inégale | `splitShares`, mode égal/personnalisé et calculs de soldes | tests dépenses |
| Voyage seul non bloquant | participant unique automatiquement sélectionné, transferts masqués | tests et contrat partie 27 |
| Favicon et titre | fichier `mapnplan-favicon-rc5.svg` et titre à un seul tiret | contrat partie 27 |
| Duplication | `TripService.duplicate` et action dans `TripsPage.jsx` | test service voyage |
| Image de couverture | import local redimensionné ou URL, affichage carte et héros | contrat partie 27 |
| Carte globale | coordonnées de destination et inférence depuis le contenu cartographié | tests parcours |
| Ajouter une liste | `checklistLists` et bouton dédié dans `ChecklistPanel.jsx` | tests checklist |
| Studio privé | aucune route ni aucun fournisseur éditorial dans l’application publique | contrat partie 27 |
| Raccourcis Vue générale | cartes statistiques et liens de panneaux cliquables | contrat partie 27 |

Résultat local : 61 tests réussis. Le build final doit être exécuté par GitHub Actions après installation des dépendances.
