/** Rendu et interactions — français québécois, ton joueur. */

import {
  buildShareSearch,
  chosenLabel,
  createGame,
  difficultyLabel,
  DIFFICULTY_ORDER,
  interrogate,
  isCriterionCrossed,
  isDigitCrossed,
  launchHack,
  loadBests,
  MAX_QUERIES_PER_ROUND,
  parseHashParams,
  playSfx,
  setDigit,
  toggleNotebookCriterion,
  toggleNotebookDigit,
  toggleVerifier,
} from "./game.js";
import { DIGIT_MAX, DIGIT_MIN, SLOTS, formatCode } from "./criteria.js";
import { randomSeedString } from "./rng.js";
import { IMAGES, applySceneBackground, assetUrl, firewallIcon } from "./assets.js";
import { createAudioController } from "./audio.js";
import { evidenceFromLog, hindsightSteps, isExplanationAllowed } from "./explain.js";
import { applyTutorial, coachCopy, createTutorialSession, resetTutorial } from "./tutorial.js";

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slotClass(i) {
  return ["cyan", "magenta", "yellow"][i];
}

export function mount(root) {
  const ui = {
    view: "menu",
    howto: false,
    toast: "",
    seedInput: "",
    difficulty: "facile",
    copied: false,
    explain: false,
  };
  let state = null;
  let session = null;
  let lastCoachStep = null;
  const audio = createAudioController();
  applySceneBackground();

  root.addEventListener("click", () => {
    audio.noteGesture();
  }, true);

  document.addEventListener("visibilitychange", () => {
    audio.setHidden(document.hidden);
  });

  const boot = parseHashParams(window.location.search);
  ui.difficulty = boot.difficulty;
  if (boot.hasSeed) {
    ui.seedInput = boot.seed;
    begin({ seed: boot.seed, difficulty: boot.difficulty });
  } else {
    paint();
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("keydown", onKey);

  function begin({ seed, difficulty }) {
    try {
      state = createGame({ seed, difficulty });
      ui.view = "play";
      ui.howto = false;
      ui.explain = false;
      ui.toast = "";
      ui.copied = false;
      const next = new URL(window.location.href);
      next.search = buildShareSearch(state.seed, state.difficulty).replace(/^\?/, "");
      history.replaceState({}, "", next);
      session = null;
      audio.enterPlay();
    } catch (err) {
      console.error(err);
      state = null;
      ui.view = "menu";
      ui.toast = "Oups, le générateur a craché sur cette graine-là. Essaie-en une autre.";
    }
    paint();
  }

  function startTutorial() {
    session = createTutorialSession();
    state = session.game;
    ui.view = "play";
    ui.howto = false;
    ui.explain = false;
    ui.toast = "";
    lastCoachStep = null;
    paint();
  }

  function resetMission() {
    if (!session) return;
    resetTutorial(session);
    state = session.game;
    ui.explain = false;
    lastCoachStep = null;
    paint();
  }

  function goMenu() {
    state = null;
    session = null;
    ui.view = "menu";
    ui.howto = false;
    ui.explain = false;
    ui.toast = "";
    lastCoachStep = null;
    audio.enterIdle();
    const next = new URL(window.location.href);
    next.search = "";
    history.replaceState({}, "", next);
    paint();
  }

  function paint() {
    root.innerHTML = `${renderHeader()}${
      ui.view === "menu" ? renderMenu() : renderPlay()
    }${ui.howto ? renderHowto() : ""}${
      session && session.step === "welcome" ? renderWelcome() : ""
    }${session && session.quitPrompt ? renderQuit() : ""}${
      state && state.phase !== "play" ? renderEnd() : ""
    }${ui.explain && state && isExplanationAllowed(state.phase) ? renderExplain() : ""}`;
    focusCoachIfNeeded();
  }

  function focusCoachIfNeeded() {
    if (!session) {
      lastCoachStep = null;
      return;
    }
    const key = `${session.step}:${session.quitPrompt ? "q" : ""}`;
    if (key === lastCoachStep) return;
    lastCoachStep = key;
    let id = "coach-title";
    if (session.quitPrompt) id = "quit-title";
    else if (session.step === "welcome") id = "welcome-title";
    else if (session.step === "done") return;
    const el = document.getElementById(id);
    if (el) el.focus();
  }

  function taughtClass(id) {
    if (!session) return "";
    const map = {
      compose133: ["digit-pick-0-1"],
      queryAB: ["verifier-A", "verifier-B", "query-btn"],
      notebookAB: ["notebook"],
      compose132: ["digit-pick-2-2"],
      queryCD: ["verifier-C", "verifier-D", "query-btn"],
      notebookCD: ["notebook"],
      hack232: ["digit-pick-0-2", "hack-btn"],
    };
    return (map[session.step] || []).includes(id) ? " is-taught" : "";
  }

  function renderHeader() {
    const playBits = session
      ? `<span class="badge" data-testid="difficulty-badge">Entraînement</span>
         <button type="button" class="ghost" data-action="reset-tutorial" data-testid="btn-reset-tutorial">Recommencer la mission</button>
         <button type="button" class="ghost" data-action="request-quit" data-testid="btn-quit-tutorial">Quitter</button>`
      : state
      ? `<span class="badge" data-testid="difficulty-badge">${esc(difficultyLabel(state.difficulty))}</span>
         <span class="seed" data-testid="seed-display" title="Graine du casse-tête">graine ${esc(state.seed)}</span>
         <button type="button" class="ghost" data-action="copy" data-testid="btn-copy">${
           ui.copied ? "Lien copié !" : "Copier le lien"
         }</button>
         <button type="button" class="ghost" data-action="new-game" data-testid="btn-new">Nouvelle partie</button>`
      : "";
    return `<header class="top">
      <button type="button" class="brand" data-action="home" data-testid="btn-home" aria-label="Néon Breach — retour à l'accueil">
        <span class="eyebrow">access node // labo d'intrusion</span>
        <img class="logo-img" src="${esc(assetUrl(IMAGES.logo))}" width="1200" height="300" alt="Néon Breach" data-testid="logo">
      </button>
      <div class="top-actions">
        ${playBits}
        ${renderSoundToggle()}
        <button type="button" class="ghost" data-action="howto" data-testid="btn-howto">Comment jouer</button>
      </div>
    </header>`;
  }

  function renderSoundToggle() {
    const on = audio.isEnabled();
    const label = on ? "Son : on" : "Son : off";
    const aria = on ? "Couper le son" : "Activer le son";
    return `<button type="button" class="ghost sound-toggle" data-action="toggle-sound" data-testid="btn-sound" aria-pressed="${on ? "true" : "false"}" aria-label="${esc(aria)}">${esc(label)}</button>`;
  }

  function renderMenu() {
    const bests = loadBests();
    const diffs = DIFFICULTY_ORDER.map((id) => {
      const on = ui.difficulty === id ? "is-on" : "";
      return `<button type="button" class="diff ${on}" data-action="difficulty" data-diff="${id}" data-testid="btn-difficulty-${id}">
        ${esc(difficultyLabel(id))}
      </button>`;
    }).join("");
    const records = DIFFICULTY_ORDER.map((id) => {
      const rec = bests[id];
      const body = rec
        ? `score ${rec.score} <span class="muted">(${rec.rounds} manches + ${rec.queries} requêtes) · graine ${esc(rec.seed)}</span>`
        : `<span class="muted">pas encore de record</span>`;
      return `<li data-testid="best-${id}"><strong>${esc(difficultyLabel(id))}</strong> — ${body}</li>`;
    }).join("");
    const toast = ui.toast ? `<p class="toast" data-testid="toast">${esc(ui.toast)}</p>` : "";
    return `<main class="menu" data-testid="menu">
      <p class="tagline">Infiltre le serveur. Pose tes questions. Trouve le code.</p>
      <p class="lede">Un casse-tête de déduction tout seul, à l'infini. Les pare-feu répondent juste ✔ ou ✖ — à toi de faire parler le silence.</p>
      <div class="diff-row" role="group" aria-label="Difficulté">${diffs}</div>
      <label class="seed-field">Graine <span class="muted">(optionnelle — pour rejouer ou défier quelqu'un)</span>
        <input type="text" maxlength="24" spellcheck="false" autocomplete="off" name="seed"
          data-testid="input-seed" placeholder="ex. K7P2MQ" value="${esc(ui.seedInput)}">
      </label>
      <button type="button" class="cta" data-action="start" data-testid="btn-start">Commencer l'intrusion</button>
      <button type="button" class="ghost" data-action="start-tutorial" data-testid="btn-tutorial">Mission d'entraînement</button>
      ${toast}
      <section class="records">
        <h2>Meilleurs scores</h2>
        <p class="muted">Plus c'est bas, plus t'es un crack. Sauvegardés dans ce navigateur-là seulement.</p>
        <ul>${records}</ul>
      </section>
    </main>`;
  }

  function renderPlay() {
    const n = state.selected.length;
    const queryLabel = `Interroger les pare-feu (${n}/${MAX_QUERIES_PER_ROUND})`;
    const coach = session && session.step !== "welcome" && state.phase === "play" ? renderCoach() : "";
    return `<main class="play${session ? " has-coach" : ""}" data-testid="play" data-seed="${esc(state.seed)}" data-difficulty="${esc(state.difficulty)}">
      ${coach}
      <section class="panel console">
        <h2>Code d'essai</h2>
        <div class="code-builder">${SLOTS.map(renderSlot).join("")}</div>
        <p class="code-preview" data-testid="code-preview">${renderColoredCode(state.testCode)}</p>
        <div class="actions">
          <button type="button" class="cta${taughtClass("query-btn")}" data-action="query" data-testid="query-btn">${esc(queryLabel)}</button>
          <button type="button" class="danger${taughtClass("hack-btn")}" data-action="hack" data-testid="hack-btn">Lancer le piratage</button>
        </div>
        <p class="hint muted">Clique jusqu'à 3 pare-feu, interroge, note tes déductions. Quand t'es confident : piratage.</p>
        ${state.message ? `<p class="toast" data-testid="message">${esc(state.message)}</p>` : `<p class="toast" data-testid="message" hidden></p>`}
        ${renderLog()}
      </section>
      <section class="panel firewalls">
        <h2>Pare-feu</h2>
        <div class="firewall-grid">${state.puzzle.verifiers.map(renderVerifier).join("")}</div>
      </section>
      <section class="panel notebook${taughtClass("notebook")}" data-testid="notebook">
        <h2>Calepin</h2>
        <p class="muted">Barre ce que tu élimines. C'est juste pour toi — le serveur s'en fout.</p>
        ${renderNotebook()}
      </section>
    </main>`;
  }

  function renderSlot(slot) {
    const current = state.testCode[slot.index];
    const buttons = [];
    for (let d = DIGIT_MIN; d <= DIGIT_MAX; d++) {
      const on = current === d ? "is-on" : "";
      buttons.push(
        `<button type="button" class="digit ${on}${taughtClass(`digit-pick-${slot.index}-${d}`)}" data-action="set-digit" data-slot="${slot.index}" data-digit="${d}" data-testid="digit-pick-${slot.index}-${d}">${d}</button>`,
      );
    }
    return `<div class="slot ${slotClass(slot.index)}">
      <div class="glyph" aria-hidden="true">${slot.glyph}</div>
      <div class="slot-name">${esc(slot.glyph)} ${esc(slot.name)}</div>
      <div class="digits" data-testid="digit-${slot.index}">${buttons.join("")}</div>
    </div>`;
  }

  function renderVerifier(verifier, index) {
    const selected = state.selected.includes(index) ? "is-selected" : "";
    const last = state.lastResults[verifier.letter];
    let result = `<span class="fw-result" data-testid="verifier-${verifier.letter}-result"></span>`;
    if (last) {
      const mark = last.pass ? "✔" : "✖";
      const kind = last.pass ? "is-yes" : "is-no";
      result = `<span class="fw-result ${kind}" data-testid="verifier-${verifier.letter}-result">${mark} ${esc(formatCode(last.code))}</span>`;
    }
    const icon = firewallIcon(verifier.letter);
    const iconTag = icon
      ? `<img class="fw-icon" src="${esc(assetUrl(icon))}" width="48" height="48" alt="" data-testid="verifier-${verifier.letter}-icon">`
      : "";
    return `<button type="button" class="fw-card ${selected}${taughtClass(`verifier-${verifier.letter}`)}" data-action="toggle-fw" data-index="${index}" data-testid="verifier-${verifier.letter}">
      <span class="fw-head">${iconTag}<span class="fw-letter">Pare-feu ${esc(verifier.letter)}</span></span>
      <span class="fw-label">${esc(verifier.familyLabel)}</span>
      ${result}
    </button>`;
  }

  function renderLog() {
    if (!state.log.length) {
      return `<section class="log" data-testid="log"><h3>Journal</h3><p class="muted">Aucune requête pour l'instant. Le silence est louche.</p></section>`;
    }
    const items = state.log
      .map((entry) => {
        const res = entry.results
          .map((r) => `<span class="${r.pass ? "is-yes" : "is-no"}">${esc(r.letter)}${r.pass ? "✔" : "✖"}</span>`)
          .join(" ");
        return `<li data-testid="log-entry-${entry.round}">
          <span class="log-round">Manche ${entry.round}</span>
          <span class="log-code">${esc(formatCode(entry.code))}</span>
          <span class="log-res">${res}</span>
        </li>`;
      })
      .join("");
    return `<section class="log" data-testid="log">
      <h3>Journal <span class="muted">${state.rounds} manche${state.rounds > 1 ? "s" : ""} · ${state.queries} requête${state.queries > 1 ? "s" : ""}</span></h3>
      <ol>${items}</ol>
    </section>`;
  }

  function renderNotebook() {
    const digitRows = SLOTS.map((slot) => {
      const buttons = [];
      for (let d = DIGIT_MIN; d <= DIGIT_MAX; d++) {
        const crossed = isDigitCrossed(state, slot.index, d) ? "is-crossed" : "";
        buttons.push(
          `<button type="button" class="nb-chip ${crossed}" data-action="nb-digit" data-slot="${slot.index}" data-digit="${d}" data-testid="notebook-digit-${slot.index}-${d}">${d}</button>`,
        );
      }
      return `<div class="nb-row ${slotClass(slot.index)}">
        <span class="nb-glyph">${slot.glyph}</span>
        <div class="nb-chips">${buttons.join("")}</div>
      </div>`;
    }).join("");

    const critBlocks = state.puzzle.verifiers
      .map((verifier, index) => {
        const chips = verifier.criteria
          .map((cr) => {
            const crossed = isCriterionCrossed(state, index, cr.id) ? "is-crossed" : "";
            return `<button type="button" class="nb-chip ${crossed}" data-action="nb-crit" data-index="${index}" data-crit="${esc(cr.id)}" data-testid="notebook-crit-${index}-${esc(cr.id)}">${esc(cr.label)}</button>`;
          })
          .join("");
        return `<div class="nb-family">
          <h3>${esc(verifier.letter)} · ${esc(verifier.familyLabel)}</h3>
          <div class="nb-chips">${chips}</div>
        </div>`;
      })
      .join("");

    return `<div class="nb-digits">${digitRows}</div>${critBlocks}`;
  }

  function renderCoach() {
    const copy = coachCopy(session);
    return `<aside class="panel coach" data-testid="coach" aria-live="polite">
      <p class="eyebrow">coach</p>
      <h2 id="coach-title" tabindex="-1">${esc(copy.title)}</h2>
      <p>${esc(copy.body)}</p>
    </aside>`;
  }

  function renderWelcome() {
    return `<div class="overlay" data-testid="tutorial-welcome">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
        <h2 id="welcome-title" tabindex="-1">Mission d'entraînement</h2>
        <p>Ici on joue un casse-tête déjà choisi, ensemble, une étape à la fois. Tes records ne bougent pas. Le but : voir comment les réponses des pare-feu éliminent des possibilités — sans qu'on te révèle les règles cachées.</p>
        <div class="actions">
          <button type="button" class="cta" data-action="tutorial-continue" data-testid="btn-tutorial-continue">Continuer</button>
          <button type="button" class="ghost" data-action="request-quit" data-testid="btn-welcome-quit">Quitter</button>
        </div>
      </div>
    </div>`;
  }

  function renderQuit() {
    return `<div class="overlay" data-testid="quit-tutorial">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="quit-title">
        <h2 id="quit-title" tabindex="-1">Quitter l'entraînement ?</h2>
        <p>Tu vas revenir à l'accueil. Rien n'est sauvegardé — c'est normal, cette mission ne compte pas.</p>
        <div class="actions">
          <button type="button" class="ghost" data-action="cancel-quit" data-testid="btn-stay-tutorial">Rester</button>
          <button type="button" class="danger" data-action="confirm-quit" data-testid="btn-confirm-quit">Quitter</button>
        </div>
      </div>
    </div>`;
  }

  function formatCodes(codes) {
    return codes.map((code) => formatCode(code)).join(", ");
  }

  function renderExplain() {
    const hinted = hindsightSteps(state.puzzle);
    const evidence = evidenceFromLog(state.puzzle, state.log);
    const hidden = hinted.steps
      .map((step) => {
        const leftover = step.remaining
          ? ` Restent : ${esc(formatCodes(step.remaining))}.`
          : "";
        return `<li data-testid="explain-hidden-${esc(step.letter)}"><strong>Pare-feu ${esc(step.letter)}</strong> — ${esc(step.familyLabel)} : ${esc(step.chosenLabel)}. ${step.before} → ${step.after}.${leftover}</li>`;
      })
      .join("");
    let evBody;
    if (evidence.emptyLog) {
      evBody = `<p data-testid="explain-empty-log">Tu n'as posé aucune question. La section ci-dessus explique les règles après révélation, pas une déduction en cours de partie.</p>`;
    } else {
      const items = evidence.queries
        .map((q, i) => {
          const mark = q.pass ? "✔" : "✖";
          const eliminated = q.eliminated.length
            ? q.eliminated.map((c) => c.label).join(", ")
            : "rien";
          const kept = q.kept.length ? q.kept.map((c) => c.label).join(", ") : "rien";
          return `<li data-testid="explain-query-${i}"><strong>Manche ${q.round}</strong> — code ${esc(formatCode(q.code))} · ${esc(q.letter)} ${mark} : élimine ${esc(eliminated)} ; restent ${esc(kept)}</li>`;
        })
        .join("");
      const leftover = evidence.leftoverCount == null
        ? ""
        : evidence.leftoverCount <= 15 && evidence.leftoverCodes
          ? `Après tes requêtes, ${evidence.leftoverCount} code${evidence.leftoverCount > 1 ? "s" : ""} restai${evidence.leftoverCount > 1 ? "ent" : "t"} compatible${evidence.leftoverCount > 1 ? "s" : ""} : ${esc(formatCodes(evidence.leftoverCodes))}.`
          : `Après tes requêtes, ${evidence.leftoverCount} code${evidence.leftoverCount > 1 ? "s" : ""} restai${evidence.leftoverCount > 1 ? "ent" : "t"} compatible${evidence.leftoverCount > 1 ? "s" : ""}.`;
      evBody = `<ol class="explain-list">${items}</ol>
        <p data-testid="explain-evidence-summary">${leftover}</p>`;
    }
    return `<div class="overlay" data-testid="explain-panel">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="explain-title">
        <h2 id="explain-title" tabindex="-1">Comprendre la solution</h2>
        <section data-testid="explain-hindsight">
          <h3>Lecture après révélation des règles</h3>
          <p class="warn">Cette section utilise les règles maintenant révélées — ce n'est pas « comment tu aurais dû déduire en cours de partie ».</p>
          <ol class="explain-list">${hidden}</ol>
        </section>
        <section data-testid="explain-evidence">
          <h3>Ce que tes requêtes prouvaient</h3>
          ${evBody}
        </section>
        <div class="actions">
          <button type="button" class="cta" data-action="close-explain" data-testid="btn-close-explain">Fermer</button>
        </div>
      </div>
    </div>`;
  }

  function renderHowto() {
    return `<div class="overlay" data-testid="howto" role="dialog" aria-labelledby="howto-title">
      <div class="dialog">
        <h2 id="howto-title">Comment jouer</h2>
        <p>Le serveur cache un <strong>code à 3 chiffres</strong> (chacun de 1 à 5) : <span class="cyan">▲ cyan</span>, <span class="magenta">■ magenta</span>, <span class="yellow">● jaune</span>.</p>
        <p>Chaque <strong>pare-feu</strong> a une règle secrète, mais il te montre juste le <em>genre</em> de règle — genre « Compare ▲ à 3 ». Ça veut peut-être dire plus petit, égal, ou plus grand. À toi de le déduire.</p>
        <p>Compose un code d'essai, clique jusqu'à <strong>3 pare-feu</strong>, pis appuie sur <strong>Interroger</strong>. Ils répondent juste ✔ ou ✖ pour <em>ce</em> code-là.</p>
        <p>Prends des notes dans le <strong>calepin</strong>, barre les possibilités mortes. Quand t'es confident, <strong>lance le piratage</strong>.</p>
        <p>Ton score = manches + requêtes. Plus c'est bas, mieux c'est. Une même graine + la même difficulté = le même casse-tête : partage le lien pour défier quelqu'un.</p>
        <p class="muted">Petite garantie du labo : y'a toujours une seule solution, chaque pare-feu sert à quelque chose, et c'est déductible. Pas de piège pourri.</p>
        <p class="muted">Le son est coupé par défaut. Le bouton <strong>Son</strong> l'allume (après un clic à toi — rien ne part tout seul).</p>
        <button type="button" class="cta" data-action="close-howto" data-testid="btn-howto-close">Compris, j'entre</button>
      </div>
    </div>`;
  }

  function renderEnd() {
    const win = state.phase === "won";
    const testId = win ? "win-screen" : "lose-screen";
    const title = state.tutorial ? "Mission terminée" : win ? "Brèche ouverte !" : "Accès refusé";
    const lead = state.tutorial
      ? "Bien joué. Ça ne compte pas pour tes records — les parties normales, oui."
      : win
      ? "T'as cracké le serveur. Bien joué, agent."
      : "Le serveur t'a grillé. Voici ce qu'il cachait.";
    const tutorialDone = Boolean(state.tutorial);
    const score = tutorialDone
      ? `<p class="score" data-testid="score">2 manches + 4 requêtes <span class="muted">(informatif — pas un record)</span></p>`
      : win
      ? `<p class="score" data-testid="score">Score ${state.score} <span class="muted">(${state.rounds} manche${state.rounds > 1 ? "s" : ""} + ${state.queries} requête${state.queries > 1 ? "s" : ""})</span></p>
         <p class="muted">${
           state.isNewRecord
             ? `Nouveau record en ${esc(difficultyLabel(state.difficulty))} ! Plus bas = mieux.`
             : state.record
               ? `Record actuel en ${esc(difficultyLabel(state.difficulty))} : ${state.record.score}.`
               : ""
         }</p>`
      : `<ul class="reveal" data-testid="reveal">${state.puzzle.verifiers
          .map((v) => `<li><strong>${esc(v.letter)}</strong> — ${esc(v.familyLabel)} : ${esc(chosenLabel(v))}</li>`)
          .join("")}</ul>`;
    const banner = win ? IMAGES.win : IMAGES.lose;
    const bannerAlt = win ? "Accès autorisé" : "Accès refusé";
    return `<div class="overlay" data-testid="${testId}" role="dialog">
      <div class="dialog ${win ? "is-win" : "is-lose"}">
        <img class="end-banner" src="${esc(assetUrl(banner))}" width="1200" height="600" alt="${esc(bannerAlt)}" data-testid="${win ? "win-banner" : "lose-banner"}">
        <h2>${title}</h2>
        <p>${lead}</p>
        <p class="end-code">Code secret ${renderColoredCode(state.puzzle.solution)}</p>
        ${score}
        <div class="actions">
          <button type="button" class="cta" data-action="open-explain" data-testid="btn-explain">Comprendre la solution</button>
          ${state.tutorial
            ? `<button type="button" class="ghost" data-action="reset-tutorial" data-testid="btn-reset-tutorial">Recommencer la mission</button>
          <button type="button" class="ghost" data-action="home" data-testid="btn-end-home">Retour à l'accueil</button>`
            : `<button type="button" class="ghost" data-action="replay" data-testid="btn-replay">Rejouer cette graine</button>
          <button type="button" class="ghost" data-action="new-game" data-testid="btn-end-new">Autre casse-tête</button>
          <button type="button" class="ghost" data-action="home" data-testid="btn-end-home">Retour à l'accueil</button>`}
        </div>
      </div>
    </div>`;
  }

  function renderColoredCode(code) {
    return SLOTS.map(
      (slot, i) => `<span class="${slotClass(i)}">${slot.glyph}${code[i]}</span>`,
    ).join(" ");
  }

  function onInput(event) {
    if (event.target && event.target.name === "seed") {
      ui.seedInput = event.target.value;
    }
  }

  function onKey(event) {
    if (event.key !== "Escape") return;
    if (ui.howto) {
      ui.howto = false;
      paint();
      return;
    }
    if (ui.explain) {
      ui.explain = false;
      paint();
      return;
    }
    if (session && session.quitPrompt) {
      applyTutorial(session, { type: "cancel-quit" });
      paint();
      return;
    }
    if (session && !session.exited && session.step !== "done") {
      applyTutorial(session, { type: "request-quit" });
      paint();
    }
  }

  function onClick(event) {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case "difficulty":
        ui.difficulty = el.dataset.diff;
        paint();
        break;
      case "start":
        begin({ seed: ui.seedInput || randomSeedString(), difficulty: ui.difficulty });
        break;
      case "start-tutorial":
        startTutorial();
        break;
      case "tutorial-continue":
        if (session) applyTutorial(session, { type: "continue" });
        paint();
        break;
      case "request-quit":
        if (session) applyTutorial(session, { type: "request-quit" });
        paint();
        break;
      case "cancel-quit":
        if (session) applyTutorial(session, { type: "cancel-quit" });
        paint();
        break;
      case "confirm-quit":
        if (session) applyTutorial(session, { type: "confirm-quit" });
        goMenu();
        break;
      case "reset-tutorial":
        resetMission();
        break;
      case "open-explain":
        if (state && isExplanationAllowed(state.phase)) ui.explain = true;
        paint();
        break;
      case "close-explain":
        ui.explain = false;
        paint();
        break;
      case "howto":
        ui.howto = true;
        paint();
        break;
      case "close-howto":
        ui.howto = false;
        paint();
        break;
      case "home":
        if (session && !session.exited && session.step !== "done") {
          applyTutorial(session, { type: "request-quit" });
          paint();
        } else {
          goMenu();
        }
        break;
      case "new-game":
        begin({ seed: randomSeedString(), difficulty: state ? state.difficulty : ui.difficulty });
        break;
      case "replay":
        begin({ seed: state.seed, difficulty: state.difficulty });
        break;
      case "copy":
        copyLink();
        break;
      case "set-digit": {
        const slot = Number(el.dataset.slot);
        const digit = Number(el.dataset.digit);
        if (session) applyTutorial(session, { type: "set-digit", slot, digit });
        else setDigit(state, slot, digit);
        playSfx("click");
        paint();
        break;
      }
      case "toggle-fw": {
        const index = Number(el.dataset.index);
        if (session) applyTutorial(session, { type: "toggle-fw", index });
        else toggleVerifier(state, index);
        playSfx("click");
        paint();
        break;
      }
      case "query": {
        const res = session
          ? applyTutorial(session, { type: "query" })
          : interrogate(state);
        if (res && res.ok) playSfx("query");
        paint();
        break;
      }
      case "hack": {
        if (session) {
          applyTutorial(session, { type: "hack" });
        } else {
          const res = launchHack(state);
          if (res.ok) {
            playSfx(res.win ? "win" : "lose");
            audio.enterResults(res.win ? "won" : "lost");
          }
        }
        paint();
        break;
      }
      case "toggle-sound":
        audio.toggle();
        paint();
        break;
      case "nb-digit": {
        const slot = Number(el.dataset.slot);
        const digit = Number(el.dataset.digit);
        if (session) applyTutorial(session, { type: "nb-digit", slot, digit });
        else toggleNotebookDigit(state, slot, digit);
        paint();
        break;
      }
      case "nb-crit": {
        const index = Number(el.dataset.index);
        const criterionId = el.dataset.crit;
        if (session) applyTutorial(session, { type: "nb-crit", index, criterionId });
        else toggleNotebookCriterion(state, index, criterionId);
        paint();
        break;
      }
      default:
        break;
    }
  }

  async function copyLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copie le lien :", url);
    }
    ui.copied = true;
    paint();
    setTimeout(() => {
      ui.copied = false;
      paint();
    }, 1600);
  }
}
