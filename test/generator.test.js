/**
 * Tests du catalogue et du générateur — lancés avec :
 *   node test/generator.test.js
 */
import {
  ALL_CODES,
  DIFFICULTIES,
  FAMILIES,
  acceptanceSet,
  codesEqual,
  criterionUnambiguousInFamily,
  familiesForDifficulty,
  familyUnambiguous,
  getCriterion,
  getFamily,
} from "../js/criteria.js";
import { allNecessary, codesMatching, generatePuzzle, inspectPuzzle } from "../js/generator.js";

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, message) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(message);
    console.error("  ✖", message);
  }
}

function section(title) {
  console.log(`\n▸ ${title}`);
}

section("Espace des codes");
assert(ALL_CODES.length === 125, "Il y a 125 codes (5³)");
assert(ALL_CODES[0][0] === 1 && ALL_CODES[0][2] === 1, "Le premier code est 1,1,1");
assert(
  ALL_CODES[ALL_CODES.length - 1][0] === 5 && ALL_CODES[ALL_CODES.length - 1][2] === 5,
  "Le dernier code est 5,5,5",
);
const uniqueKeys = new Set(ALL_CODES.map((c) => c.join("")));
assert(uniqueKeys.size === 125, "Tous les codes sont distincts");

section("Catalogue : familles saines");
const familyIds = FAMILIES.map((f) => f.id);
assert(new Set(familyIds).size === familyIds.length, "Les id de familles sont uniques");

for (const family of FAMILIES) {
  assert(family.criteria.length >= 2, `${family.id} a au moins 2 critères`);
  const critIds = family.criteria.map((c) => c.id);
  assert(new Set(critIds).size === critIds.length, `${family.id} : id de critères uniques`);
  for (const cr of family.criteria) {
    const accepted = acceptanceSet(cr);
    assert(accepted.length > 0, `${family.id}/${cr.id} accepte au moins un code`);
    assert(accepted.length < 125, `${family.id}/${cr.id} refuse au moins un code`);
  }
  assert(familyUnambiguous(family), `${family.id} : tous les critères ont un ensemble d'acceptation distinct`);
}

const allCritIds = FAMILIES.flatMap((f) => f.criteria.map((c) => c.id));
assert(new Set(allCritIds).size === allCritIds.length, "Les id de critères sont uniques dans tout le catalogue");

section("Pools de difficulté");
assert(familiesForDifficulty("facile").length >= 4, "Assez de familles faciles");
assert(familiesForDifficulty("moyen").some((f) => f.pool === "medium"), "Le pool moyen contient des familles medium");
assert(familiesForDifficulty("difficile").some((f) => f.pool === "hard"), "Le pool difficile contient des familles hard");
assert(
  familiesForDifficulty("facile").every((f) => f.pool === "easy"),
  "Facile n'utilise que des familles simples",
);
assert(
  !familiesForDifficulty("difficile").some((f) => f.id === "repeats-simple"),
  "Difficile n'embarque pas les doublons simples",
);
assert(
  !familiesForDifficulty("facile").some((f) => f.id === "repeats-detail"),
  "Facile n'embarque pas les doublons détaillés",
);
assert(familiesForDifficulty("difficile").length >= 6, "Assez de familles pour 6 pare-feu");

section("Déterminisme");
const a = generatePuzzle("TEST01", "facile");
const b = generatePuzzle("TEST01", "facile");
assert(codesEqual(a.solution, b.solution), "Même graine → même solution");
assert(
  a.verifiers.map((v) => `${v.familyId}:${v.chosenId}`).join("|") ===
    b.verifiers.map((v) => `${v.familyId}:${v.chosenId}`).join("|"),
  "Même graine → mêmes pare-feu et critères",
);
assert(a.verifiers.length === 4, "Facile : 4 pare-feu");
assert(generatePuzzle("TEST01", "moyen").verifiers.length === 5, "Moyen : 5 pare-feu");
assert(generatePuzzle("TEST01", "difficile").verifiers.length === 6, "Difficile : 6 pare-feu");

const other = generatePuzzle("TEST02", "facile");
const sameAsA =
  codesEqual(other.solution, a.solution) &&
  other.verifiers.map((v) => v.chosenId).join() === a.verifiers.map((v) => v.chosenId).join();
assert(!sameAsA, "Deux graines différentes ne collent pas toujours sur le même puzzle");

section("Invariants sur beaucoup de graines");
const counts = { facile: 120, moyen: 120, difficile: 120 };
for (const [diff, n] of Object.entries(counts)) {
  let generated = 0;
  const seen = new Set();
  const familyUse = new Map();
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const seed = `S${String(i).padStart(4, "0")}`;
    let puzzle;
    try {
      puzzle = generatePuzzle(seed, diff);
    } catch (err) {
      assert(false, `Génération échouée pour ${seed}/${diff}: ${err.message}`);
      continue;
    }
    generated += 1;
    const inspect = inspectPuzzle(puzzle);
    assert(inspect.unique, `${seed}/${diff}: solution unique (matching=${inspect.matchingCount})`);
    assert(inspect.necessary, `${seed}/${diff}: chaque pare-feu est nécessaire`);
    assert(inspect.unambiguous, `${seed}/${diff}: critères non ambigus dans leur famille`);
    assert(puzzle.verifiers.length === DIFFICULTIES[diff].n, `${seed}/${diff}: bon nombre de pare-feu`);

    const chosen = puzzle.verifiers.map((v) => getCriterion(v.familyId, v.chosenId));
    const matching = codesMatching(chosen);
    assert(matching.length === 1, `${seed}/${diff}: intersection de taille 1`);
    assert(codesEqual(matching[0], puzzle.solution), `${seed}/${diff}: l'intersection est la solution déclarée`);
    assert(allNecessary(chosen), `${seed}/${diff}: allNecessary() confirme`);

    for (const v of puzzle.verifiers) {
      const family = getFamily(v.familyId);
      const cr = getCriterion(v.familyId, v.chosenId);
      assert(cr.test(puzzle.solution), `${seed}/${diff}: ${v.letter} accepte la solution`);
      assert(
        criterionUnambiguousInFamily(family, cr),
        `${seed}/${diff}: ${v.letter} (${cr.id}) distinguable dans ${family.id}`,
      );
      familyUse.set(family.id, (familyUse.get(family.id) || 0) + 1);
    }

    const letters = puzzle.verifiers.map((v) => v.letter).join("");
    assert(letters === "ABCD".slice(0, puzzle.verifiers.length) || letters === "ABCDEF".slice(0, puzzle.verifiers.length),
      `${seed}/${diff}: lettres A+ séquentielles (${letters})`);

    seen.add(puzzle.solution.join("") + ":" + puzzle.verifiers.map((v) => v.chosenId).join(","));
  }
  const elapsed = Date.now() - t0;
  assert(generated === n, `${diff}: ${generated}/${n} puzzles générés`);
  assert(seen.size === n, `${diff}: ${seen.size} puzzles distincts sur ${n} graines`);
  console.log(`  ${diff}: ${generated} puzzles, ${seen.size} distincts, ${elapsed} ms`);
}

section("Déductibilité : identifier le critère suffit à trouver le code");
const demo = generatePuzzle("DEDUCE", "moyen");
const identified = demo.verifiers.map((v) => getCriterion(v.familyId, v.chosenId));
const leftover = codesMatching(identified);
assert(leftover.length === 1 && codesEqual(leftover[0], demo.solution), "Après identification des critères, un seul code");

console.log(`\n────────────────────────────────`);
console.log(`Résultat : ${passed} succès, ${failed} échec${failed > 1 ? "s" : ""}`);
if (failures.length) {
  console.log("\nÉchecs :");
  for (const f of failures) console.log(" -", f);
  process.exit(1);
}
console.log("Tous les tests passent.");
