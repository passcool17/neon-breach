/**
 * Machine d'état audio, sans navigateur — Audio est mocké.
 *   node test/audio.test.js
 */
import {
  BG_VOLUME,
  SOUND_STORAGE_KEY,
  TRACKS,
  createAudioController,
  readSoundPref,
} from "../js/audio.js";

let passed = 0;
let failed = 0;

function assert(cond, message) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error("  ✖", message);
  }
}

class FakeAudio {
  static instances = [];
  static rejectPlay = false;
  constructor(src) {
    this.src = src;
    this.loop = false;
    this.preload = "auto";
    this.volume = 1;
    this.paused = true;
    this.currentTime = 0;
    this.playCalls = 0;
    FakeAudio.instances.push(this);
  }
  play() {
    this.playCalls += 1;
    if (FakeAudio.rejectPlay) return Promise.reject(new Error("NotAllowedError"));
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    data,
  };
}

function resetAudio() {
  FakeAudio.instances = [];
  FakeAudio.rejectPlay = false;
}

async function suite() {
  console.log("▸ Préférence par défaut");
  {
    const storage = memoryStorage();
    assert(readSoundPref(storage) === false, "sans clé : son coupé");
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    assert(ctrl.isEnabled() === false, "contrôleur : disabled par défaut");
    await ctrl.enterPlay();
    assert(FakeAudio.instances.length === 0, "aucune lecture sans activation");
  }

  console.log("▸ Geste requis même si la préférence est on");
  {
    resetAudio();
    const storage = memoryStorage({ [SOUND_STORAGE_KEY]: "on" });
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    assert(ctrl.isEnabled() === true, "préférence on relue");
    await ctrl.enterPlay();
    assert(
      !FakeAudio.instances.some((el) => !el.paused),
      "pas de lecture avant geste (page avec pref on)",
    );
    await ctrl.noteGesture();
    const bg = FakeAudio.instances.find((el) => String(el.src).includes("silent-circuit"));
    assert(bg && !bg.paused, "après geste : le fond part");
    assert(bg.loop === true, "le fond est en boucle");
    assert(bg.volume === BG_VOLUME, "volume de fond doux");
  }

  console.log("▸ Toggle + persistance");
  {
    resetAudio();
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    await ctrl.enterPlay();
    await ctrl.setEnabled(true);
    assert(storage.getItem(SOUND_STORAGE_KEY) === "on", "préférence persistée à on");
    assert(FakeAudio.instances.some((el) => String(el.src).includes("silent-circuit") && !el.paused), "toggle on en partie : fond");
    await ctrl.setEnabled(false);
    assert(storage.getItem(SOUND_STORAGE_KEY) === "off", "préférence persistée à off");
    assert(FakeAudio.instances.every((el) => el.paused), "tout est stoppé quand on coupe");
  }

  console.log("▸ Résultats : stop fond + jingle");
  {
    resetAudio();
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    await ctrl.setEnabled(true);
    await ctrl.enterPlay();
    const bg = FakeAudio.instances.find((el) => String(el.src).includes("silent-circuit"));
    assert(bg && !bg.paused, "fond actif pendant la partie");
    await ctrl.enterResults("won");
    assert(bg.paused, "fond coupé à l'écran de victoire");
    const win = FakeAudio.instances.find((el) => String(el.src).includes("access-granted"));
    assert(win && !win.paused, "jingle Access Granted");
    assert(win.loop === false, "le jingle ne boucle pas");
    await ctrl.enterResults("lost");
    assert(win.paused, "l'ancien jingle s'arrête");
    const lose = FakeAudio.instances.find((el) => String(el.src).includes("access-denied"));
    assert(lose && !lose.paused, "jingle Access Denied");
  }

  console.log("▸ Nouvelle partie : pas de pile");
  {
    resetAudio();
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    await ctrl.setEnabled(true);
    await ctrl.enterPlay();
    await ctrl.enterResults("won");
    await ctrl.enterPlay();
    const bgs = FakeAudio.instances.filter((el) => String(el.src).includes("silent-circuit"));
    const wins = FakeAudio.instances.filter((el) => String(el.src).includes("access-granted"));
    assert(bgs.length === 1, "un seul élément Audio pour le fond");
    assert(wins.length === 1, "un seul élément Audio pour la victoire");
    assert(bgs[0] && !bgs[0].paused, "fond relancé sur la nouvelle partie");
    assert(wins[0].paused, "jingle de victoire stoppé");
  }

  console.log("▸ Onglet caché");
  {
    resetAudio();
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    await ctrl.setEnabled(true);
    await ctrl.enterPlay();
    const bg = FakeAudio.instances[0];
    await ctrl.setHidden(true);
    assert(bg.paused, "pause quand l'onglet est caché");
    const time = bg.currentTime;
    await ctrl.setHidden(false);
    assert(!bg.paused, "reprise en revenant sur l'onglet");
    assert(FakeAudio.instances.filter((el) => String(el.src).includes("silent-circuit")).length === 1, "pas de nouveau lecteur au retour");
    assert(typeof time === "number", "currentTime préservé (pas recréé)");
  }

  console.log("▸ Rejet de play()");
  {
    resetAudio();
    FakeAudio.rejectPlay = true;
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    let threw = false;
    try {
      await ctrl.setEnabled(true);
      await ctrl.enterPlay();
    } catch {
      threw = true;
    }
    assert(!threw, "un play() rejeté ne fait pas planter");
    assert(String(ctrl.getState().lastError).includes("NotAllowedError"), "l'erreur est enregistrée");
  }

  console.log("▸ Retour accueil");
  {
    resetAudio();
    FakeAudio.rejectPlay = false;
    const storage = memoryStorage();
    const ctrl = createAudioController({ Audio: FakeAudio, storage });
    await ctrl.setEnabled(true);
    await ctrl.enterPlay();
    ctrl.enterIdle();
    assert(FakeAudio.instances.every((el) => el.paused), "tout s'arrête à l'accueil");
    assert(ctrl.getState().scene === "idle", "scène idle");
  }

  console.log("▸ Catalogue");
  {
    assert(TRACKS.bg.file.endsWith("silent-circuit.mp3"), "fichier fond");
    assert(TRACKS.victory.file.endsWith("access-granted.mp3"), "fichier victoire");
    assert(TRACKS.failure.file.endsWith("access-denied.mp3"), "fichier échec");
  }

  console.log(`\n────────────────────────────────`);
  console.log(`Résultat : ${passed} succès, ${failed} échec${failed > 1 ? "s" : ""}`);
  if (failed) process.exit(1);
  console.log("Tous les tests audio passent.");
}

await suite();
