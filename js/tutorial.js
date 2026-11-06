/** Mission d'entraînement isolée — graine fixe, mutations contrôlées. */

import {
  createGame,
  interrogate,
  isCriterionCrossed,
  isDigitCrossed,
  launchHack,
  setDigit,
  toggleNotebookCriterion,
  toggleNotebookDigit,
  toggleVerifier,
} from "./game.js";

export const TUTORIAL_SEED = "FACILE1";
export const TUTORIAL_DIFFICULTY = "facile";

const CODE_133 = [1, 3, 3];
const CODE_132 = [1, 3, 2];
const CODE_232 = [2, 3, 2];

const NOTEBOOK_AB = {
  criteria: [
    { index: 0, id: "t-eq-3" },
    { index: 0, id: "t-gt-3" },
    { index: 1, id: "s-lt-3" },
    { index: 1, id: "s-gt-3" },
  ],
  digits: [
    { slot: 0, digit: 3 },
    { slot: 0, digit: 4 },
    { slot: 0, digit: 5 },
    { slot: 1, digit: 1 },
    { slot: 1, digit: 2 },
    { slot: 1, digit: 4 },
    { slot: 1, digit: 5 },
  ],
};

const NOTEBOOK_CD = {
  criteria: [
    { index: 2, id: "t-lt-c" },
    { index: 3, id: "c-odd" },
  ],
  digits: [
    { slot: 2, digit: 1 },
    { slot: 2, digit: 3 },
    { slot: 2, digit: 5 },
  ],
};

function sameCode(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

function sameIndexSet(selected, expected) {
  if (selected.length !== expected.length) return false;
  const have = [...selected].sort().join(",");
  const want = [...expected].sort().join(",");
  return have === want;
}

function notebookComplete(game, spec) {
  return (
    spec.criteria.every((item) => isCriterionCrossed(game, item.index, item.id)) &&
    spec.digits.every((item) => isDigitCrossed(game, item.slot, item.digit))
  );
}

function isAllowedNotebook(spec, action) {
  if (action.type === "nb-crit") {
    return spec.criteria.some((item) => item.index === action.index && item.id === action.criterionId);
  }
  if (action.type === "nb-digit") {
    return spec.digits.some((item) => item.slot === action.slot && item.digit === action.digit);
  }
  return false;
}

export function createTutorialSession() {
  return {
    game: createGame({ seed: TUTORIAL_SEED, difficulty: TUTORIAL_DIFFICULTY, tutorial: true }),
    step: "welcome",
    quitPrompt: false,
    exited: false,
  };
}

export function resetTutorial(session) {
  session.game = createGame({ seed: TUTORIAL_SEED, difficulty: TUTORIAL_DIFFICULTY, tutorial: true });
  session.step = "compose133";
  session.quitPrompt = false;
  session.exited = false;
  return session;
}

function syncComposeStep(session) {
  if (session.step === "compose133" && sameCode(session.game.testCode, CODE_133)) {
    session.step = "queryAB";
  } else if (session.step === "queryAB" && !sameCode(session.game.testCode, CODE_133)) {
    session.step = "compose133";
  } else if (session.step === "compose132" && sameCode(session.game.testCode, CODE_132)) {
    session.step = "queryCD";
  } else if (session.step === "queryCD" && !sameCode(session.game.testCode, CODE_132)) {
    session.step = "compose132";
  }
}

export function applyTutorial(session, action) {
  if (!action || session.exited) return { ok: false, mutated: false };

  if (action.type === "request-quit") {
    session.quitPrompt = true;
    return { ok: true, mutated: false };
  }
  if (action.type === "cancel-quit") {
    session.quitPrompt = false;
    return { ok: true, mutated: false };
  }
  if (action.type === "confirm-quit") {
    session.quitPrompt = false;
    session.exited = true;
    return { ok: true, mutated: false };
  }

  if (session.quitPrompt) return { ok: false, mutated: false };

  const step = session.step;
  const game = session.game;

  if (action.type === "continue") {
    if (step !== "welcome") return { ok: false, mutated: false };
    session.step = "compose133";
    return { ok: true, mutated: true };
  }

  if (action.type === "set-digit") {
    const allowed = step === "compose133" || step === "queryAB" || step === "compose132" || step === "queryCD" || step === "hack232";
    if (!allowed) return { ok: false, mutated: false };
    setDigit(game, action.slot, action.digit);
    syncComposeStep(session);
    return { ok: true, mutated: true };
  }

  if (action.type === "toggle-fw") {
    const allowed =
      (step === "queryAB" && (action.index === 0 || action.index === 1)) ||
      (step === "queryCD" && (action.index === 2 || action.index === 3));
    if (!allowed) return { ok: false, mutated: false };
    toggleVerifier(game, action.index);
    return { ok: true, mutated: true };
  }

  if (action.type === "query") {
    if (step === "queryAB" && sameCode(game.testCode, CODE_133) && sameIndexSet(game.selected, [0, 1])) {
      const result = interrogate(game);
      if (!result.ok) return { ok: false, mutated: false };
      session.step = "notebookAB";
      return { ok: true, mutated: true };
    }
    if (step === "queryCD" && sameCode(game.testCode, CODE_132) && sameIndexSet(game.selected, [2, 3])) {
      const result = interrogate(game);
      if (!result.ok) return { ok: false, mutated: false };
      session.step = "notebookCD";
      return { ok: true, mutated: true };
    }
    return { ok: false, mutated: false };
  }

  if (action.type === "nb-crit" || action.type === "nb-digit") {
    const spec = step === "notebookAB" ? NOTEBOOK_AB : step === "notebookCD" ? NOTEBOOK_CD : null;
    if (!spec || !isAllowedNotebook(spec, action)) return { ok: false, mutated: false };
    if (action.type === "nb-crit") toggleNotebookCriterion(game, action.index, action.criterionId);
    else toggleNotebookDigit(game, action.slot, action.digit);
    if (notebookComplete(game, spec)) {
      session.step = step === "notebookAB" ? "compose132" : "hack232";
    }
    return { ok: true, mutated: true };
  }

  if (action.type === "hack") {
    if (step !== "hack232" || !sameCode(game.testCode, CODE_232)) {
      return { ok: false, mutated: false };
    }
    const result = launchHack(game);
    if (!result.ok || !result.win) return { ok: false, mutated: false };
    session.step = "done";
    return { ok: true, mutated: true };
  }

  return { ok: false, mutated: false };
}

export function coachCopy(session) {
  const step = session.step;
  if (session.quitPrompt) {
    return {
      title: "Quitter la mission ?",
      body: "On arrête l'entraînement ici. Tes records de parties normales ne bougent pas.",
      target: null,
    };
  }
  switch (step) {
    case "welcome":
      return {
        title: "Mission d'entraînement",
        body: "On va poser des questions oui ou non aux pare-feu, noter ça dans le calepin, pis trouver le code. Ça compte pas pour tes records. Les règles cachées restent cachées tant qu'on n'a pas fini.",
        target: "continue",
      };
    case "compose133":
      return {
        title: "Compose un code d'essai",
        body: "Change ▲ de 3 à 1. Laisse ■ et ● à 3. C'est un code pour interroger, pas encore le piratage.",
        target: "digit-pick-0-1",
      };
    case "queryAB":
      return {
        title: "Interroge A et B",
        body: "Tu peux tester jusqu'à 3 pare-feu par manche. Sélectionne les pare-feu A et B, puis appuie sur Interroger.",
        target: "query-btn",
      };
    case "notebookAB":
      return {
        title: "Note ce que A et B viennent de dire",
        body: "A a dit ✔ alors que ▲ vaut 1 : barre « ▲ = 3 » et « ▲ > 3 » (ils auraient dit ✖). Il reste « ▲ < 3 » — barre aussi ▲ 3, 4 et 5. B a dit ✔ alors que ■ vaut 3 : barre « ■ < 3 » et « ■ > 3 ». Il reste « ■ = 3 » — barre ■ 1, 2, 4 et 5.",
        target: "notebook",
      };
    case "compose132":
      return {
        title: "Prépare la deuxième manche",
        body: "Passe ● de 3 à 2. On garde ▲ à 1 et ■ à 3.",
        target: "digit-pick-2-2",
      };
    case "queryCD":
      return {
        title: "Interroge C et D",
        body: "Sélectionne les pare-feu C et D, puis Interroger. On n'a pas encore le droit de lancer le piratage.",
        target: "query-btn",
      };
    case "notebookCD":
      return {
        title: "Note ce que C et D viennent de dire",
        body: "C a dit ✖ pour ▲1 vs ●2 : « ▲ < ● » aurait dit ✔, alors barre-le. Restent « ▲ = ● » et « ▲ > ● » — on ne désigne pas encore « la » règle. D a dit ✔ alors que ● vaut 2 : barre « ● est impair ». Il reste « ● est pair » — barre ● 1, 3 et 5.",
        target: "notebook",
      };
    case "hack232":
      return {
        title: "Trouve le code, d'après tes réponses",
        body: "▲ vaut 1 ou 2, ■ vaut 3, ● est pair (2 ou 4) : 132, 134, 232, 234. Ceux où ▲ < ● (132, 134, 234) contredisent le C✖. Il reste ▲2 ■3 ●2. (Si C était « ▲ > ● », plus aucun code ne marcherait avec le reste.) Compose 232 et lance le piratage.",
        target: "hack-btn",
      };
    case "done":
      return {
        title: "Mission terminée",
        body: "Bien joué. Tu as utilisé 2 manches et 4 requêtes. Ça ne compte pas pour tes records — les parties normales, oui.",
        target: null,
      };
    default:
      return { title: "", body: "", target: null };
  }
}

export function isTutorialFinished(session) {
  return session.step === "done";
}
