/** Catalogue des familles de pare-feu et de leurs critères cachés. */

export const DIGIT_MIN = 1;
export const DIGIT_MAX = 5;

export const SLOTS = [
  { index: 0, glyph: "▲", name: "cyan" },
  { index: 1, glyph: "■", name: "magenta" },
  { index: 2, glyph: "●", name: "jaune" },
];

export function allCodes() {
  const out = [];
  for (let t = 1; t <= DIGIT_MAX; t++) {
    for (let s = 1; s <= DIGIT_MAX; s++) {
      for (let c = 1; c <= DIGIT_MAX; c++) {
        out.push([t, s, c]);
      }
    }
  }
  return out;
}

export const ALL_CODES = allCodes();

export function codeKey(code) {
  return `${code[0]}${code[1]}${code[2]}`;
}

export function codesEqual(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function formatCode(code) {
  return `${SLOTS[0].glyph}${code[0]} ${SLOTS[1].glyph}${code[1]} ${SLOTS[2].glyph}${code[2]}`;
}

export function acceptanceSet(criterion, codes = ALL_CODES) {
  return codes.filter((code) => criterion.test(code));
}

export function acceptanceKey(criterion, codes = ALL_CODES) {
  return acceptanceSet(criterion, codes).map(codeKey).sort().join(",");
}

export function familyUnambiguous(family, codes = ALL_CODES) {
  const keys = family.criteria.map((cr) => acceptanceKey(cr, codes));
  return new Set(keys).size === keys.length;
}

export function criterionUnambiguousInFamily(family, criterion, codes = ALL_CODES) {
  const key = acceptanceKey(criterion, codes);
  return family.criteria.filter((cr) => acceptanceKey(cr, codes) === key).length === 1;
}

function sum(code) {
  return code[0] + code[1] + code[2];
}

function evenCount(code) {
  return (code[0] % 2 === 0) + (code[1] % 2 === 0) + (code[2] % 2 === 0);
}

function countDigit(code, n) {
  return (code[0] === n) + (code[1] === n) + (code[2] === n);
}

function cmpConst(index, glyph, n, pool) {
  const tag = ["t", "s", "c"][index];
  return {
    id: `cmp-${tag}-${n}`,
    label: `Compare ${glyph} à ${n}`,
    pool,
    criteria: [
      { id: `${tag}-lt-${n}`, label: `${glyph} < ${n}`, test: (c) => c[index] < n },
      { id: `${tag}-eq-${n}`, label: `${glyph} = ${n}`, test: (c) => c[index] === n },
      { id: `${tag}-gt-${n}`, label: `${glyph} > ${n}`, test: (c) => c[index] > n },
    ],
  };
}

function parity(index, glyph) {
  const tag = ["t", "s", "c"][index];
  return {
    id: `par-${tag}`,
    label: `Parité de ${glyph}`,
    pool: "easy",
    criteria: [
      { id: `${tag}-even`, label: `${glyph} est pair`, test: (c) => c[index] % 2 === 0 },
      { id: `${tag}-odd`, label: `${glyph} est impair`, test: (c) => c[index] % 2 === 1 },
    ],
  };
}

function cmpPair(i, j, g1, g2) {
  const tags = ["t", "s", "c"];
  return {
    id: `cmp-${tags[i]}-${tags[j]}`,
    label: `Comparaison ${g1} vs ${g2}`,
    pool: "easy",
    criteria: [
      { id: `${tags[i]}-lt-${tags[j]}`, label: `${g1} < ${g2}`, test: (c) => c[i] < c[j] },
      { id: `${tags[i]}-eq-${tags[j]}`, label: `${g1} = ${g2}`, test: (c) => c[i] === c[j] },
      { id: `${tags[i]}-gt-${tags[j]}`, label: `${g1} > ${g2}`, test: (c) => c[i] > c[j] },
    ],
  };
}

export const FAMILIES = [
  cmpConst(0, "▲", 3, "easy"),
  cmpConst(1, "■", 3, "easy"),
  cmpConst(2, "●", 3, "easy"),
  parity(0, "▲"),
  parity(1, "■"),
  parity(2, "●"),
  cmpPair(0, 1, "▲", "■"),
  cmpPair(0, 2, "▲", "●"),
  cmpPair(1, 2, "■", "●"),
  {
    id: "repeats-simple",
    label: "Doublons/répétitions",
    pool: "easy",
    criteria: [
      {
        id: "all-diff",
        label: "Tous les chiffres sont différents",
        test: (c) => new Set(c).size === 3,
      },
      {
        id: "has-dup",
        label: "Au moins un doublon",
        test: (c) => new Set(c).size < 3,
      },
    ],
  },
  {
    id: "even-count",
    label: "Nombre de chiffres pairs",
    pool: "medium",
    criteria: [
      { id: "ev-0", label: "0 chiffre pair", test: (c) => evenCount(c) === 0 },
      { id: "ev-1", label: "1 chiffre pair", test: (c) => evenCount(c) === 1 },
      { id: "ev-2", label: "2 chiffres pairs", test: (c) => evenCount(c) === 2 },
      { id: "ev-3", label: "3 chiffres pairs", test: (c) => evenCount(c) === 3 },
    ],
  },
  {
    id: "sum-9",
    label: "Somme des chiffres",
    pool: "medium",
    criteria: [
      { id: "sum-lt-9", label: "Somme < 9", test: (c) => sum(c) < 9 },
      { id: "sum-eq-9", label: "Somme = 9", test: (c) => sum(c) === 9 },
      { id: "sum-gt-9", label: "Somme > 9", test: (c) => sum(c) > 9 },
    ],
  },
  cmpConst(0, "▲", 4, "medium"),
  cmpConst(1, "■", 4, "medium"),
  cmpConst(2, "●", 4, "medium"),
  {
    id: "which-max",
    label: "Quel chiffre est le plus grand",
    pool: "hard",
    criteria: [
      { id: "max-t", label: "▲ est le plus grand (seul)", test: (c) => c[0] > c[1] && c[0] > c[2] },
      { id: "max-s", label: "■ est le plus grand (seul)", test: (c) => c[1] > c[0] && c[1] > c[2] },
      { id: "max-c", label: "● est le plus grand (seul)", test: (c) => c[2] > c[0] && c[2] > c[1] },
      {
        id: "max-tie",
        label: "Égalité en tête",
        test: (c) => {
          const m = Math.max(c[0], c[1], c[2]);
          return (c[0] === m) + (c[1] === m) + (c[2] === m) > 1;
        },
      },
    ],
  },
  {
    id: "repeats-detail",
    label: "Doublons/répétitions",
    pool: "hard",
    criteria: [
      { id: "rep-diff", label: "Tous différents", test: (c) => new Set(c).size === 3 },
      {
        id: "rep-ts",
        label: "▲ et ■ identiques, ● différent",
        test: (c) => c[0] === c[1] && c[0] !== c[2],
      },
      {
        id: "rep-tc",
        label: "▲ et ● identiques, ■ différent",
        test: (c) => c[0] === c[2] && c[0] !== c[1],
      },
      {
        id: "rep-sc",
        label: "■ et ● identiques, ▲ différent",
        test: (c) => c[1] === c[2] && c[1] !== c[0],
      },
      {
        id: "rep-triple",
        label: "Les trois chiffres identiques",
        test: (c) => c[0] === c[1] && c[1] === c[2],
      },
    ],
  },
  {
    id: "order",
    label: "Ordre des chiffres",
    pool: "hard",
    criteria: [
      { id: "ord-asc", label: "▲ < ■ < ●", test: (c) => c[0] < c[1] && c[1] < c[2] },
      { id: "ord-desc", label: "▲ > ■ > ●", test: (c) => c[0] > c[1] && c[1] > c[2] },
      {
        id: "ord-none",
        label: "Ni strictement croissant ni décroissant",
        test: (c) => !((c[0] < c[1] && c[1] < c[2]) || (c[0] > c[1] && c[1] > c[2])),
      },
    ],
  },
  {
    id: "sum-7",
    label: "Somme des chiffres vs 7",
    pool: "hard",
    criteria: [
      { id: "sum-lt-7", label: "Somme < 7", test: (c) => sum(c) < 7 },
      { id: "sum-eq-7", label: "Somme = 7", test: (c) => sum(c) === 7 },
      { id: "sum-gt-7", label: "Somme > 7", test: (c) => sum(c) > 7 },
    ],
  },
  {
    id: "smallest",
    label: "Valeur du plus petit chiffre",
    pool: "hard",
    criteria: [
      { id: "min-1", label: "Le plus petit est 1", test: (c) => Math.min(c[0], c[1], c[2]) === 1 },
      { id: "min-2", label: "Le plus petit est 2", test: (c) => Math.min(c[0], c[1], c[2]) === 2 },
      { id: "min-3", label: "Le plus petit est 3", test: (c) => Math.min(c[0], c[1], c[2]) === 3 },
      { id: "min-ge-4", label: "Le plus petit est ≥ 4", test: (c) => Math.min(c[0], c[1], c[2]) >= 4 },
    ],
  },
  {
    id: "count-threes",
    label: "Nombre de 3",
    pool: "hard",
    criteria: [
      { id: "threes-0", label: "Aucun 3", test: (c) => countDigit(c, 3) === 0 },
      { id: "threes-1", label: "Exactement un 3", test: (c) => countDigit(c, 3) === 1 },
      { id: "threes-2plus", label: "Au moins deux 3", test: (c) => countDigit(c, 3) >= 2 },
    ],
  },
];

export const DIFFICULTIES = {
  facile: { id: "facile", label: "Facile", n: 4, pools: ["easy"], requirePool: null, requireCount: 0 },
  moyen: { id: "moyen", label: "Moyen", n: 5, pools: ["easy", "medium"], requirePool: "medium", requireCount: 1 },
  difficile: { id: "difficile", label: "Difficile", n: 6, pools: ["easy", "medium", "hard"], requirePool: "hard", requireCount: 2 },
};

export function getFamily(familyId) {
  const family = FAMILIES.find((f) => f.id === familyId);
  if (!family) throw new Error(`Famille inconnue: ${familyId}`);
  return family;
}

export function getCriterion(familyId, criterionId) {
  const criterion = getFamily(familyId).criteria.find((c) => c.id === criterionId);
  if (!criterion) throw new Error(`Critère inconnu: ${familyId}/${criterionId}`);
  return criterion;
}

export function familiesForDifficulty(difficulty) {
  const cfg = DIFFICULTIES[difficulty];
  if (!cfg) throw new Error(`Difficulté inconnue: ${difficulty}`);
  return FAMILIES.filter((family) => {
    if (!cfg.pools.includes(family.pool)) return false;
    // Le détail des doublons remplace la version simple en difficile.
    if (difficulty === "difficile" && family.id === "repeats-simple") return false;
    if (difficulty !== "difficile" && family.id === "repeats-detail") return false;
    return true;
  });
}
