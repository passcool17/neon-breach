# Néon Breach Training + Solution Explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated FACILE1 training mission and a post-game « Comprendre la solution » panel, exactly as approved in `docs/superpowers/specs/2026-11-06-neon-breach-training-design.md`.

**Architecture:** Keep puzzle rules in the existing engine. Add two focused modules: `js/explain.js` (hindsight counts via real predicates + log evidence) and `js/tutorial.js` (session/step machine that gates mutations). `game.js` only gains a `tutorial` flag so records are neither read nor written. `ui.js` wires menu, coach, quit/reset, and the explanation overlay without new assets or audio tracks.

**Tech Stack:** HTML/CSS/vanilla JS ES modules, Node tests without a framework (same style as `test/generator.test.js`).

## Global Constraints

- No change to normal game rules, generator, max 3 queries, or scoring for rated games.
- No new media/assets; preserve current visuals and audio files.
- Tutorial never writes or reads `neon-breach-best`; never calls `audio.enterPlay` / `audio.enterResults`; sound preference untouched; `enterIdle()` on exit.
- Tutorial does not write `?seed=FACILE1&d=facile`.
- Never reveal hidden criteria while `phase === "play"` (or tutorial not finished).
- Hindsight explanations (verifier order, 125 → …) stay visually and logically separate from log evidence.
- Zero-query games: say so, invent no deduction trail.
- Invalid/out-of-sequence tutorial actions do not mutate game state.
- One publishing commit of text files only to existing `v1` (no force-push, no merge, no extra PR, no media reupload).
- Cache version bump: `ASSET_VERSION` → `20261106-train1`.

## File map

- Create: `js/explain.js`, `js/tutorial.js`, `test/explain.test.js`, `test/tutorial.test.js`
- Modify: `js/game.js` (tutorial flag; skip record read/write), `js/ui.js`, `js/assets.js`, `index.html`, `css/style.css`, `package.json`, `README.md`, `GAME.md`
- Already added: `docs/superpowers/specs/2026-11-06-neon-breach-training-design.md`
- Do not modify: `js/generator.js`, `js/criteria.js`, `js/audio.js` internals, anything under `media/`

### Task 1: Hindsight + evidence explanations

**Files:** Create `js/explain.js`, `test/explain.test.js`

**Produces:**
- `isExplanationAllowed(phase)` → true iff `phase` is `"won"` or `"lost"`
- `hindsightSteps(puzzle)` → `{ start: 125, steps: [{ letter, familyLabel, chosenId, chosenLabel, before, after, remaining }] }` where `remaining` is an array of codes if `after <= 10`, else `null`. Uses `getCriterion` + filter over `ALL_CODES`, verifier order.
- `evidenceFromLog(puzzle, log)` → `{ emptyLog, queries: [{ round, code, letter, pass, eliminated: [{id,label}], kept: [{id,label}] }], leftoverCodes, leftoverCount }`

- [ ] Write `test/explain.test.js` covering: FACILE1 hindsight 125→50→10→2→1 with remainders 131–135+231–235 then 131+232 then 232; `isExplanationAllowed('play')===false`; evidence for log manches 133 A/B ✔ and 132 C✖ D✔ matching notebook elims; leftover `{232}`; empty log sets `emptyLog` and does not invent leftover codes; a second seed (`TEST01` moyen/facile) hindsight ends at count 1 equal to `puzzle.solution`.
- [ ] Run `node test/explain.test.js` and confirm it fails (module missing).
- [ ] Implement `js/explain.js` with real engine predicates only.
- [ ] Re-run until pass.

### Task 2: Tutorial session machine + record isolation

**Files:** Create `js/tutorial.js`, `test/tutorial.test.js`; Modify `js/game.js`

**Produces:**
- `createGame({ seed, difficulty, tutorial })` sets `state.tutorial`; if tutorial, `record` is `null` (no `loadBests` read).
- `launchHack(state)` on win: if `state.tutorial`, do not call `saveBestIfBetter`; `isNewRecord=false`, `record` stays null; still sets `phase` and `score`.
- `TUTORIAL_SEED="FACILE1"`, `TUTORIAL_DIFFICULTY="facile"`
- `createTutorialSession()` → `{ game, step: "welcome", quitPrompt: false }` with `game.tutorial===true` and solution `[2,3,2]`
- `resetTutorial(session)` → same puzzle, empty log/notebook, code `[3,3,3]`, step `"compose133"`, `quitPrompt` false
- `applyTutorial(session, action)` actions: `continue`, `set-digit`, `toggle-fw`, `query`, `nb-digit`, `nb-crit`, `hack`, `request-quit`, `confirm-quit`, `cancel-quit`
- `coachCopy(session)` text for the current step (French); must not name hidden C/D rules before the evidence steps that justify them
- `isTutorialFinished(session)` / hidden criteria not exposed via coach before `done`

Gating:
- `continue` only from `welcome` → `compose133`
- `set-digit` allowed on compose/query/hack steps only
- `toggle-fw` only indexes `{0,1}` during `queryAB` and `{2,3}` during `queryCD`
- `query` mutates via real `interrogate` only if code `[1,3,3]` + selected `{0,1}` (`queryAB` → `notebookAB`) or code `[1,3,2]` + selected `{2,3}` (`queryCD` → `notebookCD`)
- `nb-*` during `notebookAB` only the chips: A `t-eq-3`,`t-gt-3`; B `s-lt-3`,`s-gt-3`; digits ▲ 3,4,5 and ■ 1,2,4,5. Advance when all are crossed → `compose132`
- `notebookCD` only: C `t-lt-c`; D `c-odd`; digits ● 1,3,5. Advance when all crossed → `hack232`
- `hack` mutates via real `launchHack` only on `hack232` with code `[2,3,2]` → `done`, `phase==="won"`
- Any other action: `{ ok: false, mutated: false }` and identical snapshot of game fields (`log`, `rounds`, `queries`, `notebook`, `selected`, `testCode`, `phase`)

- [ ] Write `test/tutorial.test.js` for FACILE1 solution/criteria; walkthrough 133 A/B then 132 C/D; notebook lists; out-of-sequence query/hack/wrong chip do not mutate; reveal/coach does not leak `chosenId` labels as given truth before finish; records untouched (tutorial `record===null`, `isNewRecord===false` after win); reset returns to `compose133` with empty log; confirm-quit flag.
- [ ] Run and confirm fail.
- [ ] Implement `game.js` flag + `tutorial.js`.
- [ ] Re-run until pass.

### Task 3: UI wiring (no new assets)

**Files:** Modify `js/ui.js`, `css/style.css`, `js/assets.js`, `index.html`

- Menu button `data-testid="btn-tutorial"` « Mission d'entraînement » starts session, no URL seed write, no `audio.enterPlay`.
- Welcome overlay then play + `aside#coach` (`aria-live="polite"`, `data-testid="coach"`) with step title; highlight `.is-taught` on the named target.
- Header in tutorial: badge « Entraînement », « Recommencer la mission », « Quitter » — no copy-link / nouvelle partie.
- Focus the coach title after a step change only.
- Escape: close howto first; else close explanation; else open quit dialog (`data-testid="quit-tutorial"`).
- `renderEnd`: if tutorial, no record copy; buttons Comprendre / Recommencer / Accueil. If normal win/lose, add « Comprendre la solution » (`data-testid="btn-explain"`).
- Explanation overlay (`data-testid="explain-panel"`): block A hindsight, block B evidence (or zero-query sentence). Hidden while `phase==="play"`.
- Tutorial hack/query go through `applyTutorial`, not raw game mutators.
- On tutorial start/reset: do not `enterPlay`/`enterResults`. On exit: `audio.enterIdle()`. Sound toggle still works.
- Bump `ASSET_VERSION` to `20261106-train1` and the `index.html` cache query.

- [ ] Implement UI/CSS. (No Playwright; parent desktop-tests. Logic covered by unit tests.)

### Task 4: Docs + npm test script

**Files:** Modify `README.md`, `GAME.md`, `package.json` (`npm test` adds `test/explain.test.js` and `test/tutorial.test.js`)

- [ ] Document the mission button, isolated records/audio, and the post-game explanation.
- [ ] Run `npm test` and record exact totals.

### Task 5: Publish

- [ ] Single local commit of text files (no `media/`).
- [ ] Confirm local HEAD still equals `origin/v1` tip (re-fetch) immediately before write.
- [ ] `user-GitHub-xai` `push_files` atomic commit to `passcool17/neon-breach` branch `v1` for changed text files only.
- [ ] Fast-forward local `v1` (no `reset --hard`).
- [ ] Existing PR #1 should pick up the commit; no new PR, no merge.
- [ ] Verify Pages serves `v=20261106-train1` and new modules with matching bytes, not merely HTTP 200.

## Self-review

- Spec mission flow, isolation, explanation split, zero-log, no mid-game reveal, a11y, reset/quit/replay: Tasks 1–3.
- No placeholders. No generator/audio/media edits. No extra PR.
