# Plan de test — V0.1.28 RC7 mapNplan

## 1. Déploiement

1. Copier l’intégralité de la partie 29 dans le dépôt local cloné avec GitHub Desktop.
2. Commit puis **Push origin**.
3. Dans GitHub Actions, vérifier successivement : qualité, tests, build, audit de taille, audit RC et déploiement.
4. Vérifier que le chunk `map-vendor` n’échoue plus au seuil générique de 750 Ko.

## 2. Itinéraire

1. Cliquer **Ajouter pour ce jour** en milieu de page : le formulaire doit apparaître sous la journée sans retour en haut.
2. Vérifier l’ordre : Type, Lieu, latitude/longitude, puis Titre généré.
3. Sélectionner un lieu pour chaque type d’activité et contrôler le titre généré.
4. Pour Transport, choisir Ferry et vérifier le titre basé sur départ → arrivée.
5. Modifier une activité en milieu de journée et vérifier que l’éditeur reste sous l’activité.

## 3. Hébergement

1. Ajouter un hébergement du 28 au 31 août, arrivée 23:00, départ 10:00.
2. Vérifier : 28 = arrivée à 23:00 ; 29-30 = bloc séjour compact en haut ; 31 = départ à 10:00.
3. Vérifier que le budget de l’hébergement n’est compté qu’une fois.
4. Modifier le séjour depuis une occurrence et vérifier toute la série.

## 4. Carte

1. Dans un voyage en Corse, rechercher explicitement un lieu à Nice et sélectionner la bonne suggestion.
2. Vérifier que les nouvelles recherches ne sont pas forcées vers la Corse.
3. Comparer les numéros de la liste latérale aux numéros visibles sur les repères.
4. Vérifier les couleurs différentes pour hébergement, restauration, transport, activité, destination et lieu enregistré.
5. Cliquer sur un lieu de la liste : la carte doit se centrer sans ouvrir automatiquement le formulaire.
6. Ouvrir puis annuler un ajout depuis une recherche : le zoom courant doit être conservé.
7. Pour une ancienne activité mal localisée, la modifier et resélectionner le lieu exact.

## 5. Lieux enregistrés

1. Ouvrir **Ajouter un lieu** sur ordinateur.
2. Vérifier que Lieu apparaît avant Nom du lieu et que le nom se génère depuis la suggestion.
3. Vérifier que la liste de suggestions est entièrement visible dans la fenêtre agrandie.
4. Saisir une nouvelle liste personnalisée, enregistrer, puis ajouter un autre lieu et vérifier que cette liste est proposée.

## 6. Outils, réservations et documents

1. Ouvrir l’outil Heure locale et vérifier que les secondes avancent sans recharger la page.
2. Lier un document à une réservation.
3. Depuis Réservations, utiliser le bouton Documents et vérifier le focus sur le document lié.
4. Ajouter un PDF ou une image et cliquer **Visualiser**.
5. Tester un autre format et vérifier l’ouverture navigateur ou le téléchargement de repli.

## 7. Budget

1. Définir un budget du voyage, par exemple 3000 €.
2. Ajouter des dépenses et vérifier que les décimales ne sont affichées que lorsqu’elles existent.
3. Dans un champ de montant, saisir `300/2`, quitter le champ et vérifier 150.
4. Tester `129,90+20` et une répartition personnalisée.
5. Revenir à Vue générale : Payé doit être à gauche, Budget du voyage à droite et le reste disponible doit être `budget - payé`.
6. Confirmer que le budget est propre au voyage ouvert et non un budget global de tous les voyages.

## 8. Contrôles automatiques

```bash
npm install
npm run quality
npm test
npm run build
npm run performance:audit
npm run release:audit:ci
```
