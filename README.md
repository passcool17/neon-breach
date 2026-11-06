# Néon Breach

Un casse-tête de déduction solo : tu infiltres un serveur protégé par un code à trois chiffres, tu interroges des pare-feu qui répondent seulement ✔ ou ✖, et tu déduis le code en un minimum de questions.

Jeu original (thème labo de hacker néon). Inspiré par la *mécanique* de déduction du jeu de société Turing Machine, sans en reprendre les cartes, les textes ni la marque.

- **Jouer** : [https://passcool17.github.io/neon-breach/](https://passcool17.github.io/neon-breach/) (GitHub Pages, servi depuis la branche `v1` en attendant la fusion dans `main`)
- **Concept et contrôles** : [GAME.md](GAME.md)
- **Médias** : [media/SOURCES.md](media/SOURCES.md) (visuels + audio fourni par l'utilisateur ; droits non vérifiés)
- **Dépôt** : [github.com/passcool17/neon-breach](https://github.com/passcool17/neon-breach)

Le son est **activé par défaut** (si tu l'as déjà coupé dans ce navigateur-là, ça reste coupé). Un bouton « Son » (accessible, préférence mémorisée) le coupe ou le rallume. Le navigateur peut attendre un premier clic avant de lancer la lecture.

À l'accueil, **Mission d'entraînement** guide une partie fixe (FACILE1) étape par étape : tes records ne bougent pas, et le fond/jingle de partie notée ne part pas. En fin de partie (victoire ou échec, entraînement compris), **Comprendre la solution** sépare la lecture après révélation des règles de ce que tes requêtes prouvaient vraiment — y compris si tu n'as posé aucune question.

Pour lancer les tests (Node, sans framework) :

```bash
npm test
```

(ou `node test/generator.test.js`, `node test/assets.test.js`, `node test/audio.test.js`, `node test/explain.test.js`, `node test/tutorial.test.js`)

Aucun build n'est requis : ouvre `index.html` via un petit serveur local, ou joue en ligne.

Fait pour Pascal, par Arcade 2.
