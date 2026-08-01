# Notes de livraison — V0.1.23 rc.2

La Partie 24 correspond à une RC2 corrective issue de retours d’utilisation réels. Elle ne rajoute pas de prestataires d’affiliation et n’active pas le référencement.

## Itinéraire

Les jours compris entre le départ et le retour sont affichés même lorsqu’ils sont vides. Chaque journée dispose de son propre bouton d’ajout, avec la date déjà sélectionnée. Le bouton situé en bas reprend le dernier jour de l’itinéraire contenant une activité. La durée est maintenant saisie en heures et minutes.

Les activités de transport peuvent enregistrer un lieu de départ, un lieu d’arrivée et un mode de transport. Une estimation locale est proposée lorsque les deux lieux possèdent des coordonnées. Le modèle longue distance a été corrigé pour éviter les durées irréalistes comme celle signalée entre Blaincourt et Mâcon.

## Carte, météo et réservations

Un clic sur la carte sélectionne un point, tente d’en retrouver le nom et ouvre un formulaire d’activité avec date, heure et type. La météo demande jusqu’à seize jours de prévisions et signale si les dates du voyage dépassent cette fenêtre.

Une réservation peut recevoir des fichiers lors de sa création ou modification. Un document lié est alors créé automatiquement et apparaît dans l’onglet Documents. Les activités hôtel, avion, transport et billet peuvent aussi générer une réservation afin d’éviter une double saisie.

## Présentation et dépenses

Le chevauchement entre l’icône et le texte des champs Lieu est corrigé avec une règle commune. La taille de base passe à 16 px et les espacements de formulaires sont resserrés. Les montants sont normalisés à deux décimales. Les dépenses de groupe peuvent être triées par date ou ordre alphabétique et leur date peut être choisie dans les journées du voyage.


## Correctif après premier déploiement RC2

Correction de la configuration Vite 8 : remplacement de `manualChunks` objet par `rolldownOptions.output.codeSplitting.groups`. Aucun changement métier ou de données.
