# Plan d’implémentation — Néon Breach v1

Date : 2026-11-06  
Branche : `v1` (PR vers `main`, sans fusion)  
Pages : servir depuis `v1` à la racine le temps de la revue ; basculer vers `main` après fusion.

## Objectif

Livrer une partie solo jouable de bout en bout : menu, overlay d’aide, génération garantie, manches d’interrogation, calepin, piratage, victoire/défaite, graines partageables, records locaux. Preuve : tests Node + partie Facile automatisée dans Chromium.

## Étapes

1. **Catalogue et RNG** (`js/rng.js`, `js/criteria.js`)  
   Graines string → mulberry32. Familles faciles / moyennes / difficiles avec libellés français. Vérifier à la main que chaque famille a des ensembles d’acceptation distincts.

2. **Générateur** (`js/generator.js`)  
   Tirer `n` familles selon la difficulté, un critère qui accepte un code candidat, puis filtrer jusqu’à : intersection de taille 1, chaque vérificateur nécessaire, aucun critère ambigu dans sa famille. Exporter les helpers pour les tests.

3. **Tests** (`test/generator.test.js`, `package.json` type module)  
   Catalogue sain ; déterminisme d’une graine ; 100+ graines par difficulté respectent les 3 invariants. Lancer avec `node test/generator.test.js`.

4. **État de jeu** (`js/game.js`)  
   Nouvelle partie, sélection de pare-feu (max 3), interrogation, journal, calepin, piratage, records `localStorage`, lecture/écriture de `?seed=&d=`.

5. **UI** (`index.html`, `css/style.css`, `js/ui.js`, `js/main.js`)  
   Menu + plateau néon, responsive, `data-testid` pour le playtest. Hooks `TODO(crea)` et `TODO(suno)`. Aucun asset généré.

6. **Publication**  
   Pousser `v1`, ouvrir la PR (description française), activer GitHub Pages sur `v1` `/`, attendre un HTTP 200, mettre à jour l’état dans `GAME.md`.

7. **Preuve**  
   Playtest Playwright/Chromium : Facile, code d’essai, 3 pare-feu, ✔/✖ + journal, calepin, piratage du bon code, écran de victoire. Capture 1280×800 dans `/workspace/games/neon-breach-shot.png`.

## Hors portée de cette branche

Art final, musique, fusion dans `main`, bascule Pages vers `main`.
