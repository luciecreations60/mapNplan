# Déploiement — mapNplan

## Prérequis

- Node >= 18 (recommandé, voir `package.json` pour la version minimale)
- npm

## Commandes utiles

```bash
# Installation des dépendances
npm install

# Développement local
npm run dev

# Build production
npm run build

# Vérifier la qualité du code
npm run quality

# Tests unitaires
npm test

# Aperçu de la build (serveur statique local)
npm run preview
```

## GitHub Pages

Le site est conçu pour un hébergement statique sur GitHub Pages.

### Configuration actuelle

- **URL de base** : définie dans `project.config.js` → `deployment.siteBaseUrl`
- **Dossier de sortie** : `dist/` (généré par Vite lors de `npm run build`)

### Déploiement

1. Générer le build : `npm run build`
2. Copier le contenu de `dist/` vers la branche `gh-pages` (ou utiliser une GitHub Action pour automatiser).
3. Dans GitHub Settings → Pages, s'assurer que la branche `gh-pages` est sélectionnée.

Les pages statiques sous `public/` sont copiées dans `dist/` automatiquement par Vite.

## Vercel / Netlify

Ces services détectent automatiquement Vite :

- **Commande de build** : `npm run build`
- **Dossier de sortie** : `dist/`
- **Node** : s'assurer que le runner utilise Node >= 18

Connecte le dépôt GitHub et déploie en quelques clics.

## Activer le référencement (procédure future)

Quand la micro-entreprise mapNplan sera créée et que tu voudras indexer le site :

1. **Mettre à jour `project.config.js`** :
   ```javascript
   release: {
     publicIndexingEnabled: true,
   }
   ```

2. **Retirer `meta robots` des pages publiques** :
   - Remplacer `meta robots="noindex,nofollow,noarchive"` par `meta robots="index, follow"` (ou supprimer la balise).

3. **Régénérer les pages SEO** (optionnel) :
   ```bash
   npm run seo:generate
   ```

4. **Vérifier Google Search Console** :
   - Ajouter la vérification Google dans `project.config.deployment.googleSiteVerification` si nécessaire.
   - Soumettre le sitemap et les pages pour indexation.

## Domaine personnalisé (futur)

Quand tu achèteras un domaine (ex. `mapnplan.com`) :

1. Créer un fichier `CNAME` dans `public/` avec le nom de domaine.
2. Configurer les DNS chez ton registraire (pointer vers `luciecreations60.github.io` ou l'hébergeur).
3. Mettre à jour `project.config.deployment.productionDomain` en `'mapnplan.com'`.
4. GitHub Pages reconnaîtra automatiquement le CNAME et activera le domaine personnalisé.

## Sécurité & vie privée

- Les données utilisateur sont stockées **localement** (`localStorage` / `IndexedDB`).
- **Aucune donnée personnelle** n'est envoyée aux serveurs.
- Documenter une politique de confidentialité ou un avis avant la mise en production.

## Diagnostic de build

Si le build échoue :

1. Vérifier que Node >= 18 est utilisé : `node --version`
2. Supprimer `node_modules` et `package-lock.json`, puis réinstaller : `npm install`
3. Vérifier les erreurs TypeScript/Vite : `npm run build` affiche les erreurs détaillées.
4. Vérifier les logs des scripts : `npm run quality` et `npm run test`.
