/**
 * Vérifie que les médias livrés sont bien là, et que les substituts ne le sont pas.
 *   node test/assets.test.js
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ASSET_VERSION, IMAGES, assetUrl, firewallIcon } from "../js/assets.js";
import { TRACKS, SOUND_STORAGE_KEY, BG_VOLUME } from "../js/audio.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function assert(cond, message) {
  if (cond) passed += 1;
  else {
    failed += 1;
    console.error("  ✖", message);
  }
}

console.log("▸ Fichiers visuels");
assert(ASSET_VERSION.length > 0, "ASSET_VERSION est défini");
assert(assetUrl(IMAGES.logo).includes(`v=${ASSET_VERSION}`), "assetUrl ajoute la version");
assert(existsSync(join(root, IMAGES.logo)), "logo présent");
assert(existsSync(join(root, IMAGES.fondPaysage)), "fond paysage présent");
assert(existsSync(join(root, IMAGES.fondPortrait)), "fond portrait présent");
assert(existsSync(join(root, IMAGES.win)), "bannière victoire (webp) présente");
assert(existsSync(join(root, IMAGES.lose)), "bannière échec (webp) présente");
assert(existsSync(join(root, "media/ecran-victoire.png")), "PNG victoire source conservé");
assert(existsSync(join(root, "media/ecran-echec.png")), "PNG échec source conservé");
assert(!existsSync(join(root, "media/apercu.png")), "apercu.png n'est pas livré");

for (const letter of ["A", "B", "C", "D", "E", "F"]) {
  const path = firewallIcon(letter);
  assert(path === `media/pare-feu-${letter}.png`, `chemin pare-feu ${letter}`);
  assert(existsSync(join(root, path)), `pare-feu ${letter} présent`);
  assert(statSync(join(root, path)).size > 1000, `pare-feu ${letter} non vide`);
}

assert(statSync(join(root, IMAGES.logo)).size > 10000, "logo non vide");
assert(statSync(join(root, IMAGES.fondPaysage)).size > 10000, "fond paysage non vide");
assert(statSync(join(root, IMAGES.fondPortrait)).size > 5000, "fond portrait non vide");

console.log("▸ Fichiers audio (copies utilisateur)");
assert(TRACKS.bg.title === "Neon Breach — Silent Circuit", "titre fond = Silent Circuit");
assert(TRACKS.victory.title === "Neon Breach — Access Granted", "titre victoire = Access Granted");
assert(TRACKS.failure.title === "Neon Breach — Access Denied", "titre échec = Access Denied");
assert(TRACKS.bg.loop === true, "le fond boucle");
assert(TRACKS.victory.loop === false && TRACKS.failure.loop === false, "les jingles ne bouclent pas");
assert(BG_VOLUME > 0 && BG_VOLUME < 0.5, "volume de fond doux (< 0.5)");
assert(SOUND_STORAGE_KEY === "neon-breach-sound", "clé localStorage");

for (const track of Object.values(TRACKS)) {
  const full = join(root, track.file);
  assert(existsSync(full), `${track.file} présent`);
  assert(statSync(full).size > 10000, `${track.file} non vide`);
}

assert(statSync(join(root, TRACKS.bg.file)).size === 4863455, "fond : taille de la copie utilisateur");
assert(statSync(join(root, TRACKS.victory.file)).size === 452753, "victoire : taille de la copie utilisateur");
assert(statSync(join(root, TRACKS.failure.file)).size === 197222, "échec : taille de la copie utilisateur");
assert(!existsSync(join(root, "media/audio/neon-breach-bg-loop.mp3")), "pas le substitut bg-loop");
assert(!existsSync(join(root, "media/audio/neon-breach-victory.mp3")), "pas le substitut victory");
assert(!existsSync(join(root, "media/audio/neon-breach-failure.mp3")), "pas le substitut failure");

console.log("▸ SOURCES.md");
const sources = readFileSync(join(root, "media/SOURCES.md"), "utf8");
assert(sources.includes("fournis par l’utilisateur") || sources.includes("fournis par l'utilisateur"), "SOURCES dit audio fourni par l'utilisateur");
assert(sources.includes("Les droits n’ont pas été vérifiés") || sources.includes("Les droits n'ont pas été vérifiés"), "SOURCES dit que les droits n'ont pas été vérifiés");
assert(sources.includes("Silent Circuit") && sources.includes("Access Granted") && sources.includes("Access Denied"), "SOURCES nomme les trois titres ID3");
assert(sources.includes("apercu.png"), "SOURCES mentionne apercu non utilisé");
assert(!sources.toLowerCase().includes("licence commerciale accordée"), "SOURCES ne revendique pas de licence");

console.log(`\n────────────────────────────────`);
console.log(`Résultat : ${passed} succès, ${failed} échec${failed > 1 ? "s" : ""}`);
if (failed) process.exit(1);
console.log("Tous les tests assets passent.");
