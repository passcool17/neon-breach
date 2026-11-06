# Néon Breach — fiche de jeu

## Concept

Tu piratés un serveur protégé par un **code secret à 3 chiffres** (chaque chiffre va de 1 à 5), affichés comme ▲ cyan, ■ magenta et ● jaune.

Chaque casse-tête aligne 4 à 6 **pare-feu** (A–F). Sur chaque carte, tu vois seulement la *famille* de règles qu’il pourrait vérifier (ex. « Compare ▲ à 3 », « Parité de ■ », « Nombre de chiffres pairs »). La règle exacte, elle, reste cachée.

Chaque manche, tu entres un **code d’essai** et tu interroges jusqu’à **3 pare-feu**. Chacun répond ✔ ou ✖ pour *ce* code-là. Ton **calepin** te laisse barrer les critères possibles et les chiffres par couleur, et le journal garde toutes tes manches.

Quand tu penses tenir le code, tu lances **le piratage**. Bonne réponse : écran de victoire avec un score (manches + requêtes, plus bas = mieux). Mauvaise : le serveur te montre le vrai code et les critères cachés.

- **Facile** : 4 pare-feu, familles simples
- **Moyen** : 5 pare-feu
- **Difficile** : 6 pare-feu, familles plus tordues

Les puzzles sont générés à l’infini (graine affichée à l’écran, partageable via `?seed=...&d=...`). Les meilleurs scores par difficulté restent dans le navigateur.

Le générateur garantit : une seule solution parmi les 125 codes, chaque pare-feu est nécessaire, et chaque critère est distinguable dans sa famille — donc le casse-tête est déductible.

## Contrôles

- À l’accueil : choisir Facile / Moyen / Difficile, éventuellement coller une graine, puis **Commencer l’intrusion**.
- Composer un code d’essai en cliquant un chiffre (1–5) sous ▲, ■ et ●.
- Cliquer jusqu’à 3 cartes de pare-feu (elles s’allument), puis **Interroger les pare-feu**.
- Dans le **calepin**, cliquer un chiffre ou un critère pour le barrer (re-cliquer pour l’enlever).
- **Lancer le piratage** envoie le code d’essai actuel comme proposition finale.
- **Comment jouer** ouvre un rappel. **Copier le lien** partage la graine en cours.
- **Nouvelle partie** tire une autre graine à la même difficulté. **Rejouer cette graine** recommence le même puzzle.

Clavier : Escape ferme l’aide. Le reste se joue à la souris ou au doigt. Pensé pour le téléphone autant que le bureau.

Partage : `https://passcool17.github.io/neon-breach/?seed=TA_GRAINE&d=facile` (ou `moyen` / `difficile`).

## État

v1 jouable sur la branche `v1` (HTML / CSS / JS vanilla, pas de build, pas de Phaser).

- Tests du générateur : `node test/generator.test.js` (120 graines × 3 difficultés, plus contrôles du catalogue).
- GitHub Pages est servi depuis la branche **`v1`** à la racine : [https://passcool17.github.io/neon-breach/](https://passcool17.github.io/neon-breach/)
- **Après la fusion de la PR dans `main`**, basculer Pages de `v1` vers `main`.
- Visuels = placeholders CSS. Hooks `TODO(crea)` et `TODO(suno)` prêts pour l’art et la musique.

## Prochaines idées

- Visuels pixel / glitch par Créa (les formes actuelles sont des placeholders CSS).
- Musique et SFX par SUNO (hooks prévus, pas de sons dans la v1).
- Plus de familles de pare-feu, quotidien partagé, replay animé d’une partie.
- Après fusion de la PR v1 dans `main`, basculer GitHub Pages de la branche `v1` vers `main`.
