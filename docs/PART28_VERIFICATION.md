# Vérification — V0.1.27 RC6 / partie 28

Cette livraison répond aux demandes de correction et d’enrichissement de l’itinéraire, de la carte et des dépenses.

| Demande | Implémentation | Contrôle |
| --- | --- | --- |
| Image web du voyage non dupliquée | `TripHero.jsx` force `background-size: cover`, centrage et absence de répétition même si les styles de marque utilisent un raccourci `background` | `part28-requirements.test.mjs` |
| Modifier le texte sous la date du jour | crayon directement à côté du libellé ; sauvegarde via `upsertItineraryDayTitle` | test unitaire + test source |
| Modification d’activité sans remonter en haut | formulaire d’édition rendu immédiatement sous la carte de l’activité | test source |
| Ouvrir une réservation liée | l’activité détecte sa réservation, ouvre l’onglet Réservations et centre la carte de réservation ciblée | test source |
| Repères de carte plus exacts visuellement | repère en forme de pointe avec `anchor: bottom`, la pointe correspond aux coordonnées | test source |
| Hébergement sur plusieurs jours | dates début/fin ; série commune affichée sur chaque jour ; coût estimé compté une seule fois | test unitaire |
| Dépense depuis une activité budgétée | activités avec coût estimé proposées dans la page dépenses et dans la fenêtre d’ajout | test unitaire + test source |
| Partage égal par défaut | tous les voyageurs sélectionnés et mode `equal` lors de la création depuis une activité | test source |

## Note carte

Le marqueur indique maintenant précisément la coordonnée par sa pointe, même lorsque la carte est dézoomée. La précision géographique elle-même reste celle du résultat choisi dans la recherche de lieu : choisir le bon résultat dans l’autocomplétion conserve ses latitude/longitude exactes.
