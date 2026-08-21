# Guide SEO pratique — mapNplan

## 1. À quoi sert le SEO ?

Le SEO, ou référencement naturel, sert à aider les moteurs de recherche à :

1. découvrir une page ;
2. comprendre son sujet ;
3. l’ajouter à leur index ;
4. décider pour quelles recherches elle peut être pertinente ;
5. la classer parmi d’autres résultats.

Il faut distinguer trois étapes :

- **Exploration** : Googlebot visite l’URL.
- **Indexation** : Google conserve et comprend la page.
- **Classement** : Google choisit sa position pour une recherche donnée.

Une page techniquement parfaite n’est pas automatiquement bien classée. Le contenu, la pertinence, la concurrence, la confiance accordée au site et l’expérience utilisateur comptent également.

## 2. Ce que la Partie 19 change

Les brouillons du Studio de contenu sont conservés dans le navigateur. Google ne peut pas lire ce stockage privé.

La Partie 19 ajoute une publication réellement indexable :

1. le Studio exporte `seo-pages.json` ;
2. ce fichier est placé dans `content/seo-pages.json` sur GitHub ;
3. GitHub Actions exécute `npm run build` ;
4. le script `scripts/generate-seo-pages.mjs` crée de vraies pages HTML ;
5. Vite copie ces pages dans le site publié.

Les URLs générées ont cette forme :

```text
https://luciecreations60.github.io/mapnplan/guides/three-days-in-paris/
```

Elles ne contiennent pas `#` et peuvent être explorées directement.

## 3. Fichiers générés automatiquement

Après chaque déploiement :

```text
/guides/index.html
/guides/<slug>/index.html
/sitemap.xml
/robots.txt
/seo-status.json
```

### `sitemap.xml`

Liste les pages publiques importantes et aide les moteurs à les découvrir.

### `robots.txt`

Autorise l’exploration et indique l’adresse du sitemap.

### `seo-status.json`

Contient le résultat de l’audit exécuté pendant le build : domaine, nombre de pages, slugs et scores.

## 4. Publier une page depuis le Studio

1. Ouvrir **Studio de contenu**.
2. Créer ou modifier un guide.
3. Vérifier son score et relire le contenu.
4. Choisir le statut **Publiée**.
5. Cliquer sur **Télécharger le fichier de publication**.
6. GitHub télécharge `seo-pages.json`.
7. Dans le dépôt, ouvrir le dossier `content`.
8. Remplacer `content/seo-pages.json` par le fichier téléchargé.
9. Utiliser le commit :

```text
content: publish destination guides
```

10. Attendre la coche verte dans **Actions**.

## 5. Vérifier immédiatement le déploiement

Ouvrir ces URLs :

```text
https://luciecreations60.github.io/mapnplan/guides/
https://luciecreations60.github.io/mapnplan/guides/three-days-in-paris/
https://luciecreations60.github.io/mapnplan/sitemap.xml
https://luciecreations60.github.io/mapnplan/robots.txt
https://luciecreations60.github.io/mapnplan/seo-status.json
```

Contrôles à effectuer :

- la page s’ouvre sans connexion ;
- l’URL ne contient pas `#` ;
- le titre et le texte sont visibles même après une ouverture directe ;
- le sitemap contient l’URL ;
- `seo-status.json` indique `passed: true`.

## 6. Ajouter le site à Google Search Console

### Propriété recommandée pendant GitHub Pages

Créer une propriété de type **Préfixe de l’URL** avec :

```text
https://luciecreations60.github.io/mapnplan/
```

### Vérification par balise HTML

Google fournit une valeur de vérification. Copier uniquement la valeur du champ `content`, puis la placer dans :

```js
// project.config.js
siteBaseUrl: 'https://luciecreations60.github.io/mapnplan',
googleSiteVerification: 'VALEUR_FOURNIE_PAR_GOOGLE',
```

Après le déploiement, revenir dans Search Console et cliquer sur **Valider**.

Ne jamais inventer cette valeur. Elle est propre à la propriété Search Console.

## 7. Envoyer le sitemap

Dans Search Console :

1. ouvrir **Sitemaps** ;
2. saisir :

```text
sitemap.xml
```

3. cliquer sur **Envoyer**.

Le statut doit ensuite indiquer que le sitemap est accessible ou traité.

## 8. Demander l’indexation d’une page

Dans la barre supérieure de Search Console :

1. coller l’URL complète du guide ;
2. ouvrir **Inspection de l’URL** ;
3. lancer **Tester l’URL publiée** ;
4. vérifier que l’exploration est autorisée ;
5. cliquer sur **Demander une indexation**.

Cette demande ne garantit ni l’indexation ni une position précise.

## 9. Voir si une page est indexée

La méthode la plus fiable est **Inspection de l’URL** dans Search Console.

La recherche suivante peut donner une indication, mais elle n’est pas un rapport exhaustif :

```text
site:luciecreations60.github.io/mapnplan/guides/
```

## 10. Comprendre les statistiques

Dans **Performances → Résultats de recherche** :

- **Impressions** : la page a été affichée dans les résultats.
- **Clics** : un utilisateur a ouvert le site depuis Google.
- **CTR** : clics divisés par impressions.
- **Position moyenne** : position moyenne du résultat le mieux classé selon le rapport.
- **Requêtes** : mots saisis par les internautes.
- **Pages** : URLs ayant obtenu de la visibilité.

Pour un nouveau site, regarder d’abord l’évolution des impressions et des clics sur plusieurs semaines plutôt qu’une position isolée.

## 11. Tester les balises et données structurées

### Source HTML

Ouvrir une page publique, puis afficher le code source. Vérifier :

```html
<title>...</title>
<meta name="description" ...>
<link rel="canonical" ...>
<script type="application/ld+json">...</script>
```

### Rich Results Test

Utiliser l’outil officiel Google avec l’URL publique. Il détecte les données structurées reconnues et les erreurs techniques.

Une donnée structurée valide n’oblige pas Google à afficher un résultat enrichi.

## 12. Tester les performances

### Chrome Lighthouse

1. ouvrir la page ;
2. ouvrir les outils de développement ;
3. choisir **Lighthouse** ;
4. tester mobile et ordinateur ;
5. contrôler Performance, Accessibilité, Bonnes pratiques et SEO.

### PageSpeed Insights

Tester l’URL publique. L’outil fournit des données de laboratoire et, lorsqu’elles existent, des données réelles issues des utilisateurs Chrome.

Un score élevé aide l’expérience utilisateur, mais ne garantit pas une première position.

## 13. Contenu : ce qui compte vraiment

Chaque guide doit répondre clairement à une intention précise, par exemple :

```text
3 days in Paris
Rome itinerary for couples
Japan travel budget
Best area to stay in Tokyo for a first visit
```

Une page utile contient généralement :

- une réponse claire dès l’introduction ;
- un itinéraire réaliste ;
- des informations originales ou très bien structurées ;
- des conseils pratiques ;
- des liens internes vers d’autres guides ;
- des informations régulièrement vérifiées ;
- une date de mise à jour honnête.

Le score interne mapNplan est un contrôle de cohérence, pas une promesse de classement.

## 14. Mots-clés

Le mot-clé principal sert à guider le sujet et la rédaction. Il doit apparaître naturellement dans :

- le titre SEO ;
- le titre visible ;
- l’introduction ;
- certains sous-titres si cela reste naturel ;
- l’URL.

Il ne faut pas répéter artificiellement une expression. Google n’utilise pas la balise `meta keywords` pour le classement ; la Partie 19 ne la génère plus.

## 15. Passage futur au domaine commercial

Lorsqu’un domaine définitif sera choisi :

1. modifier `project.config.js` ;
2. remplacer `siteBaseUrl` ;
3. configurer le domaine dans GitHub Pages ;
4. republier ;
5. ajouter la nouvelle propriété Search Console ;
6. envoyer le nouveau sitemap ;
7. conserver des redirections permanentes depuis les anciennes URLs lorsque la plateforme le permet.

L’architecture centralisée évite de modifier chaque page manuellement.

## Références officielles

- Guide SEO Google : https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Inspection d’URL : https://support.google.com/webmasters/answer/9012289
- Sitemaps : https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Données structurées : https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Search Console : https://developers.google.com/search/docs/monitor-debug/search-console-start
- Signaux Web essentiels : https://developers.google.com/search/docs/appearance/core-web-vitals
