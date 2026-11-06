# Néon Breach — mission d’entraînement et « Comprendre la solution »

Approuvé par Pascal le 6 novembre 2026 (12 h 13, America/Toronto ; confirmation BOSS 12 h 55). Copie de travail pour l’implémentation.


Spécification pour approbation (rien n’est encore codé). Deux ajouts, sans changer les règles d’une partie normale, sans nouveau média, sans modifier visuels ou audio actuels : une **mission d’entraînement fixe et interactive** (pas d’indices en partie normale) ; après **chaque** victoire ou défaite normale, un bouton optionnel **« Comprendre la solution »**. Le tutoriel guide les requêtes, le calepin et la découverte du code. Les records ne bougent pas.

## Puzzle de la mission

Graine **`FACILE1`**, difficulté **`facile`**, via `generatePuzzle` actuel (déterministe, solution unique, chaque pare-feu nécessaire, critères non ambigus).

| Pare-feu | Famille visible | Critère caché (seulement après la fin) |
| --- | --- | --- |
| A | Compare ▲ à 3 | ▲ < 3 |
| B | Compare ■ à 3 | ■ = 3 |
| C | Comparaison ▲ vs ● | ▲ = ● |
| D | Parité de ● | ● est pair |

Code secret : **▲2 ■3 ●2**. Le code d’essai par défaut est déjà 3-3-3 : on commence en changeant ▲.

Filtrage *après révélation*, ordre A→D, prédicats réels sur 125 codes : **125 → 50** (A : ▲ < 3) **→ 10** (B : ■ = 3 ; il reste 131–135 et 231–235) **→ 2** (C : ▲ = ● ; 131 et 232) **→ 1** (D : ● est pair ; 232). Sans A : 2 codes ; sans B : 5 ; sans C : 4 ; sans D : 2.

## Déroulement de la mission

L’UI reste celle d’aujourd’hui (`setDigit`, `toggleVerifier`, `interrogate`, calepin, `launchHack`). Un panneau coach dit la prochaine action et nomme la cible. Une action hors script **ne modifie pas** l’état (pas de requête ni de révélation) : le texte rappelle quoi faire. Tant que la mission n’est pas finie, les cartes n’affichent que la famille.

1. Accueil « Entraînement » : on pose des questions oui/non, on note, on trouve le code ; ça ne compte pas pour les records. Continuer ou Quitter.
2. Composer **▲1 ■3 ●3** (passer ▲ de 3 à 1).
3. Sélectionner **A et B** (jusqu’à 3 pare-feu par manche) puis Interroger. Journal, manche 1 : ▲1 ■3 ●3 → **A✔ B✔**.
4. Calepin *d’après ces ✔ seulement* : A✔ avec ▲ = 1 élimine « ▲ = 3 » et « ▲ > 3 » (ils auraient dit ✖) ; reste « ▲ < 3 » ; barrer ▲ 3, 4, 5. B✔ avec ■ = 3 élimine « ■ < 3 » et « ■ > 3 » ; reste « ■ = 3 » ; barrer ■ 1, 2, 4, 5.
5. Passer ● à 2 (code ▲1 ■3 ●2). Interroger **C et D**. Manche 2 : **C✖ D✔**.
6. Calepin *encore d’après les réponses* : C✖ sur ▲1 vs ●2 élimine « ▲ < ● » (1 < 2 aurait donné ✔) ; restent « ▲ = ● » et « ▲ > ● » — on ne proclame pas encore « la » règle. D✔ avec ● = 2 élimine « ● est impair » ; reste « ● est pair » ; barrer ● 1, 3, 5.
7. Déduction par les réponses, **pas** par lecture de `chosenId` : ▲ vaut 1 ou 2, ■ vaut 3, ● est pair (2 ou 4) → 132, 134, 232, 234. Ceux où ▲ < ● (132, 134, 234) contredisent le C✖. Il reste **▲2 ■3 ●2**. (Jointement, « ▲ > ● » ne laisse aucun code ; seule « ▲ = ● » en laisse — toujours à partir des requêtes.) Composer 232, **Lancer le piratage**. Avant cette étape, le piratage est refusé sans rien révéler.

Fin : réussite d’entraînement (2 manches, 4 requêtes, à titre informatif). **Aucune écriture dans `neon-breach-best`**, pas de « nouveau record ». Puis : Comprendre la solution, Recommencer, Retour à l’accueil.

## « Comprendre la solution » (parties normales)

Bouton sur les overlays win/lose actuels (`renderEnd`, après `launchHack`). **Absent** tant que `phase === "play"`. Deux blocs distincts :

**A. Lecture après révélation** (ce n’est pas « comment tu aurais dû déduire en jouant »). Pour chaque pare-feu **dans l’ordre A, B, C…** : famille, critère réellement choisi, et le compte de survivants en appliquant `criterion.test` à l’ensemble restant, depuis 125. Au-delà de 10 survivants, le compte seul ; en dessous, les codes (`formatCode`). Avertissement visible : cette section utilise les règles maintenant révélées.

**B. Ce que tes requêtes prouvaient.** Suivre le `log` réel (ordre des manches). Pour chaque ✔/✖, lister les critères de cette famille que le prédicat aurait envoyés dans l’autre sens, et ceux qui restent. Puis les codes encore possibles (produit des critères restants, `codesMatching`). Zéro requête : le dire, sans inventer de piste. Plusieurs codes restants : le dire (la révélation a tranché le reste). Aucun récit inventé.

La défaite liste déjà les critères ; le bouton ajoute le pas-à-pas. En victoire, les règles n’apparaissent que là.

## Session, reset, sortie, rejeu

Mode `tutorial` à part : même générateur, autre session. Lancement par le bouton menu **« Mission d’entraînement »**. On n’écrit pas `?seed=FACILE1&d=facile` (cette graine reste une vraie partie notée si on la lance en mode normal). En-tête : pas de « Copier le lien » ni « Nouvelle partie » ; **Recommencer la mission** et **Quitter**. Jamais `saveBestIfBetter`. Audio : pas d’`enterPlay` ni d’`enterResults` (pas de fond/jingle de partie notée) ; la préférence « Son » inchangée ; à la sortie, `enterIdle()`. Recommencer : même `FACILE1`, journal et calepin vides, code 3-3-3, étape 2 (composition). Quitter (bouton ou Escape) : « Quitter la mission ? » puis accueil, session détruite.

## Accessibilité

Coach en `aside`, titre, `aria-live="polite"`, cible dite dans le texte. Focus déplacé sur le titre à chaque étape. Tab : coach puis boutons existants. Escape ferme d’abord « Comment jouer » (déjà le cas), sinon le dialogue Quitter. Sur mobile, le coach s’empile sans cacher chiffres ni Interroger. Aucun nouvel visuel.

## Tests à prévoir (pas encore écrits ni exécutés)

`FACILE1`/facile → 232 et les quatre critères ; filtrage révélé 125, 50, 10, 2, 1 ; requêtes 133 → A✔ B✔ et 132 → C✖ D✔ avec les éliminations ci-dessus ; codes encore possibles = {232} ; explication interdite si `phase === "play"` ; comptes de n’importe quelle partie = prédicats du moteur, ordre des pare-feu ; bloc B = `log` réel seulement ; tutoriel sans lecture/écriture de `neon-breach-best` ; pas d’`enterPlay`/`enterResults` en mission ; aucun fichier média ajouté.

## Périmètre

Inclus : mission fixe ; explication après win/lose normal ; isolation records/audio/URL. Exclus : indices en partie normale ; autres missions ; modifier générateur, plafond de 3 requêtes ou score ; nouveaux visuels ou sons ; remplacer « Comment jouer » ; autoplay ; plan d’implémentation.

## Alternatives écartées

1. **Indices pendant les parties normales** — contraire à la demande (mission, pas d’indices) et à « ne jamais révéler tant que c’est actif ».
2. **Intro tirée au hasard avec bulles génériques** — on ne pourrait pas citer les comptes exacts ni figer une trace de test.

`FACILE1` mélange comparaisons à 3, comparaison entre chiffres et parité ; deux manches suffisent à enseigner sélection multiple, calepin et unicité à partir des réponses.

## Auto-revue

Comptes, ✔/✖ et barres de calepin : moteur actuel. Révélation (125 → 1, ordre A–D) séparée de la déduction via le journal. Rien de révélé pendant une partie ou une mission active. Records et audio de partie notée hors tutoriel. Pas de nouveau média ni de changement de règle. Conception seulement : pas encore implémenté, pas de tests lancés.
