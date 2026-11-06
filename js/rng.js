/** RNG déterministe à partir d'une graine texte (FNV-1a + mulberry32). */

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const next = mulberry32(hashSeed(String(seed)));
  return {
    next,
    int(n) {
      return Math.floor(next() * n);
    },
    pick(arr) {
      return arr[Math.floor(next() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
      return a;
    },
  };
}

const SEED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomSeedString(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)];
  }
  return out;
}

export function normalizeSeed(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
  return cleaned || randomSeedString();
}
