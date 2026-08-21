# Livraison — V0.1.28 RC7 / partie 29

Cette livraison reprend la partie 28 et cible les parcours où l’utilisateur perdait son contexte ou devait corriger des données générées automatiquement.

## Principaux changements

- formulaire Itinéraire réordonné : lieu puis coordonnées, titre généré ensuite ;
- ajout par jour et modification d’activité directement en contexte ;
- hébergements multi-jours avec check-in/check-out et blocs intermédiaires compacts ;
- recherche géographique globale dans l’espace voyage afin de ne plus forcer les résultats vers la destination ;
- repères de carte numérotés, colorés par type et stables pendant le focus ;
- Lieux enregistrés : lieu avant nom, modal plus large et listes personnalisées persistantes ;
- horloge locale actualisée à la seconde ;
- navigation Réservation → Documents et visualisation des pièces jointes ;
- montants avec décimales utiles et calculs simples directement dans les champs ;
- Vue générale : Payé comparé au Budget du voyage, qui est un budget propre à ce voyage ;
- correctif du contrôle GitHub Actions pour le chunk MapLibre.

## Données existantes

Les anciennes activités dont les coordonnées ont déjà été enregistrées sur un mauvais résultat de géocodage ne peuvent pas être corrigées automatiquement sans risque. Il suffit de modifier l’activité et de sélectionner une nouvelle fois le bon lieu : les nouvelles recherches ne sont plus biaisées vers la destination du voyage.
