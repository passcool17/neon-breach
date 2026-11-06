/**
 * Mission d'entraînement isolée (FACILE1 → 232).
 *   node test/tutorial.test.js
 */
import { codesEqual } from "../js/criteria.js";
import { BEST_STORAGE_KEY, createGame, launchHack, loadBests } from "../js/game.js";
import { generatePuzzle } from "../js/generator.js";
import {
  TUTORIAL_DIFFICULTY,
  TUTORIAL_SEED,
  applyTutorial,
  coachCopy,
  createTutorialSession,
  resetTutorial,
} from "../js/tutorial.js";

let passed = 0;
let failed = 0;

function assert(cond, message) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error("  ✖", message);
  }
}

function section(title) {
  console.log(`\n▸ ${title}`);
}

function snap(game) {
  return JSON.stringify({
    testCode: game.testCode,
    selected: game.selected,
    log: game.log,
    rounds: game.rounds,
    queries: game.queries,
    notebook: game.notebook,
    phase: game.phase,
    score: game.score,
  });
}

function unchanged(session, action, label) {
  const before = snap(session.game);
  const step = session.step;
  const result = applyTutorial(session, action);
  assert(result.ok === false && result.mutated === false, `${label}: refusée`);
  assert(snap(session.game) === before && session.step === step, `${label}: aucun changement`);
}

section("Puzzle FACILE1");
const raw = generatePuzzle(TUTORIAL_SEED, TUTORIAL_DIFFICULTY);
assert(TUTORIAL_SEED === "FACILE1" && TUTORIAL_DIFFICULTY === "facile", "constantes de mission");
assert(codesEqual(raw.solution, [2, 3, 2]), "solution 232");
assert(raw.verifiers.map((v) => `${v.letter}:${v.chosenId}`).join("|") === "A:t-lt-3|B:s-eq-3|C:t-eq-c|D:c-even", "critères A–D");

section("Isolation records à la création");
const rated = createGame({ seed: "FACILE1", difficulty: "facile" });
assert(rated.tutorial !== true, "partie normale : pas tutorial");
const tutGame = createGame({ seed: TUTORIAL_SEED, difficulty: TUTORIAL_DIFFICULTY, tutorial: true });
assert(tutGame.tutorial === true, "partie tutorial flaggée");
assert(tutGame.record === null, "tutorial ne lit pas les records");

section("Session et hors-séquence");
const session = createTutorialSession();
assert(session.step === "welcome", "départ accueil");
assert(session.game.tutorial === true, "session.tutorial");
assert(session.game.record === null, "session sans record");
assert(codesEqual(session.game.puzzle.solution, [2, 3, 2]), "session sur FACILE1");
assert(!session.game.phase || session.game.phase === "play", "phase play");

const earlyCoach = `${coachCopy(session).title} ${coachCopy(session).body}`;
assert(!earlyCoach.includes("▲ < 3") && !earlyCoach.includes("■ = 3"), "accueil ne révèle pas A/B");
assert(!earlyCoach.includes("▲ = ●") && !earlyCoach.includes("● est pair"), "accueil ne révèle pas C/D");

unchanged(session, { type: "query" }, "query pendant l'accueil");
unchanged(session, { type: "hack" }, "hack pendant l'accueil");
unchanged(session, { type: "set-digit", slot: 0, digit: 1 }, "chiffre pendant l'accueil");
unchanged(session, { type: "toggle-fw", index: 0 }, "pare-feu pendant l'accueil");

let res = applyTutorial(session, { type: "continue" });
assert(res.ok && res.mutated && session.step === "compose133", "Continuer → composition 133");
assert(session.game.testCode.join(",") === "3,3,3", "code d'essai encore 333");

unchanged(session, { type: "query" }, "query avant le bon code");
unchanged(session, { type: "hack" }, "hack avant la fin");
unchanged(session, { type: "toggle-fw", index: 0 }, "sélection avant l'étape requête");
unchanged(session, { type: "nb-crit", index: 0, criterionId: "t-eq-3" }, "calepin trop tôt");

applyTutorial(session, { type: "set-digit", slot: 0, digit: 1 });
assert(session.game.testCode.join(",") === "1,3,3", "▲ passé à 1");
assert(session.step === "queryAB", "code 133 → étape interroger A+B");

unchanged(session, { type: "query" }, "query sans A et B");
unchanged(session, { type: "toggle-fw", index: 2 }, "sélectionner C est ignoré");
assert(session.game.selected.length === 0, "C n'a pas été ajouté");

applyTutorial(session, { type: "toggle-fw", index: 0 });
applyTutorial(session, { type: "toggle-fw", index: 1 });
assert(session.game.selected.slice().sort().join(",") === "0,1", "A et B sélectionnés");

res = applyTutorial(session, { type: "query" });
assert(res.ok && session.step === "notebookAB", "interrogation A+B acceptée");
assert(session.game.rounds === 1 && session.game.queries === 2, "1 manche, 2 requêtes");
assert(session.game.log[0].results.map((r) => `${r.letter}${r.pass ? "✔" : "✖"}`).join("") === "A✔B✔", "journal A✔ B✔");

unchanged(session, { type: "nb-crit", index: 0, criterionId: "t-lt-3" }, "barrer le critère encore valide est ignoré");
unchanged(session, { type: "nb-digit", slot: 0, digit: 1 }, "barrer ▲1 est ignoré");
unchanged(session, { type: "query" }, "nouvelle requête pendant le calepin");
unchanged(session, { type: "set-digit", slot: 2, digit: 2 }, "changer le code pendant le calepin");

for (const id of ["t-eq-3", "t-gt-3"]) applyTutorial(session, { type: "nb-crit", index: 0, criterionId: id });
for (const id of ["s-lt-3", "s-gt-3"]) applyTutorial(session, { type: "nb-crit", index: 1, criterionId: id });
for (const d of [3, 4, 5]) applyTutorial(session, { type: "nb-digit", slot: 0, digit: d });
for (const d of [1, 2, 4]) applyTutorial(session, { type: "nb-digit", slot: 1, digit: d });
assert(session.step === "notebookAB", "pas encore avancé sans ■5");
applyTutorial(session, { type: "nb-digit", slot: 1, digit: 5 });
assert(session.step === "compose132", "calepin A/B complet → composer 132");
assert(session.game.notebook.criteria[0].includes("t-eq-3"), "▲ = 3 barré");

const midCoach = `${coachCopy(session).title} ${coachCopy(session).body}`;
assert(!`${coachCopy(session).title} ${coachCopy(session).body}`.includes("● est pair"), "pas encore la parité révélée");

applyTutorial(session, { type: "set-digit", slot: 2, digit: 2 });
assert(session.game.testCode.join(",") === "1,3,2" && session.step === "queryCD", "code 132 → interroger C+D");

unchanged(session, { type: "toggle-fw", index: 0 }, "re-sélectionner A ignoré");
applyTutorial(session, { type: "toggle-fw", index: 2 });
applyTutorial(session, { type: "toggle-fw", index: 3 });
res = applyTutorial(session, { type: "query" });
assert(res.ok && session.step === "notebookCD", "interrogation C+D");
assert(session.game.log[1].results.map((r) => `${r.letter}${r.pass ? "✔" : "✖"}`).join("") === "C✖D✔", "journal C✖ D✔");
assert(session.game.rounds === 2 && session.game.queries === 4, "2 manches, 4 requêtes");

applyTutorial(session, { type: "nb-crit", index: 2, criterionId: "t-lt-c" });
applyTutorial(session, { type: "nb-crit", index: 3, criterionId: "c-odd" });
applyTutorial(session, { type: "nb-digit", slot: 2, digit: 1 });
applyTutorial(session, { type: "nb-digit", slot: 2, digit: 3 });
assert(session.step === "notebookCD", "manque ●5");
applyTutorial(session, { type: "nb-digit", slot: 2, digit: 5 });
assert(session.step === "hack232", "calepin C/D complet → piratage");

unchanged(session, { type: "hack" }, "piratage tant que le code n'est pas 232");
applyTutorial(session, { type: "set-digit", slot: 0, digit: 2 });
assert(session.game.testCode.join(",") === "2,3,2", "code 232 composé");

const beforeHackStorage = typeof localStorage === "undefined" ? null : localStorage.getItem(BEST_STORAGE_KEY);
res = applyTutorial(session, { type: "hack" });
assert(res.ok && session.step === "done", "piratage accepté");
assert(session.game.phase === "won", "phase won");
assert(session.game.score === 6, "score informatif 2+4");
assert(session.game.isNewRecord === false, "pas de nouveau record");
assert(session.game.record === null, "record toujours null");
if (typeof localStorage !== "undefined") {
  assert(localStorage.getItem(BEST_STORAGE_KEY) === beforeHackStorage, "localStorage records inchangé");
}
assert(loadBests().facile === undefined || loadBests().facile.seed !== "FORCED", "pas d'écriture facile forcément");

section("Reset et sortie");
const restarted = createTutorialSession();
applyTutorial(restarted, { type: "continue" });
applyTutorial(restarted, { type: "set-digit", slot: 0, digit: 1 });
resetTutorial(restarted);
assert(restarted.step === "compose133", "reset → composition");
assert(restarted.game.log.length === 0 && restarted.game.rounds === 0, "journal vidé");
assert(restarted.game.testCode.join(",") === "3,3,3", "code 333");
assert(restarted.game.notebook.digits.every((d) => d.length === 0), "chiffres calepin vides");
assert(restarted.quitPrompt === false && restarted.game.tutorial === true, "prompt fermé, toujours tutorial");

applyTutorial(restarted, { type: "request-quit" });
assert(restarted.quitPrompt === true, "demande de sortie");
assert(restarted.step === "compose133", "la demande ne change pas l'étape");
applyTutorial(restarted, { type: "cancel-quit" });
assert(restarted.quitPrompt === false, "annulation");
applyTutorial(restarted, { type: "request-quit" });
applyTutorial(restarted, { type: "confirm-quit" });
assert(restarted.exited === true, "sortie confirmée");

section("Partie normale inchangée");
const normal = createGame({ seed: "FACILE1", difficulty: "facile" });
normal.testCode = [2, 3, 2];
const hacked = launchHack(normal);
assert(hacked.ok && hacked.win && normal.phase === "won", "une partie normale peut encore gagner");
assert(normal.tutorial !== true, "cette partie n'est pas une mission");

console.log(`\n────────────────────────────────`);
console.log(`Résultat : ${passed} succès, ${failed} échec${failed > 1 ? "s" : ""}`);
if (failed) process.exit(1);
console.log("Tous les tests tutorial passent.");
