# Plan de test — V0.1.25 RC4 mapNplan

## 1. Mise à jour sans perte de données

1. Ouvrir la RC3 et créer ou modifier un voyage.
2. Exporter une sauvegarde JSON.
3. Déployer la RC4 sans réinitialiser les données.
4. Vérifier que les voyages, documents, modèles et préférences sont toujours présents.

## 2. Identité visuelle

1. Vérifier le logo dans la barre latérale et la barre mobile.
2. Cliquer sur le logo et confirmer le retour au tableau de bord.
3. Vérifier le mot `mapNplan`, avec le `N` vert.
4. Vérifier les couleurs principales bleu-vert, vert et bleu nuit.
5. Vérifier les boutons en dégradé et les cartes arrondies.

## 3. Tableau de bord

1. Vérifier le nouveau bloc d’accueil.
2. Contrôler les cartes de statistiques et le prochain voyage.
3. Tester les quatre tuiles de raccourcis.
4. Tester `Tout afficher` et la création d’un voyage.

## 4. Espace voyage

1. Ouvrir chaque onglet principal.
2. Vérifier les héros, onglets actifs, formulaires, badges et cartes.
3. Contrôler la lisibilité des textes et des états de focus.
4. Tester un formulaire de création et un formulaire de modification.

## 5. Responsive et thèmes

1. Tester Chrome et Safari en largeur ordinateur.
2. Tester une largeur mobile de 390 px.
3. Vérifier le menu mobile et le logo compact.
4. Tester les thèmes clair et sombre.
5. Tester un zoom navigateur à 125 % et 150 %.

## 6. PWA et impression

1. Vérifier le favicon mapNplan.
2. Contrôler le nom et l’icône lors de l’installation PWA.
3. Ouvrir l’impression d’un voyage et vérifier le nom mapNplan.

## 7. Confidentialité

1. Vérifier que le HTML contient toujours `noindex`.
2. Vérifier qu’aucun prestataire commercial n’est activé par défaut.
