# Limites connues — V0.1.23 rc.2

Les durées de trajet sont des estimations locales basées sur la distance à vol d’oiseau, un facteur de réseau et une vitesse moyenne selon le mode. Elles ne tiennent pas compte du trafic, des travaux, des horaires, des correspondances, des péages ou d’un itinéraire routier réel. Elles servent à détecter les ordres de grandeur manifestement faux, pas à remplacer un GPS.

La recherche inversée de la carte et les suggestions de lieux dépendent du service public Photon. Une panne réseau laisse les coordonnées utilisables mais peut empêcher l’obtention automatique du nom.

Les prévisions météo disponibles sont limitées à la fenêtre maximale fournie par le service, actuellement seize jours. Un voyage plus lointain ne peut pas recevoir de prévisions fiables dès sa création.

Les fichiers restent stockés localement dans IndexedDB. Ils ne sont pas synchronisés entre appareils et peuvent être supprimés par le navigateur si l’utilisateur efface les données du site. Une sauvegarde complète reste recommandée.

Le référencement, le domaine définitif, les affiliations réelles, les comptes et la synchronisation cloud restent volontairement hors périmètre de cette candidate.
