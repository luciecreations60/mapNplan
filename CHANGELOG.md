# Changelog

## 0.1.28 — RC7 / partie 29 — 8 août 2026

### Itinéraire
- Le lieu est saisi avant le titre ; latitude et longitude restent groupées avec le lieu.
- Le titre se génère automatiquement à partir du lieu sélectionné pour tous les types d’activité ; un transport utilise le trajet départ → arrivée.
- **Ajouter pour ce jour** ouvre le formulaire directement sous la journée concernée, sans retour en haut de page.
- Les modifications restent sous l’activité concernée.
- Les hébergements utilisent une heure d’arrivée et une heure de départ : arrivée le premier jour, bloc séjour compact les jours intermédiaires, départ le dernier jour.

### Carte et lieux
- Les recherches de lieux depuis Itinéraire, Carte et Lieux enregistrés ne sont plus biaisées vers la destination du voyage, afin d’éviter par exemple qu’un port de Nice soit remplacé par un résultat en Corse.
- Les repères sont ancrés sur la coordonnée exacte, numérotés comme la liste latérale et colorés selon le type.
- Un clic sur un lieu existant recentre la carte sans ouvrir automatiquement un éditeur et sans perdre le zoom lors d’une annulation.
- Dans Lieux enregistrés, le lieu précède le nom généré ; la fenêtre est agrandie sur ordinateur et les listes personnalisées sont conservées dans le sélecteur.

### Outils, réservations et documents
- L’heure locale est mise à jour chaque seconde.
- Une réservation liée à des documents propose un accès direct à ces documents.
- Les pièces jointes image/PDF peuvent être visualisées dans l’application ; les autres formats sont ouverts dans le navigateur lorsqu’il le permet.

### Budget
- Les montants affichent jusqu’à deux décimales lorsqu’elles existent.
- Les champs de montant acceptent des calculs simples, par exemple `300/2`, `129,90+20` ou `(30+20)*2`.
- La carte Budget de la Vue générale compare désormais **Payé** au **Budget du voyage** ; le budget est propre à chaque voyage.

### Qualité et livraison
- Le budget de bundle autorise explicitement le paquet MapLibre jusqu’à 1,1 Mo tout en gardant 750 Ko pour les autres chunks JavaScript.
- Schéma de voyage porté à la version 21 pour les listes de lieux persistantes et les métadonnées d’hébergement.

## 0.1.27 — RC6 / partie 28 — 7 août 2026

### Corrigé
- Les images de couverture distantes utilisent désormais `cover`, restent centrées et ne se répètent plus.
- La modification d’une activité s’ouvre directement sous l’activité concernée.
- Les réservations créées depuis l’itinéraire sont ensuite ouvrables depuis l’activité liée.
- Les repères MapLibre utilisent une pointe ancrée exactement sur les coordonnées plutôt qu’un disque centré visuellement.

### Ajouté
- Modification directe du libellé libre affiché sous la date de chaque jour d’itinéraire.
- Hébergements multi-jours avec date d’arrivée et date de départ, affichés automatiquement sur chaque jour du séjour.
- Suggestions de dépenses depuis les activités disposant déjà d’un budget estimé.
- Sélection d’une activité budgétée depuis la fenêtre d’ajout de dépense, avec répartition égale par défaut entre les voyageurs.

### Données
- Schéma de voyage porté à la version 20 pour les séries d’hébergement et les liens activité/dépense/réservation.

## 0.1.26 — RC5 / partie 27 — 6 août 2026

### Corrigé
- Retour à Vue générale en un clic grâce à un état d’onglet unique dans l’URL.
- Dates de l’aperçu d’itinéraire non tronquées.
- Positionnement des voyages sur la carte globale.
- Icône d’onglet et titre de page mapNplan avec un seul tiret.

### Ajouté
- Carte MapLibre/OpenFreeMap dont les libellés suivent la langue choisie.
- Recherche de lieux et ajout direct à l’itinéraire ou aux lieux enregistrés.
- Zoom animé au clic sur un repère ou un résultat.
- Images de couverture locales ou distantes.
- Répartition personnalisée des dépenses.
- Listes de checklist persistantes.
- Raccourcis interactifs dans la Vue générale.

### Modifié
- Page Budget unifiée.
- Bibliothèque locale de voyages réinitialisée pour la phase de test.
- Studio de contenu retiré du client public.
