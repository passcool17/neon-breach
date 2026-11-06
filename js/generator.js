/** Générateur de puzzles : solution unique, pare-feu nécessaires, critères non ambigus. */

import { makeRng } from "./rng.js";
import {
  ALL_CODES,
  DIFFICULTIES,
  codesEqual,
  criterionUnambiguousInFamily,
  familiesForDifficulty,
  getCriterion,
  getFamily,
} from "./criteria.js";

const MAX_ATTEMPTS = 8000;

export function codesMatching(criteria, codes = ALL_CODES) {
  return codes.filter((code) => criteria.every((cr) => cr.test(code)));
}

export function allNecessary(criteria, codes = ALL_CODES) {
  if (criteria.length < 2) return false;
  return criteria.every((_, i) => {
    const without = criteria.filter((_, j) => j !== i);
    return codesMatching(without, codes).length > 1;
  });
}

export function evaluateCriterion(familyId, criterionId, code) {
  return getCriterion(familyId, criterionId).test(code);
}

function pickFamilies(rng, pool, cfg) {
  if (pool.length < cfg.n) return null;
  const needPool = cfg.requirePool;
  const needCount = cfg.requireCount || 0;

  if (!needPool || needCount <= 0) {
    return rng.shuffle(pool).slice(0, cfg.n);
  }

  const special = pool.filter((f) => f.pool === needPool);
  const other = pool.filter((f) => f.pool !== needPool);
  if (special.length < needCount) return null;
  if (special.length + other.length < cfg.n) return null;

  const pickedSpecial = rng.shuffle(special).slice(0, needCount);
  const pickedIds = new Set(pickedSpecial.map((f) => f.id));
  const leftover = rng.shuffle(pool.filter((f) => !pickedIds.has(f.id)));
  const restNeeded = cfg.n - needCount;
  if (leftover.length < restNeeded) return null;
  return rng.shuffle([...pickedSpecial, ...leftover.slice(0, restNeeded)]);
}

function serializeVerifier(family, criterion, letter) {
  return {
    letter,
    familyId: family.id,
    familyLabel: family.label,
    criteria: family.criteria.map((cr) => ({ id: cr.id, label: cr.label })),
    chosenId: criterion.id,
  };
}

export function inspectPuzzle(puzzle) {
  const chosen = puzzle.verifiers.map((v) => getCriterion(v.familyId, v.chosenId));
  const matching = codesMatching(chosen);
  const unique = matching.length === 1 && codesEqual(matching[0], puzzle.solution);
  const necessary = allNecessary(chosen);
  const unambiguous = puzzle.verifiers.every((v) => {
    const family = getFamily(v.familyId);
    const criterion = getCriterion(v.familyId, v.chosenId);
    return criterionUnambiguousInFamily(family, criterion);
  });
  return {
    unique,
    necessary,
    unambiguous,
    matchingCount: matching.length,
    valid: unique && necessary && unambiguous,
  };
}

/**
 * Tire un puzzle déterministe pour (seed, difficulty).
 * Garantit : 1 solution, chaque pare-feu nécessaire, chaque critère
 * distinguable dans sa famille (donc le code est déductible des familles).
 */
export function generatePuzzle(seed, difficulty) {
  const cfg = DIFFICULTIES[difficulty];
  if (!cfg) throw new Error(`Difficulté inconnue: ${difficulty}`);

  const rng = makeRng(`${seed}|${difficulty}|neon-breach-v1`);
  const pool = familiesForDifficulty(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = ALL_CODES[rng.int(ALL_CODES.length)];
    const families = pickFamilies(rng, pool, cfg);
    if (!families) continue;

    const picked = [];
    let ok = true;
    for (const family of families) {
      const accepting = family.criteria.filter((cr) => cr.test(solution));
      if (accepting.length === 0) {
        ok = false;
        break;
      }
      picked.push({ family, criterion: rng.pick(accepting) });
    }
    if (!ok) continue;

    const chosen = picked.map((p) => p.criterion);
    const matching = codesMatching(chosen);
    if (matching.length !== 1 || !codesEqual(matching[0], solution)) continue;
    if (!allNecessary(chosen)) continue;
    if (!picked.every(({ family, criterion }) => criterionUnambiguousInFamily(family, criterion))) {
      continue;
    }

    return {
      seed: String(seed),
      difficulty,
      solution: [...solution],
      verifiers: picked.map((p, i) => serializeVerifier(p.family, p.criterion, String.fromCharCode(65 + i))),
      attempts: attempt + 1,
    };
  }

  throw new Error(`Génération impossible (graine=${seed}, difficulté=${difficulty})`);
}
