# Tests — V0.1.23 rc.2

## Commandes

```bash
npm run quality
npm test
npm run build
npm run performance:audit
npm run release:audit:ci
```

## Suite automatisée

La suite contient 38 tests répartis dans 14 fichiers. Elle couvre les migrations, sauvegardes, partages, calculs de dépenses, calendrier ICS, stockage, accessibilité, responsive, performances, verrouillage SEO, cycle de vie d’un voyage et ergonomie de l’itinéraire.

## Vérifications manuelles prioritaires

Tester l’ajout depuis le premier, un jour intermédiaire et le dernier jour du séjour. Vérifier le bouton inférieur après plusieurs ajouts. Tester un transport avec deux suggestions de lieux. Cliquer sur la carte et ajouter le lieu. Joindre un PDF à une réservation puis le retrouver dans Documents. Saisir `12,50` ou `12.50` selon le navigateur et contrôler l’affichage à deux décimales. Tester les quatre tris de dépenses.
