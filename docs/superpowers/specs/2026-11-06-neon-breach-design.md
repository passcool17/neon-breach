# Néon Breach — spécification de conception

Date : 2026-11-06  
Auteur : Arcade 2, pour Pascal  
Statut : approuvé (concept, solo illimité, thème labo de hacker néon)

## Intention

Casse-tête de déduction **original** jouable dans le navigateur. La *mécanique* (tester des hypothèses auprès de vérificateurs oui/non pour trouver un code unique) s’inspire du jeu de société Turing Machine. On ne copie **jamais** ses cartes, ses textes, ses visuels ni sa marque. Noms, critères, interface et habillage sont les nôtres.

Thème : labo de hacker néon. Ton de l’interface : français québécois, joueur, pas corporate.

## Boucle de jeu

Le serveur est protégé par un **code secret à 3 chiffres**. Chaque chiffre appartient à `{1,2,3,4,5}` et correspond à une couleur / glyphe :

| Position | Glyphe | Couleur |
|----------|--------|---------|
| 1 | ▲ | cyan |
| 2 | ■ | magenta |
| 3 | ● | jaune |

Il y a 5³ = **125** codes possibles.

Chaque puzzle aligne 4 à 6 **pare-feu** étiquetés A–F. Sur la carte d’un pare-feu, le joueur voit seulement la **famille** de règles (exemples : « Compare ▲ à 3 », « Parité de ■ », « Nombre de chiffres pairs », « Somme des chiffres », « Quel chiffre est le plus grand », « Doublons/répétitions », « Comparaison ▲ vs ● »). Le **critère exact** caché derrière cette famille reste secret.

### Une manche

1. Le joueur compose un **code d’essai**.
2. Il sélectionne jusqu’à **3 pare-feu** à interroger.
3. Chaque pare-feu choisi répond **✔** si le code d’essai satisfait son critère caché, **✖** sinon.
4. Le journal consigne la manche (code + réponses). Le calepin reste éditable en tout temps.

### Piratage final

Quand il est prêt, le joueur soumet un code via **« Lancer le piratage »**.

- Bonne réponse : écran de victoire. Score = **nombre de manches + nombre total de requêtes** (plus bas = mieux). Le meilleur score par difficulté est stocké dans `localStorage`.
- Mauvaise réponse : écran de défaite qui révèle le vrai code **et** le critère de chaque pare-feu.

### Difficultés

| Niveau | Pare-feu | Familles |
|--------|----------|----------|
| Facile | 4 | simples (comparaisons à une constante, parités, comparaisons entre deux chiffres, doublons simples) |
| Moyen | 5 | mélange, inclut des familles comme la somme ou le nombre de pairs |
| Difficile | 6 | familles plus tordues (plus grand chiffre, doublons détaillés, ordre, etc.) |

Puzzles **aléatoires illimités**. Une **graine** est affichée et peut se rejouer / se partager via l’URL `?seed=...&d=facile|moyen|difficile`.

Un overlay court **« Comment jouer »** rappelle les règles.

## Générateur — invariants obligatoires

Le tirage des critères cachés (un par pare-feu) doit garantir :

1. **Solution unique.** Exactement un code parmi les 125 satisfait tous les critères choisis.
2. **Nécessité.** Chaque pare-feu est nécessaire : si on retire n’importe lequel, il reste plus d’un code compatible avec les critères restants.
3. **Non-ambiguïté / déductibilité.** Aucun critère n’est ambigu dans sa famille : son ensemble d’acceptation (les codes qui passent) est distinct de celui de tout autre critère de la même famille. Ainsi, en interrogeant, on peut identifier le critère puis déduire le code à partir des familles visibles.

Ces trois propriétés sont testées par des tests unitaires Node (sans gros framework), sur beaucoup de graines.

## Interface

- HTML / CSS / JS vanilla en modules ES. **Pas d’étape de build. Pas de Phaser** (jeu surtout UI : boutons, grilles, calepin).
- Look néon : fond très sombre, lueurs cyan / magenta / jaune, police monospace, scanlines et un soupçon de glitch en CSS.
- Convivial sur téléphone (grosses cibles, colonnes qui s’empilent).
- Visuels v1 = **placeholders CSS uniquement**. L’art réel viendra plus tard (Créa). La musique aussi (SUNO). Prévoir des hooks `TODO`, ne pas générer d’assets.

### Calepin intégré

- Barrer les chiffres 1–5 pour ▲, ■ et ●.
- Pour chaque pare-feu, barrer les critères possibles de sa famille.
- Journal de toutes les manches passées.

## Technique prévue

```
index.html
css/style.css
js/rng.js          — RNG déterministe à partir d’une graine
js/criteria.js     — catalogue des familles et critères
js/generator.js    — tirage + vérifs d’invariants
js/game.js         — état de partie, scores, URL
js/ui.js           — rendu et événements
js/main.js         — amorce
test/generator.test.js
```

Scores : `localStorage` clé `neon-breach-best`.

## Hors v1

Pixel art, musique/SFX, compte quotidien global, animations de replay, comptes en ligne.
