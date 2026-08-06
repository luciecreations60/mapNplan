# Notes de livraison — V0.1.26 RC5 mapNplan

## Partie 27 reconstruite depuis la RC4

- migration automatique des anciennes clés locales `tripflow:*` vers `mapnplan:*` ;
- formats d’export, diagnostics, pièces jointes et identifiants techniques renommés mapNplan ;
- Studio de contenu retiré de la navigation publique et désactivé par défaut ;
- budget classique et dépenses de groupe réunis sur une seule page ;
- recherche de lieux directement dans la carte et recentrage au clic ;
- fenêtre d’ajout depuis la carte adaptée aux petits écrans ;
- ajout d’une URL d’image de couverture dans la création et la modification d’un voyage ;
- bouton explicite « Ajouter une liste » dans la checklist ;
- duplication complète conservée avec régénération des identifiants imbriqués.

La migration du stockage conserve les données existantes : une ancienne clé est copiée vers le namespace mapNplan puis supprimée après lecture réussie.
