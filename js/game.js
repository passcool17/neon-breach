/** État d'une partie : manches, calepin, piratage, records. */

import { generatePuzzle, evaluateCriterion } from "./generator.js";
import { DIFFICULTIES, formatCode } from "./criteria.js";
import { normalizeSeed, randomSeedString } from "./rng.js";

export { formatCode };
export const BEST_STORAGE_KEY = "neon-breach-best";
export const MAX_QUERIES_PER_ROUND = 3;

export const DIFFICULTY_ORDER = ["facile", "moyen", "difficile"];

export function difficultyLabel(id) {
  return DIFFICULTIES[id]?.label ?? id;
}

export function parseHashParams(search) {
  const params = new URLSearchParams(search || "");
  const seedRaw = params.get("seed");
  let difficulty = params.get("d") || "facile";
  if (!DIFFICULTIES[difficulty]) difficulty = "facile";
  return {
    seed: seedRaw ? normalizeSeed(seedRaw) : null,
    difficulty,
    hasSeed: Boolean(seedRaw && String(seedRaw).trim()),
  };
}

export function buildShareSearch(seed, difficulty) {
  const params = new URLSearchParams();
  params.set("seed", seed);
  params.set("d", difficulty);
  return `?${params.toString()}`;
}

export function loadBests() {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistBests(bests) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(bests));
  } catch {
    // mode privé / quota : on ignore
  }
}

export function createGame({ seed, difficulty }) {
  const cleanSeed = normalizeSeed(seed || randomSeedString());
  const puzzle = generatePuzzle(cleanSeed, difficulty);
  return {
    seed: cleanSeed,
    difficulty,
    puzzle,
    testCode: [3, 3, 3],
    selected: [],
    lastResults: {},
    log: [],
    rounds: 0,
    queries: 0,
    notebook: {
      digits: [[], [], []],
      criteria: puzzle.verifiers.map(() => []),
    },
    phase: "play",
    score: null,
    isNewRecord: false,
    record: loadBests()[difficulty] || null,
    message: "",
  };
}

export function setDigit(state, slot, value) {
  if (state.phase !== "play") return;
  if (value < 1 || value > 5) return;
  state.testCode[slot] = value;
  state.message = "";
}

export function toggleVerifier(state, index) {
  if (state.phase !== "play") return;
  const pos = state.selected.indexOf(index);
  if (pos >= 0) {
    state.selected.splice(pos, 1);
    state.message = "";
    return;
  }
  if (state.selected.length >= MAX_QUERIES_PER_ROUND) {
    state.message = "Maximum 3 pare-feu par manche — désélectionne-en un avant.";
    return;
  }
  state.selected.push(index);
  state.message = "";
}

export function canInterrogate(state) {
  return (
    state.phase === "play" &&
    state.testCode.every((n) => n >= 1 && n <= 5) &&
    state.selected.length >= 1 &&
    state.selected.length <= MAX_QUERIES_PER_ROUND
  );
}

export function interrogate(state) {
  if (state.phase !== "play") return { ok: false };
  if (state.selected.length < 1) {
    state.message = "Choisis au moins un pare-feu (max 3) avant d'interroger.";
    return { ok: false };
  }
  if (state.selected.length > MAX_QUERIES_PER_ROUND) {
    state.message = "Maximum 3 pare-feu par manche.";
    return { ok: false };
  }
  const code = [...state.testCode];
  const results = state.selected.map((index) => {
    const verifier = state.puzzle.verifiers[index];
    const pass = evaluateCriterion(verifier.familyId, verifier.chosenId, code);
    state.lastResults[verifier.letter] = { code: [...code], pass };
    return { letter: verifier.letter, index, pass };
  });
  state.rounds += 1;
  state.queries += results.length;
  state.log.push({ round: state.rounds, code, results });
  state.selected = [];
  state.message = "";
  return { ok: true, results };
}

export function toggleNotebookDigit(state, slot, digit) {
  const list = state.notebook.digits[slot];
  const i = list.indexOf(digit);
  if (i >= 0) list.splice(i, 1);
  else list.push(digit);
}

export function toggleNotebookCriterion(state, verifierIndex, criterionId) {
  const list = state.notebook.criteria[verifierIndex];
  const i = list.indexOf(criterionId);
  if (i >= 0) list.splice(i, 1);
  else list.push(criterionId);
}

export function isDigitCrossed(state, slot, digit) {
  return state.notebook.digits[slot].includes(digit);
}

export function isCriterionCrossed(state, verifierIndex, criterionId) {
  return state.notebook.criteria[verifierIndex].includes(criterionId);
}

export function launchHack(state) {
  if (state.phase !== "play") return { ok: false };
  if (!state.testCode.every((n) => n >= 1 && n <= 5)) {
    state.message = "Compose le code au complet avant de lancer le piratage.";
    return { ok: false };
  }
  const sol = state.puzzle.solution;
  const win = codesMatch(state.testCode, sol);
  if (win) {
    state.phase = "won";
    state.score = state.rounds + state.queries;
    const result = saveBestIfBetter(state);
    state.isNewRecord = result.isNew;
    state.record = result.best;
    state.message = "";
    return { ok: true, win: true };
  }
  state.phase = "lost";
  state.score = null;
  state.message = "";
  return { ok: true, win: false };
}

function codesMatch(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function saveBestIfBetter(state) {
  const all = loadBests();
  const prev = all[state.difficulty];
  const entry = {
    score: state.score,
    rounds: state.rounds,
    queries: state.queries,
    seed: state.seed,
  };
  const isNew = !prev || state.score < prev.score;
  if (isNew) {
    all[state.difficulty] = entry;
    persistBests(all);
  }
  return { isNew, best: isNew ? entry : prev };
}

export function chosenLabel(verifier) {
  return verifier.criteria.find((c) => c.id === verifier.chosenId)?.label ?? verifier.chosenId;
}

// Hooks de SFX ponctuels (clic / requête) : pas de fichiers fournis. Victoire/échec : js/audio.js
export function playSfx(_name) {}
