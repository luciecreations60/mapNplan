# Changelog

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
