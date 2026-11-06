# Néon Breach

Un casse-tête de déduction solo : tu infiltres un serveur protégé par un code à trois chiffres, tu interroges des pare-feu qui répondent seulement ✔ ou ✖, et tu déduis le code en un minimum de questions.

Jeu original (thème labo de hacker néon). Inspiré par la *mécanique* de déduction du jeu de société Turing Machine, sans en reprendre les cartes, les textes ni la marque.

- **Jouer** : [https://passcool17.github.io/neon-breach/](https://passcool17.github.io/neon-breach/) (GitHub Pages, servi depuis la branche `v1` en attendant la fusion dans `main`)
- **Concept et contrôles** : [GAME.md](GAME.md)
- **Médias** : [media/SOURCES.md](media/SOURCES.md) (visuels + audio fourni par l'utilisateur ; droits non vérifiés)
- **Dépôt** : [github.com/passcool17/neon-breach](https://github.com/passcool17/neon-breach)

Le son est **coupé par défaut**. Un bouton « Son » (accessible, préférence mémorisée) l'allume ; la lecture part seulement après un clic.

Pour lancer les tests (Node, sans framework) :

```bash
npm test
```

(ou `node test/generator.test.js`, `node test/assets.test.js`, `node test/audio.test.js`)

Aucun build n'est requis : ouvre `index.html` via un petit serveur local, ou joue en ligne.

Fait pour Pascal, par Arcade 2.
