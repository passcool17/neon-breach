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
- **Mission d’entraînement** lance un casse-tête fixe déjà choisi (pas de `?seed=` dans l’adresse). Un coach te guide : code 133 puis pare-feu A et B, notes au calepin, code 132 puis C et D, encore le calepin, puis piratage sur 232. Les actions hors séquence ne changent rien. Ça ne lit ni n’écrit tes records, et ça ne lance pas le fond ni les jingles de partie notée (ta préférence Son reste respectée). **Recommencer la mission** ramène au premier code ; **Quitter** (ou Escape) demande confirmation avant de revenir à l’accueil.
- Composer un code d’essai en cliquant un chiffre (1–5) sous ▲, ■ et ●.
- Cliquer jusqu’à 3 cartes de pare-feu (elles s’allument), puis **Interroger les pare-feu**.
- Dans le **calepin**, cliquer un chiffre ou un critère pour le barrer (re-cliquer pour l’enlever).
- **Lancer le piratage** envoie le code d’essai actuel comme proposition finale.
- Après une victoire ou un échec, **Comprendre la solution** ouvre deux blocs distincts : d’abord l’élimination 125 → … avec les règles maintenant révélées (ce n’est pas « ce que tu aurais dû voir en jouant ») ; ensuite seulement ce que tes requêtes prouvaient. Si tu n’as posé aucune question, le deuxième bloc le dit clairement au lieu d’inventer une déduction.
- **Comment jouer** ouvre un rappel. **Copier le lien** partage la graine en cours (absent pendant l’entraînement).
- **Nouvelle partie** tire une autre graine à la même difficulté. **Rejouer cette graine** recommence le même puzzle.
- **Son : on / off** (dans l’en-tête) : activé par défaut (si tu l'as déjà coupé dans ce navigateur-là, ça reste coupé). Le navigateur peut attendre un premier clic avant de lancer la lecture. Le fond boucle doucement pendant une partie ; il s’arrête sur l’écran de victoire ou d’échec, remplacé par le jingle correspondant. Changer de partie ne superpose pas les pistes. Si tu changes d’onglet, ça se met en pause.

Clavier : Escape ferme d’abord l’aide, puis le panneau d’explication, puis ouvre (ou annule) le dialogue pour quitter l’entraînement. Le reste se joue à la souris ou au doigt. Pensé pour le téléphone autant que le bureau.

Partage : `https://passcool17.github.io/neon-breach/?seed=TA_GRAINE&d=facile` (ou `moyen` / `difficile`).

## État

v1 jouable sur la branche `v1` (HTML / CSS / JS vanilla, pas de build, pas de Phaser).

- Tests : `npm test` (générateur, présence des médias, machine d’état audio, explications de fin, machine d’entraînement).
- Mission d’entraînement et panneau « Comprendre la solution » ajoutés (cache `20261106-train1`). Les règles, le générateur, l’audio et les médias des parties normales restent les mêmes.
- GitHub Pages est servi depuis la branche **`v1`** à la racine : [https://passcool17.github.io/neon-breach/](https://passcool17.github.io/neon-breach/)
- **Après la fusion de la PR dans `main`**, basculer Pages de `v1` vers `main`.
- Visuels Créa intégrés : logo, fonds paysage/portrait (voile sombre pour le contraste), icônes de pare-feu A–F, bannières victoire/échec. `apercu.png` n’est pas dans le jeu.
- Audio fourni par l’utilisateur (titres ID3 : *Silent Circuit* / *Access Granted* / *Access Denied*). Son activé par défaut (un premier clic peut être nécessaire) ; voir [media/SOURCES.md](media/SOURCES.md). **Les droits n’ont pas été vérifiés.**
- PR : [https://github.com/passcool17/neon-breach/pull/1](https://github.com/passcool17/neon-breach/pull/1) — pas fusionnée, volontairement.

## Prochaines idées

- SFX ponctuels (clic, ✔/✖ d’une requête) : pas de fichiers fournis pour ça.
- Plus de familles de pare-feu, quotidien partagé, replay animé d’une partie.
- Après fusion de la PR v1 dans `main`, basculer GitHub Pages de la branche `v1` vers `main`.
