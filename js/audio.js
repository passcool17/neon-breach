/**
 * Contrôleur audio : coupé par défaut, geste requis, pas de pile de lecteurs.
 * Les pistes sont identifiées par leurs titres ID3 (voir media/SOURCES.md).
 */

import { assetUrl } from "./assets.js";

export const SOUND_STORAGE_KEY = "neon-breach-sound";
export const BG_VOLUME = 0.28;
export const STING_VOLUME = 0.55;

export const TRACKS = {
  bg: {
    id: "bg",
    file: "media/audio/silent-circuit.mp3",
    title: "Neon Breach — Silent Circuit",
    loop: true,
    volume: BG_VOLUME,
    role: "background",
  },
  victory: {
    id: "victory",
    file: "media/audio/access-granted.mp3",
    title: "Neon Breach — Access Granted",
    loop: false,
    volume: STING_VOLUME,
    role: "victory",
  },
  failure: {
    id: "failure",
    file: "media/audio/access-denied.mp3",
    title: "Neon Breach — Access Denied",
    loop: false,
    volume: STING_VOLUME,
    role: "failure",
  },
};

function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return {
    getItem() {
      return null;
    },
    setItem() {},
  };
}

export function readSoundPref(storage = defaultStorage()) {
  try {
    return storage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSoundPref(on, storage = defaultStorage()) {
  try {
    storage.setItem(SOUND_STORAGE_KEY, on ? "on" : "off");
  } catch {
    // mode privé / quota
  }
}

export function createAudioController(options = {}) {
  const AudioCtor = options.Audio || (typeof Audio !== "undefined" ? Audio : null);
  const storage = options.storage || defaultStorage();
  const elements = Object.create(null);

  const state = {
    enabled: readSoundPref(storage),
    unlocked: false,
    scene: "idle",
    result: null,
    hidden: false,
    lastError: null,
  };

  function ensureEl(id) {
    if (!AudioCtor) return null;
    if (!elements[id]) {
      const track = TRACKS[id];
      const el = new AudioCtor(assetUrl(track.file));
      el.loop = track.loop;
      el.preload = "none";
      el.volume = track.volume;
      elements[id] = el;
    }
    return elements[id];
  }

  function stopEl(id) {
    const el = elements[id];
    if (!el) return;
    el.pause();
    try {
      el.currentTime = 0;
    } catch {
      // certains mocks n'ont pas currentTime mutable
    }
  }

  function pauseEl(id) {
    const el = elements[id];
    if (el && !el.paused) el.pause();
  }

  function stopAll() {
    stopEl("bg");
    stopEl("victory");
    stopEl("failure");
  }

  function canPlay() {
    return Boolean(state.enabled && state.unlocked && !state.hidden);
  }

  async function tryPlay(el) {
    if (!el) return { ok: false, reason: "no-audio" };
    try {
      const pending = el.play();
      if (pending && typeof pending.then === "function") await pending;
      return { ok: true };
    } catch (err) {
      state.lastError = String(err && err.message ? err.message : err);
      return { ok: false, reason: "rejected", error: state.lastError };
    }
  }

  async function startBg({ reset = false } = {}) {
    if (!canPlay() || state.scene !== "play") {
      return { ok: false, reason: "blocked" };
    }
    const el = ensureEl("bg");
    if (!el) return { ok: false, reason: "no-audio" };
    if (reset) {
      try {
        el.currentTime = 0;
      } catch {
        // ignore
      }
    }
    if (!el.paused && !reset) return { ok: true, already: true };
    return tryPlay(el);
  }

  async function playSting(kind) {
    if (!canPlay() || state.scene !== "results") {
      return { ok: false, reason: "blocked" };
    }
    const id = kind === "won" ? "victory" : "failure";
    const other = id === "victory" ? "failure" : "victory";
    stopEl(other);
    const el = ensureEl(id);
    if (!el) return { ok: false, reason: "no-audio" };
    try {
      el.currentTime = 0;
    } catch {
      // ignore
    }
    return tryPlay(el);
  }

  const controller = {
    getState() {
      return { ...state };
    },
    isEnabled() {
      return state.enabled;
    },
    elements,
    async noteGesture() {
      state.unlocked = true;
      if (state.enabled && !state.hidden && state.scene === "play") {
        return startBg({ reset: false });
      }
      return { ok: true, unlocked: true };
    },
    async setEnabled(on) {
      state.enabled = Boolean(on);
      writeSoundPref(state.enabled, storage);
      state.unlocked = true;
      if (!state.enabled) {
        stopAll();
        return { ok: true, enabled: false };
      }
      if (state.scene === "play") return startBg({ reset: false });
      if (state.scene === "results" && state.result) return playSting(state.result);
      return { ok: true, enabled: true };
    },
    toggle() {
      return controller.setEnabled(!state.enabled);
    },
    enterIdle() {
      state.scene = "idle";
      state.result = null;
      stopAll();
    },
    enterPlay() {
      stopEl("victory");
      stopEl("failure");
      stopEl("bg");
      state.scene = "play";
      state.result = null;
      return startBg({ reset: true });
    },
    enterResults(kind) {
      state.scene = "results";
      state.result = kind === "won" ? "won" : "lost";
      stopEl("bg");
      return playSting(state.result);
    },
    setHidden(hidden) {
      state.hidden = Boolean(hidden);
      if (state.hidden) {
        pauseEl("bg");
        pauseEl("victory");
        pauseEl("failure");
        return { ok: true, hidden: true };
      }
      if (state.enabled && state.unlocked && state.scene === "play") {
        return startBg({ reset: false });
      }
      return { ok: true, hidden: false };
    },
    stopAll,
  };

  return controller;
}
