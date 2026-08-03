# V0.1.24 RC3 — Notes de livraison

Cette candidate corrige les parcours observés pendant les tests Chrome de la RC2. Le référencement public reste désactivé et aucun prestataire commercial supplémentaire n’est activé.

## Navigation

- Les raccourcis du tableau de bord ouvrent maintenant l’onglet demandé du prochain voyage actif.
- « Tout afficher » ouvre la bibliothèque complète des voyages.
- Le logo renvoie toujours au tableau de bord.
- Un changement de page replace automatiquement la fenêtre en haut, sans perturber la navigation entre les onglets d’un voyage.

## Voyages et carte globale

La page Mes voyages propose une vue Fiches et une vue Carte. Les voyages actifs et passés disposant de coordonnées sont affichés sur la carte. Un clic sur le bouton de la fenêtre du marqueur ouvre directement le voyage. Les filtres restent applicables à la carte.

## Espace voyage

- Les dates visibles utilisent le formateur central FR/EN.
- L’aperçu d’itinéraire place la date sur une ligne et l’heure juste dessous.
- Les en-têtes de journées sont plus contrastés.
- L’action d’une journée vide tient sur une ligne compacte.
- L’onglet Statistiques est placé en dernier.
- Budget et Dépenses de groupe sont regroupés dans un seul onglet Budget, avec deux sous-sections.

## Carte et optimisation

- Les commandes de zoom, marqueurs et textes TripFlow suivent la langue de l’interface.
- Les libellés du fond OpenStreetMap restent ceux fournis localement par les données cartographiques.
- Les cartes d’optimisation ont des marges et espacements homogènes.
- Depuis la carte d’un voyage, un point sélectionné peut être ajouté soit à l’itinéraire, soit aux Lieux enregistrés.

## Lieux, réservations et documents

- Le formulaire de lieu enregistré s’ouvre dans une fenêtre modale afin d’éviter le chevauchement avec les cartes.
- Modifier fonctionne sur les lieux de démonstration et les actions disposent d’infobulles.
- La sélection d’un lieu dans une activité ou réservation propose automatiquement un titre, qui reste modifiable.
- Les réservations disposent d’une recherche, d’un ordre de champs cohérent et d’une édition insérée sous la réservation concernée.
- Les documents disposent d’une recherche par titre, référence, note, réservation ou nom de fichier.

## Checklist

- Un élément peut recevoir un titre de liste personnalisé, par exemple « Essentiels pour bébé ».
- Les modèles City trip, Road trip, Plage et Professionnel ont été complétés avec les contrôles de documents, santé, paiements, réservations, technologie et bagages.

## Données

Le schéma de voyage passe de 17 à 18 pour conserver le titre personnalisé des listes de checklist. La migration est automatique et ne supprime aucune donnée existante.
