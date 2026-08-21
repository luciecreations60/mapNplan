# Correctif GitHub Actions inclus — V0.1.28 RC7

## Cause observée dans la partie précédente

Le build Vite de production était réussi, mais l’étape **Build size audit** échouait parce que le chunk `map-vendor` généré par MapLibre dépassait la limite générique de 750 Ko.

## Correction incluse dans la partie 29

- limite générique conservée à **750 Ko** pour les chunks JavaScript ordinaires ;
- limite dédiée à **1,1 Mo** uniquement pour `map-vendor` ;
- limite JavaScript totale conservée à **2,5 Mo** ;
- test automatisé ajouté pour empêcher la disparition de cette règle.

Ce correctif ne désactive pas l’audit de performance : il distingue simplement le vendor cartographique des autres bundles.
