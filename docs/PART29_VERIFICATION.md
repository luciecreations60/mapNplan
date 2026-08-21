# Vérification des demandes — partie 29

| Demande | Implémentation |
|---|---|
| Inverser Titre / Lieu dans Itinéraire | Lieu et coordonnées sont affichés avant le titre. Le titre se génère depuis le lieu. |
| Génération du titre pour toutes les activités | Tous les types non-transport utilisent le lieu sélectionné ; Transport utilise départ → arrivée, y compris le mode Ferry. |
| Ajouter pour ce jour sans scroll | Le formulaire de création est rendu sous la liste d’activités du jour. |
| Modification sous l’activité | L’éditeur est rendu directement sous l’activité sélectionnée. |
| Hôtel avec arrivée / départ | Check-in sur le premier jour, bloc séjour compact sans heure sur les jours intermédiaires, check-out sur le dernier jour. |
| Carte : points exacts | Repère MapLibre ancré par la pointe ; recherche de l’espace voyage non biaisée vers la destination. |
| Carte : clic à droite sans édition | Le clic fait uniquement un focus. L’éditeur n’est pas ouvert automatiquement et le focus n’est pas réinitialisé à la fermeture d’une autre sélection. |
| Numéros sur la carte | Les numéros de la liste sont rendus au centre des repères correspondants. |
| Couleurs par type | Palette distincte pour destination, lieu, restaurant, hébergement, avion, transport/ferry, activité, réservation et lieu enregistré. |
| Lieu enregistré : ordre des champs | Lieu avant Nom ; le nom reste généré puis modifiable. |
| Fenêtre Lieu enregistré plus grande | Variante `modal--large` sur ordinateur et suggestions élargies. |
| Liste personnalisée persistante | Les listes saisies sont enregistrées dans `savedPlaceLists` et reproposées. |
| Heure interactive | Rafraîchissement toutes les secondes. |
| Réservation vers documents | Bouton Documents lorsqu’un document est lié à la réservation. |
| Budget : décimales | Jusqu’à deux décimales, uniquement lorsqu’elles sont utiles. |
| Calcul dans les montants | Expressions sécurisées `+ - * / ( )` et virgule décimale acceptées. |
| Documents : visualisation | Images/PDF en aperçu navigateur ; autres types ouverts dans un nouvel onglet quand possible. |
| Vue générale : budget | Payé à gauche, Budget du voyage à droite, reste disponible = budget du voyage - payé. |
| Build size audit | Limite MapLibre dédiée à 1,1 Mo ; autres chunks restent à 750 Ko. |

## Note sur les anciens points mal géocodés

Une coordonnée déjà enregistrée ne peut pas être déplacée automatiquement à partir du seul nom sans risquer de modifier le mauvais lieu. Pour les activités créées avant cette correction, ouvrir **Modifier**, rechercher à nouveau le lieu et sélectionner la bonne suggestion. Les nouvelles recherches dans Itinéraire, Carte et Lieux enregistrés ne sont plus orientées de force vers la destination du voyage.
