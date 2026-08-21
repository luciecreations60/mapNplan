# Limites connues — RC7

- Les données restent locales au navigateur ; elles ne sont pas synchronisées entre appareils.
- La connexion Google et les droits administrateur nécessitent un service d’authentification et un backend avant une mise en production.
- La recherche de lieux dépend du service public Photon et nécessite une connexion internet.
- Les tuiles OpenFreeMap nécessitent une connexion internet ; l’interface principale reste compatible avec le cache PWA.
- Certains lieux sans traduction disponible utilisent un nom latin ou anglais de repli.
- Une activité ayant déjà enregistré de mauvaises coordonnées dans une version précédente doit être réouverte et son lieu resélectionné ; mapNplan ne déplace pas automatiquement une activité existante vers un autre lieu.
- La visualisation intégrée est optimisée pour les images et PDF. Les autres formats dépendent des capacités du navigateur ou sont téléchargés en repli.
