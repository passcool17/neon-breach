/** Explications de fin de partie : révélation des règles vs preuves du journal. */

import { ALL_CODES, codesEqual, getCriterion, getFamily } from "./criteria.js";
import { codesMatching } from "./generator.js";

export function isExplanationAllowed(phase) {
  return phase === "won" || phase === "lost";
}

function cloneCode(code) {
  return [code[0], code[1], code[2]];
}

export function hindsightSteps(puzzle) {
  const steps = [];
  let current = ALL_CODES;
  for (const verifier of puzzle.verifiers) {
    const criterion = getCriterion(verifier.familyId, verifier.chosenId);
    const next = current.filter((code) => criterion.test(code));
    steps.push({
      letter: verifier.letter,
      familyId: verifier.familyId,
      familyLabel: verifier.familyLabel,
      chosenId: verifier.chosenId,
      chosenLabel: criterion.label,
      before: current.length,
      after: next.length,
      remaining: next.length <= 10 ? next.map(cloneCode) : null,
    });
    current = next;
  }
  return {
    start: ALL_CODES.length,
    steps,
    solution: current.length === 1 ? cloneCode(current[0]) : null,
  };
}

function findingsForObservation(verifier, code, pass) {
  const family = getFamily(verifier.familyId);
  const eliminated = [];
  const kept = [];
  for (const criterion of family.criteria) {
    const entry = { id: criterion.id, label: criterion.label };
    if (criterion.test(code) !== pass) eliminated.push(entry);
    else kept.push(entry);
  }
  return { eliminated, kept };
}

export function evidenceFromLog(puzzle, log) {
  if (!log || log.length === 0) {
    return {
      emptyLog: true,
      queries: [],
      leftoverCodes: null,
      leftoverCount: null,
    };
  }

  const queries = [];
  const remainingByLetter = new Map();
  for (const verifier of puzzle.verifiers) {
    remainingByLetter.set(
      verifier.letter,
      getFamily(verifier.familyId).criteria.map((cr) => ({ id: cr.id, label: cr.label })),
    );
  }

  for (const entry of log) {
    for (const result of entry.results) {
      const verifier = puzzle.verifiers[result.index] || puzzle.verifiers.find((v) => v.letter === result.letter);
      const findings = findingsForObservation(verifier, entry.code, result.pass);
      queries.push({
        round: entry.round,
        code: cloneCode(entry.code),
        letter: result.letter,
        pass: result.pass,
        eliminated: findings.eliminated,
        kept: findings.kept,
      });
      remainingByLetter.set(result.letter, findings.kept);
    }
  }

  // Refine remaining criteria using ALL observations on that verifier
  const remainingCriteria = puzzle.verifiers.map((verifier) => {
    const family = getFamily(verifier.familyId);
    const observations = [];
    for (const entry of log) {
      for (const result of entry.results) {
        if (result.letter === verifier.letter || result.index === puzzle.verifiers.indexOf(verifier)) {
          observations.push({ code: entry.code, pass: result.pass });
        }
      }
    }
    if (observations.length === 0) return family.criteria;
    return family.criteria.filter((cr) => observations.every((obs) => cr.test(obs.code) === obs.pass));
  });

  const leftover = new Map();
  function rec(i, acc) {
    if (i === remainingCriteria.length) {
      for (const code of codesMatching(acc)) leftover.set(code.join(""), cloneCode(code));
      return;
    }
    for (const cr of remainingCriteria[i]) rec(i + 1, [...acc, cr]);
  }
  rec(0, []);

  const leftoverCodes = [...leftover.values()];
  return {
    emptyLog: false,
    queries,
    leftoverCodes,
    leftoverCount: leftoverCodes.length,
  };
}

export { codesEqual };
