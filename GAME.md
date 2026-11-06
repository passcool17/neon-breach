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

## Contrôles

- Choisir la difficulté, éventuellement coller une graine, puis commencer.
- Composer un code d’essai (▲ ■ ●, chiffres 1–5).
- Cliquer jusqu’à 3 pare-feu, puis **Interroger**.
- Cocher / barrer des pistes dans le calepin.
- **Lancer le piratage** pour proposer un code final.
- **Comment jouer** ouvre un rappel des règles.

Clavier : tout se joue à la souris ou au doigt. Le jeu est pensé mobile-first autant que bureau.

## État

Dépôt tout frais : README + cette fiche seulement. La v1 n’est pas encore codée. GitHub Pages n’est pas activé.

## Prochaines idées

- Visuels pixel / glitch par Créa (les formes actuelles sont des placeholders CSS).
- Musique et SFX par SUNO (hooks prévus, pas de sons dans la v1).
- Plus de familles de pare-feu, quotidien partagé, replay animé d’une partie.
- Après fusion de la PR v1 dans `main`, basculer GitHub Pages de la branche `v1` vers `main`.
