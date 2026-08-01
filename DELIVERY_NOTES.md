# V0.1 — Partie 19 — Publication SEO réelle

## Version

- Application : `0.1.18`
- Schéma de contenu SEO : `2`
- Format de publication SEO : `1`
- Schéma voyage : inchangé (`16`)

## Principales évolutions

- génération statique des guides pendant le build GitHub Actions ;
- URLs publiques sans hash ;
- génération automatique du sitemap, du robots.txt et du rapport SEO ;
- export `seo-pages.json` depuis le Studio de contenu ;
- audit de publication dans l’interface et dans le build ;
- URL GitHub Pages centralisée dans `project.config.js` ;
- prise en charge de la balise de vérification Google Search Console ;
- schémas Article, BreadcrumbList et FAQPage ;
- suppression de la balise `meta keywords` ;
- guide SEO complet en français.

## Workflow de publication

1. passer les guides relus au statut Publiée ;
2. télécharger `seo-pages.json` depuis le Studio ;
3. remplacer `content/seo-pages.json` sur GitHub ;
4. attendre GitHub Actions ;
5. contrôler `/guides/`, `/sitemap.xml` et `/seo-status.json` ;
6. envoyer le sitemap dans Search Console.

## Limites

- Search Console reste un service externe à configurer manuellement ;
- une page publiée et indexable n’est pas nécessairement indexée ou bien classée ;
- le score SEO interne est un contrôle éditorial, pas un score fourni par Google ;
- la propriété Search Console doit être vérifiée avec une valeur réellement fournie par Google.
