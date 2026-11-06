/**
 * Explications : révélation (prédicats du moteur) vs preuves du journal.
 *   node test/explain.test.js
 */
import { generatePuzzle } from "../js/generator.js";
import { codesEqual, formatCode } from "../js/criteria.js";
import { evidenceFromLog, hindsightSteps, isExplanationAllowed } from "../js/explain.js";

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

section("Autorisation");
assert(isExplanationAllowed("play") === false, "pas d'explication pendant play");
assert(isExplanationAllowed("won") === true, "explication après victoire");
assert(isExplanationAllowed("lost") === true, "explication après défaite");
assert(isExplanationAllowed("idle") === false, "pas d'explication hors fin de partie");

section("FACILE1 — lecture après révélation");
const facile1 = generatePuzzle("FACILE1", "facile");
assert(codesEqual(facile1.solution, [2, 3, 2]), "solution FACILE1 = 232");
assert(
  facile1.verifiers.map((v) => v.chosenId).join(",") === "t-lt-3,s-eq-3,t-eq-c,c-even",
  "critères cachés A–D",
);

const hinted = hindsightSteps(facile1);
assert(hinted.start === 125, "départ 125");
assert(hinted.steps.length === 4, "4 étapes (ordre des pare-feu)");
assert(hinted.steps.map((s) => s.letter).join("") === "ABCD", "ordre A B C D");
assert(hinted.steps[0].chosenLabel === "▲ < 3" && hinted.steps[0].before === 125 && hinted.steps[0].after === 50, "A : 125 → 50");
assert(hinted.steps[1].chosenLabel === "■ = 3" && hinted.steps[1].after === 10, "B : → 10");
assert(hinted.steps[1].remaining && hinted.steps[1].remaining.map((c) => c.join("")).join(",") === "131,132,133,134,135,231,232,233,234,235", "B : 10 codes listés");
assert(hinted.steps[2].chosenLabel === "▲ = ●" && hinted.steps[2].after === 2, "C : → 2");
assert(hinted.steps[2].remaining.map((c) => c.join("")).join(",") === "131,232", "C : 131 et 232");
assert(hinted.steps[3].chosenLabel === "● est pair" && hinted.steps[3].after === 1, "D : → 1");
assert(hinted.steps[3].remaining.map((c) => c.join("")).join(",") === "232", "D : 232");
assert(hinted.steps[0].remaining === null, "plus de 10 survivants à A : pas de liste");
assert(codesEqual(hinted.solution, [2, 3, 2]), "hindsight aboutit à la solution");

section("FACILE1 — preuves du journal scripté");
const log = [
  {
    round: 1,
    code: [1, 3, 3],
    results: [
      { letter: "A", index: 0, pass: true },
      { letter: "B", index: 1, pass: true },
    ],
  },
  {
    round: 2,
    code: [1, 3, 2],
    results: [
      { letter: "C", index: 2, pass: false },
      { letter: "D", index: 3, pass: true },
    ],
  },
];
const ev = evidenceFromLog(facile1, log);
assert(ev.emptyLog === false, "journal non vide");
assert(ev.queries.length === 4, "4 réponses dans le journal");

function q(letter) {
  return ev.queries.find((item) => item.letter === letter);
}
assert(q("A").pass === true && q("A").eliminated.map((c) => c.label).join("|") === "▲ = 3|▲ > 3", "A élimine = et >");
assert(q("A").kept.map((c) => c.label).join("|") === "▲ < 3", "A garde <");
assert(q("B").pass === true && q("B").eliminated.map((c) => c.label).join("|") === "■ < 3|■ > 3", "B élimine < et >");
assert(q("B").kept.map((c) => c.label).join("|") === "■ = 3", "B garde =");
assert(q("C").pass === false && q("C").eliminated.map((c) => c.label).join("|") === "▲ < ●", "C élimine <");
assert(q("C").kept.map((c) => c.label).join("|") === "▲ = ●|▲ > ●", "C garde = et >");
assert(q("D").pass === true && q("D").eliminated.map((c) => c.label).join("|") === "● est impair", "D élimine impair");
assert(q("D").kept.map((c) => c.label).join("|") === "● est pair", "D garde pair");
assert(ev.leftoverCount === 1 && ev.leftoverCodes.map((c) => c.join("")).join(",") === "232", "preuves : un seul code 232");

section("Journal vide");
const empty = evidenceFromLog(facile1, []);
assert(empty.emptyLog === true, "emptyLog si aucune requête");
assert(empty.queries.length === 0, "pas de fausses requêtes");
assert(empty.leftoverCodes === null && empty.leftoverCount === null, "pas de piste inventée");

section("Cohérence multi-graines");
for (const [seed, diff] of [["TEST01", "facile"], ["TEST01", "moyen"], ["S0007", "difficile"]]) {
  const puzzle = generatePuzzle(seed, diff);
  const steps = hindsightSteps(puzzle);
  assert(steps.start === 125, `${seed}/${diff} part de 125`);
  assert(steps.steps.length === puzzle.verifiers.length, `${seed}/${diff} une étape par pare-feu`);
  assert(steps.steps[steps.steps.length - 1].after === 1, `${seed}/${diff} finit à 1`);
  assert(codesEqual(steps.solution, puzzle.solution), `${seed}/${diff} solution = ${formatCode(puzzle.solution)}`);
  assert(steps.steps.every((s, i) => s.letter === puzzle.verifiers[i].letter), `${seed}/${diff} ordre des lettres`);
}

console.log(`\n────────────────────────────────`);
console.log(`Résultat : ${passed} succès, ${failed} échec${failed > 1 ? "s" : ""}`);
if (failed) process.exit(1);
console.log("Tous les tests explain passent.");
