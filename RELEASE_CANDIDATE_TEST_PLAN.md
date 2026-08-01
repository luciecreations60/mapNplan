# Plan de test Release Candidate — V0.1.23 rc.2

## Préparation

Sauvegarder les données actuelles en JSON, envoyer la RC2 dans GitHub, attendre que toutes les étapes Actions soient vertes puis faire un rechargement forcé. Vérifier que la version affichée est `0.1.23` et que les voyages existants sont toujours présents.

## Parcours itinéraire

1. Créer un voyage de quatre jours et ouvrir Itinéraire.
2. Vérifier que les quatre journées existent avant tout ajout.
3. Ajouter une activité depuis le bouton du troisième jour et contrôler la date préremplie.
4. Ajouter une autre activité avec le bouton du bas et contrôler qu’il reprend le troisième jour.
5. Modifier la durée en `1 heure 20 minutes` et vérifier l’affichage `1 h 20 min`.
6. Créer un transport avec départ, arrivée et mode voiture, puis lancer l’estimation.
7. Créer une réservation depuis cette activité et contrôler l’onglet Réservations.

## Carte et météo

Cliquer sur plusieurs points de la carte, ajouter l’un d’eux à une date choisie et vérifier sa présence dans l’itinéraire. Ouvrir les outils météo et vérifier l’affichage horizontal étendu ainsi que l’indication de couverture des dates du voyage.

## Réservations, documents et dépenses

Ajouter une réservation avec un PDF ou une image. Contrôler que le document lié apparaît dans Documents et peut être ouvert. Ajouter des dépenses avec décimales, modifier une dépense, sélectionner une date de l’itinéraire et tester les tris par date et par nom.

## Navigateurs

Exécuter le parcours principal sous Chrome et Safari. Contrôler aussi la mise en page avec une largeur mobile, le zoom navigateur à 125 % et 150 %, le thème sombre et la navigation clavier.
