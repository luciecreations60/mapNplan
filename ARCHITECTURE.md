# Architecture — V0.1.23 rc.2

## Identité technique

- version applicative : `0.1.23` ;
- candidate : `rc.2` ;
- schéma voyage : `17` ;
- indexation publique : désactivée ;
- cache PWA : `tripflow-v0.1.23`.

## Nouveaux éléments de domaine

`src/utils/itinerary.js` centralise les plages de dates, l’insertion dans une journée vide, la dernière date utilisée et les conversions heures/minutes. Les activités peuvent désormais porter les champs `departureLocation`, `departureLatitude`, `departureLongitude`, `transportMode` et `linkedReservationId`. Les réservations peuvent conserver `sourceActivityId`.

## Services

Le service de géocodage expose maintenant une recherche inversée utilisée uniquement après un clic sur la carte. Le service météo inclut la profondeur de prévision dans sa clé de cache. Les pièces jointes ajoutées depuis une réservation utilisent le même `AttachmentStorageService` IndexedDB que l’onglet Documents.

## Compatibilité

Les nouvelles données sont normalisées par `TripService` lors du chargement. Les anciennes activités et réservations restent compatibles : les nouveaux champs reçoivent des valeurs neutres. Les duplications suppriment les associations privées afin de ne pas relier la copie à d’anciens fichiers ou réservations.
