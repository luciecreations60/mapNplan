# Identité visuelle mapNplan — RC4

## Nom et signature

- Nom public : **mapNplan**
- Signature française : **Planifiez. Explorez. Profitez.**
- Signature anglaise : **Plan. Explore. Enjoy.**

## Palette officielle

- Bleu-vert : `#1F90AD`
- Vert : `#2CBB6B`
- Bleu nuit : `#0F172A`
- Dégradé principal : `#1F90AD → #22AFA7 → #2CBB6B`
- Fond clair : `#F5F8F9`

## Typographie

Poppins est chargée depuis Google Fonts avec une pile de secours système. Aucun fichier de police n’est inclus dans le dépôt.

## Logo

- `public/mapnplan-mark.svg` : symbole seul
- `public/mapnplan-logo.svg` : logo horizontal avec signature
- `public/favicon.svg` : icône du navigateur et de la PWA

Le symbole reprend les trois panneaux de carte, le repère bleu nuit et le trajet blanc pointillé.

## Compatibilité des données

Le namespace interne `tripflow` est volontairement conservé pour les clés LocalStorage et la base IndexedDB. Le renommer ferait apparaître l’application comme vide aux utilisateurs existants. Cette dénomination n’est plus visible dans l’interface.

## Référencement

L’identité est appliquée à l’interface, mais l’indexation publique reste désactivée tant que le domaine définitif n’est pas choisi.
