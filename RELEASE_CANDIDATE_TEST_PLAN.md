# Plan de test — V0.1.26 RC5 mapNplan

## 1. Démarrage propre

1. Déployer l’archive en remplacement complet de la version précédente.
2. Ouvrir le site dans une fenêtre privée ou utiliser **Effacer les données locales des voyages**.
3. Vérifier que la bibliothèque de voyages est vide.
4. Rechercher l’ancienne identité dans le dépôt et confirmer qu’aucune occurrence n’existe.

## 2. Navigation de l’espace voyage

1. Créer un voyage puis ouvrir **Itinéraire**.
2. Cliquer une seule fois sur **Vue générale**.
3. Confirmer que la Vue générale s’affiche immédiatement.
4. Depuis la Vue générale, tester chaque carte interactive : itinéraire, réservations, carte, budget, checklist, documents et réservations externes.
5. Vérifier les mêmes parcours sur ordinateur et mobile.

## 3. Aperçu de l’itinéraire

1. Ajouter plusieurs activités à des dates différentes.
2. Revenir à la Vue générale.
3. Vérifier que chaque date est entière et lisible sur Chrome, Safari et une largeur de 390 px.
4. Tester également un zoom navigateur à 125 % et 150 %.

## 4. Carte et recherche de lieux

1. Choisir le français dans les paramètres et ouvrir un voyage au Japon.
2. Vérifier que les libellés utilisent le français, puis l’anglais ou une écriture latine de repli, sans revenir volontairement aux noms locaux.
3. Refaire le test en anglais.
4. Rechercher un lieu depuis l’onglet Carte et sélectionner un résultat.
5. Vérifier le zoom automatique et l’ouverture de la fenêtre d’ajout.
6. Ajouter le lieu à l’itinéraire, puis aux lieux enregistrés.
7. Cliquer sur un repère déjà cartographié et vérifier le recentrage avec zoom.

## 5. Carte globale des voyages

1. Créer un voyage en Irlande et un voyage au Japon en choisissant une destination suggérée.
2. Ouvrir la carte globale de **Mes voyages**.
3. Vérifier que les deux voyages apparaissent au bon endroit.
4. Créer un voyage avec une destination saisie manuellement et vérifier que le géocodage de sauvegarde renseigne sa position lorsque le service est disponible.

## 6. Budget et dépenses de groupe

1. Vérifier qu’un seul onglet Budget/Dépenses est affiché.
2. Contrôler les quatre indicateurs : budget du voyage, payé, reste à payer et total prévu.
3. Ajouter une dépense pour une personne seule : aucune répartition ne doit bloquer l’enregistrement.
4. Ajouter deux voyageurs et une dépense répartie à parts égales.
5. Modifier la dépense avec une répartition personnalisée, par exemple 70/30.
6. Vérifier la répartition par catégorie, les soldes, les remboursements suggérés et le détail des parts.
7. Enregistrer un transfert d’argent et vérifier qu’il ajuste les soldes.
8. Sur mobile, vérifier que la liste des voyageurs apparaît avant les soldes.

## 7. Duplication et couverture

1. Créer un voyage avec une image locale puis vérifier son affichage sur la carte voyage et dans son en-tête.
2. Tester également une URL d’image HTTPS.
3. Dupliquer le voyage depuis **Mes voyages**.
4. Vérifier que le contenu et la couverture sont repris, mais que les identifiants internes sont nouveaux et que les fichiers privés ne sont pas dupliqués.

## 8. Checklist

1. Cliquer sur **Ajouter une liste**.
2. Donner un libellé libre et enregistrer une liste vide.
3. Ajouter des éléments dans cette liste.
4. Recharger la page et vérifier que la liste et ses éléments sont toujours présents.

## 9. Identité du navigateur

1. Forcer un rechargement sans cache après déploiement.
2. Vérifier le favicon mapNplan.
3. Vérifier le titre exact : `mapNplan - Planifiez. Explorez. Profitez.`
4. Installer la PWA et vérifier son nom et son icône.

## 10. Contrôles automatiques

```bash
npm install
npm run quality
npm test
npm run build
npm run performance:audit
npm run release:audit:ci
```
